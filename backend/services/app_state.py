from backend.services.intent_service import IntentService
from backend.services.ner_service import NerService
from backend.services.neo4j_service import Neo4jService
from backend.services.prompt_service import PromptService


intent_service = IntentService()#在 app_state.py 中实例化 IntentService，负责意图识别。
#在 chat_service.stream_chat 调用 intent_service.recognize。


ner_service = NerService() #提供实体提取服务实例，用于从查询中识别实体。


neo4j_service = Neo4jService() #提供知识检索服务实例，用于从知识图谱中提取相关知识。


prompt_service = PromptService() #提供提示词生成与知识检索相关的服务实例


# 服务初始化时自动尝试连接Neo4j
neo4j_service.connect()
