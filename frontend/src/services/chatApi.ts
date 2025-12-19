const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export interface ChatStreamPayload {
  query: string;
  model_source: "local" | "siliconflow";
  model_name: string;
  api_key?: string;
  neo4j_password?: string;
}

export interface ChatMeta {
  intent: string;
  entities: Record<string, string>;
  prompt: string;
  knowledge: string;
}

export interface StreamCallbacks {
  onMeta: (meta: ChatMeta) => void;
  onDelta: (delta: string) => void;
  onError: (message: string) => void;
  onDone: () => void;
}

export async function streamChat(payload: ChatStreamPayload, callbacks: StreamCallbacks) {
  const res = await fetch(`${API_BASE}/api/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok || !res.body) {
    callbacks.onError("无法连接聊天服务");
    callbacks.onDone();
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      let index = buffer.indexOf("\n");
      while (index >= 0) {
        const line = buffer.slice(0, index).trim();
        buffer = buffer.slice(index + 1);
        if (line) {
          try {
            const data = JSON.parse(line);
            if (data.type === "meta") {
              callbacks.onMeta({
                intent: data.intent ?? "",
                entities: data.entities ?? {},
                prompt: data.prompt ?? "",
                knowledge: data.knowledge ?? ""
              });
            } else if (data.type === "delta") {
              callbacks.onDelta(data.content ?? "");
            } else if (data.type === "error") {
              callbacks.onError(data.message ?? "生成失败");
            } else if (data.type === "done") {
              callbacks.onDone();
            }
          } catch {
            callbacks.onError("解析流式数据失败");
          }
        }
        index = buffer.indexOf("\n");
      }
    }
  } finally {
    callbacks.onDone();
    reader.releaseLock();
  }
}
