const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export interface Neo4jStatus {
  connected: boolean;
  error?: string | null;
}

export async function fetchNeo4jStatus(): Promise<Neo4jStatus> {
  const res = await fetch(`${API_BASE}/api/neo4j/status`);
  if (!res.ok) {
    return { connected: false, error: "无法获取状态" };
  }
  return res.json();
}

export async function connectNeo4j(password?: string): Promise<Neo4jStatus> {
  const res = await fetch(`${API_BASE}/api/neo4j/connect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: password ?? null })
  });
  if (!res.ok) {
    return { connected: false, error: "连接失败" };
  }
  return res.json();
}
