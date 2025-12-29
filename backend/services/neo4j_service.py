from typing import Any, Dict, List, Optional

import py2neo

"""
Neo4j 图数据库服务类
负责管理与 Neo4j 数据库的连接、身份验证以及状态监控。
提供了自动尝试多种常用默认密码的机制，提高连接成功率。
"""

class Neo4jService:
    def __init__(self):
        # 内部保存 py2neo.Graph 客户端实例
        self._client = None
        # 记录当前是否已成功连接
        self._connected = False
        # 记录最后一次连接错误的详细信息
        self._last_error: Optional[str] = None

    def _connection_attempts(self, custom_password: Optional[str]) -> List[Dict[str, str]]:
        """
        构造一系列连接尝试方案。
        包含常见的默认配置和用户提供的自定义密码。
        """
        attempts = [
            {"uri": "bolt://localhost:7687", "user": "neo4j", "password": "neo4j"},
            {"uri": "bolt://localhost:7687", "user": "neo4j", "password": "password"},
            {"uri": "bolt://localhost:7687", "user": "neo4j", "password": "asd2528836683"},
            {"uri": "bolt://localhost:7687", "user": "neo4j", "password": "12345678"},
            {"uri": "bolt://localhost:7687", "user": "neo4j", "password": "admin"},
            {"uri": "http://localhost:7474", "user": "neo4j", "password": "neo4j"},
            {"uri": "http://localhost:7474", "user": "neo4j", "password": "password"},
        ]
        # 如果用户手动输入了密码，将其置于最高优先级
        if custom_password:
            attempts.insert(
                0,
                {"uri": "bolt://localhost:7687", "user": "neo4j", "password": custom_password},
            )
        return attempts

    def connect(self, custom_password: Optional[str] = None) -> bool:
        """
        尝试建立数据库连接。
        遍历所有预设的尝试方案，直到成功或全部失败。
        """
        self._client = None
        self._connected = False
        self._last_error = None

        for attempt in self._connection_attempts(custom_password):
            try:
                # 根据协议选择连接方式
                if attempt["uri"].startswith("bolt"):
                    client = py2neo.Graph(attempt["uri"], auth=(attempt["user"], attempt["password"]))
                else:
                    client = py2neo.Graph(
                        attempt["uri"],
                        user=attempt["user"],
                        password=attempt["password"],
                        name="neo4j",
                    )
                # 执行一个简单的查询以验证连接有效性
                client.run("RETURN 1")
                self._client = client
                self._connected = True
                return True
            except Exception as exc:
                self._last_error = str(exc)

        return False

    def status(self) -> Dict[str, Any]:
        """返回当前连接状态信息"""
        return {
            "connected": self._connected,
            "error": self._last_error,
        }

    @property
    def client(self) -> Optional[py2neo.Graph]:
        """获取底层 py2neo 客户端实例"""
        return self._client

    def get_graph_overview(self, limit: int = 100, node_types: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        获取知识图谱概览数据，用于可视化展示。
        
        Args:
            limit: 返回的节点数量限制
            node_types: 节点类型过滤列表，如 ['疾病', '药品']
        
        Returns:
            包含 nodes 和 edges 的字典
        """
        if not self._connected or not self._client:
            return {"nodes": [], "edges": [], "error": "未连接到 Neo4j"}
        
        try:
            nodes = []
            edges = []
            node_id_set = set()  # 用于去重
            
            # 构建节点类型过滤条件，直接返回 Neo4j 的 id(n)
            if node_types:
                label_conditions = " OR ".join([f"'{nt}' IN labels(n)" for nt in node_types])
                node_query = f"MATCH (n) WHERE {label_conditions} RETURN id(n) as node_id, n, labels(n) as node_labels LIMIT {limit}"
            else:
                node_query = f"MATCH (n) RETURN id(n) as node_id, n, labels(n) as node_labels LIMIT {limit}"
            
            # 查询节点
            result = self._client.run(node_query).data()
            neo4j_node_ids = []  # 存储 Neo4j 的节点 ID（整数）
            
            for record in result:
                node = record["n"]
                node_id = record["node_id"]  # Neo4j 内部 ID（整数，唯一）
                node_labels = record["node_labels"]
                
                # 跳过重复节点
                if node_id in node_id_set:
                    continue
                node_id_set.add(node_id)
                neo4j_node_ids.append(node_id)
                
                # 获取节点标签（类型）
                node_type = node_labels[0] if node_labels else "未知"
                
                # 获取节点名称
                node_name = node.get("名称", "未命名")
                
                nodes.append({
                    "id": str(node_id),  # 转为字符串，前端使用
                    "label": node_name,
                    "type": node_type,
                    "properties": dict(node)
                })
            
            # 查询这些节点之间的关系
            if neo4j_node_ids:
                rel_query = f"""
                MATCH (n)-[r]->(m)
                WHERE id(n) IN {neo4j_node_ids} AND id(m) IN {neo4j_node_ids}
                RETURN id(n) as source_id, id(m) as target_id, type(r) as rel_type
                LIMIT {limit * 2}
                """
                
                rel_result = self._client.run(rel_query).data()
                for record in rel_result:
                    edges.append({
                        "from": str(record["source_id"]),
                        "to": str(record["target_id"]),
                        "label": record["rel_type"]
                    })
            
            return {
                "nodes": nodes,
                "edges": edges,
                "total_nodes": len(nodes),
                "total_edges": len(edges)
            }
            
        except Exception as e:
            return {"nodes": [], "edges": [], "error": f"查询失败: {str(e)}"}

    def search_nodes(self, query: str, node_types: Optional[List[str]] = None, limit: int = 50) -> Dict[str, Any]:
        """
        搜索包含特定关键词的节点及其一级邻居。
        
        Args:
            query: 搜索关键词
            node_types: 可选的节点类型过滤列表，用于过滤**邻居节点**，如 ['症状', '药品']
                       如果指定，则只返回匹配类型的邻居节点
            limit: 返回结果数量限制
        
        Returns:
            包含 nodes 和 edges 的字典
        """
        if not self._connected or not self._client:
            return {"nodes": [], "edges": [], "error": "未连接到 Neo4j"}
        
        try:
            nodes = []
            edges = []
            node_id_set = set()  # 用于去重
            
            # 第一步：搜索匹配关键词的中心节点（不限类型）
            search_query = f"""
            MATCH (n)
            WHERE n.名称 CONTAINS $query
            RETURN id(n) as node_id, n, labels(n) as node_labels
            LIMIT {limit}
            """
            
            # 执行搜索
            result = self._client.run(search_query, query=query).data()
            center_node_ids = []  # Neo4j 整数 ID
            center_node_map = {}  # 暂存中心节点数据，稍后根据是否有邻居来决定是否添加
            
            for record in result:
                node = record["n"]
                node_id = record["node_id"]  # Neo4j 内部 ID（整数）
                node_labels = record["node_labels"]
                
                # 跳过重复节点
                if node_id in node_id_set:
                    continue
                
                center_node_ids.append(node_id)
                node_type_str = node_labels[0] if node_labels else "未知"
                
                # 暂存中心节点数据
                center_node_map[node_id] = {
                    "id": str(node_id),
                    "label": node.get("名称", "未命名"),
                    "type": node_type_str,
                    "properties": dict(node),
                    "highlighted": True  # 标记为搜索结果
                }
            
            # 第二步：查询这些节点的一级邻居
            # 如果指定了 node_types，则只返回指定类型的邻居节点
            if center_node_ids:
                if node_types:
                    # 构建邻居类型过滤条件
                    label_conditions = " OR ".join([f"'{nt}' IN labels(m)" for nt in node_types])
                    neighbor_query = f"""
                    MATCH (n)-[r]-(m)
                    WHERE id(n) IN {center_node_ids} AND ({label_conditions})
                    RETURN id(n) as source_id, id(m) as target_id, m, labels(m) as m_labels, type(r) as rel_type
                    LIMIT {limit * 3}
                    """
                else:
                    # 不过滤邻居类型
                    neighbor_query = f"""
                    MATCH (n)-[r]-(m)
                    WHERE id(n) IN {center_node_ids}
                    RETURN id(n) as source_id, id(m) as target_id, m, labels(m) as m_labels, type(r) as rel_type
                    LIMIT {limit * 3}
                    """
                
                neighbor_result = self._client.run(neighbor_query).data()
                center_nodes_with_neighbors = set()  # 记录有符合条件邻居的中心节点
                
                for record in neighbor_result:
                    source_id = record["source_id"]
                    target_id = record["target_id"]
                    target_node = record["m"]
                    target_labels = record["m_labels"]
                    
                    # 标记这个中心节点有符合条件的邻居
                    center_nodes_with_neighbors.add(source_id)
                    
                    # 添加邻居节点（如果尚未添加）
                    if target_id not in node_id_set:
                        node_id_set.add(target_id)
                        node_type_str = target_labels[0] if target_labels else "未知"
                        
                        neighbor_data = {
                            "id": str(target_id),
                            "label": target_node.get("名称", "未命名"),
                            "type": node_type_str,
                            "properties": dict(target_node),
                            "highlighted": False
                        }
                        nodes.append(neighbor_data)
                    
                    # 添加关系
                    edges.append({
                        "from": str(source_id),
                        "to": str(target_id),
                        "label": record["rel_type"]
                    })
                
                # 如果指定了过滤条件，只添加有符合条件邻居的中心节点
                if node_types:
                    # 清空 nodes 列表中的中心节点，重新添加
                    nodes_to_keep = [n for n in nodes if not n.get("highlighted", False)]
                    nodes.clear()
                    nodes.extend(nodes_to_keep)
                    
                    # 只添加有邻居的中心节点
                    node_id_set.clear()
                    for n in nodes:
                        node_id_set.add(int(n["id"]))
                    
                    for center_id in center_nodes_with_neighbors:
                        if center_id not in node_id_set:
                            node_id_set.add(center_id)
                            nodes.append(center_node_map[center_id])
                else:
                    # 没有过滤条件，添加所有中心节点
                    for center_id, center_data in center_node_map.items():
                        if center_id not in node_id_set:
                            node_id_set.add(center_id)
                            nodes.append(center_data)
            
            return {
                "nodes": nodes,
                "edges": edges,
                "total_nodes": len(nodes),
                "total_edges": len(edges)
            }
            
        except Exception as e:
            return {"nodes": [], "edges": [], "error": f"搜索失败: {str(e)}"}

    def get_node_details(self, node_id: str) -> Dict[str, Any]:
        """
        获取单个节点的详细信息。
        
        Args:
            node_id: 节点 ID
        
        Returns:
            节点详细信息字典
        """
        if not self._connected or not self._client:
            return {"error": "未连接到 Neo4j"}
        
        try:
            query = f"""
            MATCH (n)
            WHERE id(n) = {int(node_id)}
            RETURN n, labels(n) as labels
            """
            
            result = self._client.run(query).data()
            
            if not result:
                return {"error": "节点不存在"}
            
            node = result[0]["n"]
            labels = result[0]["labels"]
            
            return {
                "id": node_id,
                "type": labels[0] if labels else "未知",
                "labels": labels,
                "properties": dict(node)
            }
            
        except Exception as e:
            return {"error": f"查询失败: {str(e)}"}
