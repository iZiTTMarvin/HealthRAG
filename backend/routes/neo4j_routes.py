from fastapi import APIRouter
from pydantic import BaseModel

from backend.services.app_state import neo4j_service


router = APIRouter(prefix="/api/neo4j", tags=["neo4j"])


class Neo4jConnectRequest(BaseModel):
    password: str | None = None


@router.post("/connect")
def connect(payload: Neo4jConnectRequest):
    neo4j_service.connect(custom_password=payload.password)
    return neo4j_service.status()


@router.get("/status")
def status():
    return neo4j_service.status()
