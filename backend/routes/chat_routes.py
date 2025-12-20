from fastapi import APIRouter
from pydantic import BaseModel
from starlette.responses import StreamingResponse

from backend.services.chat_service import ChatService

"""
聊天路由模块
负责处理前端发送的对话请求，并返回流式的响应结果。
"""

# 创建 APIRouter 实例，统一设置前缀和标签
router = APIRouter(prefix="/api/chat", tags=["聊天"])
chat_service = ChatService()

class ChatRequest(BaseModel):
    """
    对话请求的数据结构定义
    """
    query: str                    # 用户输入的查询问题
    model_source: str             # 模型来源 ('local' 或 'siliconflow')
    model_name: str               # 模型名称
    api_key: str | None = None    # 硅基流动 API 密钥（可选）
    neo4j_password: str | None = None # Neo4j 数据库密码（可选，用于自动重连）

@router.post("/stream")
def stream_chat(payload: ChatRequest):
    """
    流式对话接口
    接收用户问题，调用后端服务进行意图识别、知识检索和模型生成，并以流的形式返回结果。
    """
    generator = chat_service.stream_chat(
        query=payload.query,
        model_source=payload.model_source,
        model_name=payload.model_name,
        api_key=payload.api_key,
        neo4j_password=payload.neo4j_password,
    )
    # 使用 StreamingResponse 返回生成器产生的内容，每行代表一个 JSON 数据块
    return StreamingResponse(generator, media_type="application/json")
