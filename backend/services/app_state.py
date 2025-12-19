from backend.services.intent_service import IntentService
from backend.services.ner_service import NerService
from backend.services.neo4j_service import Neo4jService
from backend.services.prompt_service import PromptService


intent_service = IntentService()
ner_service = NerService()
neo4j_service = Neo4jService()
prompt_service = PromptService()

# 服务初始化时自动尝试连接Neo4j
neo4j_service.connect()
