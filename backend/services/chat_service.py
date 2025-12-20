import json
from typing import Dict, Generator, Optional

from ollama import Client

import model_config
from backend.services.app_state import intent_service, ner_service, neo4j_service, prompt_service

"""
核心问答服务类
该类集成了意图识别、实体提取、知识检索和模型生成等多个子服务，
实现了完整的 RAG (检索增强生成) 工作流。
"""

class ChatService:
    def stream_chat(
        self,
        query: str,
        model_source: str,
        model_name: str,
        api_key: Optional[str],
        neo4j_password: Optional[str],
    ) -> Generator[bytes, None, None]:
        """
        流式问答核心方法。
        
        工作流程：
        1. 检查并连接 Neo4j 数据库。
        2. 调用 NER 服务提取查询中的实体。
        3. 调用意图识别服务判断用户提问意图。
        4. 调用提示词服务从知识图谱中检索信息并生成模型提示词。
        5. 调用语言模型（本地或 API）获取生成的答案并以流的形式返回。
        """
        # 1. 数据库连接处理
        if not neo4j_service.status().get("connected") and neo4j_password:
            neo4j_service.connect(custom_password=neo4j_password)

        # 2. 实体提取
        entities = ner_service.get_entities(query)
        
        # 3. 意图识别
        intent_result = intent_service.recognize(query, model_name, model_source, api_key)
        
        # 4. 生成提示词（包含知识检索）
        prompt, yitu, entities = prompt_service.generate_prompt(
            intent_result, query, neo4j_service.client, entities
        )
        # 提取从图谱中找到的知识，用于前端展示
        knowledge = prompt_service.extract_knowledge(prompt)

        # 5. 发送元数据（Meta）给前端，包含意图、实体、检索到的知识等
        meta = {
            "type": "meta",
            "intent": yitu,
            "entities": entities,
            "prompt": prompt,
            "knowledge": knowledge,
        }
        yield (json.dumps(meta, ensure_ascii=False) + "\n").encode("utf-8")

        # 6. 调用模型生成答案并流式返回增量内容（Delta）
        try:
            if model_source == "local":
                # 调用本地 Ollama
                ollama_client = Client(host="http://127.0.0.1:11434")
                for chunk in ollama_client.chat(
                    model=model_name,
                    messages=[{"role": "user", "content": prompt}],
                    stream=True,
                ):
                    delta = chunk["message"]["content"]
                    yield (json.dumps({"type": "delta", "content": delta}, ensure_ascii=False) + "\n").encode(
                        "utf-8"
                    )
            else:
                # 调用在线 API (硅基流动)
                if not api_key:
                    yield (
                        json.dumps({"type": "error", "message": "请在侧边栏输入硅基流动 API Key"}, ensure_ascii=False)
                        + "\n"
                    ).encode("utf-8")
                else:
                    stream_response = model_config.call_siliconflow(model_name, prompt, api_key, stream=True)
                    for line in stream_response.iter_lines():
                        if not line:
                            continue
                        line = line.decode("utf-8")
                        if not line.startswith("data: "):
                            continue
                        data_str = line[6:]
                        if data_str.strip() == "[DONE]":
                            break
                        try:
                            data = json.loads(data_str)
                            if "choices" in data and len(data["choices"]) > 0:
                                delta = data["choices"][0].get("delta", {}).get("content", "")
                                if delta:
                                    yield (
                                        json.dumps({"type": "delta", "content": delta}, ensure_ascii=False) + "\n"
                                    ).encode("utf-8")
                        except json.JSONDecodeError:
                            continue
        except Exception as exc:
            yield (
                json.dumps({"type": "error", "message": f"生成答案失败: {str(exc)}"}, ensure_ascii=False) + "\n"
            ).encode("utf-8")

        # 7. 标志结束
        yield (json.dumps({"type": "done"}, ensure_ascii=False) + "\n").encode("utf-8")
