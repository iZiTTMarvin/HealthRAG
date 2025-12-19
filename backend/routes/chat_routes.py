from fastapi import APIRouter
from pydantic import BaseModel
from starlette.responses import StreamingResponse

from backend.services.chat_service import ChatService


router = APIRouter(prefix="/api/chat", tags=["chat"])
chat_service = ChatService()


class ChatRequest(BaseModel):
    query: str
    model_source: str
    model_name: str
    api_key: str | None = None
    neo4j_password: str | None = None


@router.post("/stream")
def stream_chat(payload: ChatRequest):
    generator = chat_service.stream_chat(
        query=payload.query,
        model_source=payload.model_source,
        model_name=payload.model_name,
        api_key=payload.api_key,
        neo4j_password=payload.neo4j_password,
    )
    return StreamingResponse(generator, media_type="application/json")
