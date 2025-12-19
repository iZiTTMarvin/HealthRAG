import json
from typing import Dict, Generator, Optional

from ollama import Client

import model_config
from backend.services.app_state import intent_service, ner_service, neo4j_service, prompt_service


class ChatService:
    def stream_chat(
        self,
        query: str,
        model_source: str,
        model_name: str,
        api_key: Optional[str],
        neo4j_password: Optional[str],
    ) -> Generator[bytes, None, None]:
        if not neo4j_service.status().get("connected") and neo4j_password:
            neo4j_service.connect(custom_password=neo4j_password)

        entities = ner_service.get_entities(query)
        intent_result = intent_service.recognize(query, model_name, model_source, api_key)
        prompt, yitu, entities = prompt_service.generate_prompt(
            intent_result, query, neo4j_service.client, entities
        )
        knowledge = prompt_service.extract_knowledge(prompt)

        meta = {
            "type": "meta",
            "intent": yitu,
            "entities": entities,
            "prompt": prompt,
            "knowledge": knowledge,
        }
        yield (json.dumps(meta, ensure_ascii=False) + "\n").encode("utf-8")

        try:
            if model_source == "local":
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

        yield (json.dumps({"type": "done"}, ensure_ascii=False) + "\n").encode("utf-8")
