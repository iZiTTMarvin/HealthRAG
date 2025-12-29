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


# ========== 知识图谱可视化接口 ==========

@router.get("/graph/overview")
def get_graph_overview(limit: int = 100, node_types: str | None = None):
    """
    获取知识图谱概览数据
    
    Args:
        limit: 返回节点数量限制，默认 100
        node_types: 节点类型过滤，多个类型用逗号分隔，如 "疾病,药品"
    """
    node_type_list = None
    if node_types:
        node_type_list = [nt.strip() for nt in node_types.split(",")]
    
    return neo4j_service.get_graph_overview(limit=limit, node_types=node_type_list)


@router.get("/graph/search")
def search_graph_nodes(query: str, node_types: str | None = None, limit: int = 50):
    """
    搜索知识图谱中的节点
    
    Args:
        query: 搜索关键词
        node_types: 节点类型过滤（可选），多个类型用逗号分隔，如 "疾病,药品"
        limit: 返回结果数量限制，默认 50
    """
    node_type_list = None
    if node_types:
        node_type_list = [nt.strip() for nt in node_types.split(",")]
    
    return neo4j_service.search_nodes(query=query, node_types=node_type_list, limit=limit)


@router.get("/graph/node/{node_id}")
def get_node_details(node_id: str):
    """
    获取单个节点的详细信息
    
    Args:
        node_id: 节点 ID
    """
    return neo4j_service.get_node_details(node_id=node_id)
