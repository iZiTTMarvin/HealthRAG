const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export interface AuthResponse {
  ok: "true" | "false";
  message: string;
  role?: "admin" | "user";
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    return { ok: "false", message: "登录失败，请稍后重试。" };
  }
  return res.json();
}

export async function register(username: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    return { ok: "false", message: "注册失败，请稍后重试。" };
  }
  return res.json();
}
