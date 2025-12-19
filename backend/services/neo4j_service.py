from typing import Any, Dict, List, Optional

import py2neo


class Neo4jService:
    def __init__(self):
        self._client = None
        self._connected = False
        self._last_error: Optional[str] = None

    def _connection_attempts(self, custom_password: Optional[str]) -> List[Dict[str, str]]:
        attempts = [
            {"uri": "bolt://localhost:7687", "user": "neo4j", "password": "neo4j"},
            {"uri": "bolt://localhost:7687", "user": "neo4j", "password": "password"},
            {"uri": "bolt://localhost:7687", "user": "neo4j", "password": "asd2528836683"},
            {"uri": "bolt://localhost:7687", "user": "neo4j", "password": "12345678"},
            {"uri": "bolt://localhost:7687", "user": "neo4j", "password": "admin"},
            {"uri": "http://localhost:7474", "user": "neo4j", "password": "neo4j"},
            {"uri": "http://localhost:7474", "user": "neo4j", "password": "password"},
        ]
        if custom_password:
            attempts.insert(
                0,
                {"uri": "bolt://localhost:7687", "user": "neo4j", "password": custom_password},
            )
        return attempts

    def connect(self, custom_password: Optional[str] = None) -> bool:
        self._client = None
        self._connected = False
        self._last_error = None

        for attempt in self._connection_attempts(custom_password):
            try:
                if attempt["uri"].startswith("bolt"):
                    client = py2neo.Graph(attempt["uri"], auth=(attempt["user"], attempt["password"]))
                else:
                    client = py2neo.Graph(
                        attempt["uri"],
                        user=attempt["user"],
                        password=attempt["password"],
                        name="neo4j",
                    )
                client.run("RETURN 1")
                self._client = client
                self._connected = True
                return True
            except Exception as exc:
                self._last_error = str(exc)

        return False

    def status(self) -> Dict[str, Any]:
        return {
            "connected": self._connected,
            "error": self._last_error,
        }

    @property
    def client(self) -> Optional[py2neo.Graph]:
        return self._client
