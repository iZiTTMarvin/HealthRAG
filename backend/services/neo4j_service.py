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
