/**
 * 聊天相关 API 调用模块
 * 处理与后端的 HTTP 连接，并将后端的换行符分隔的 JSON 流解析为回调函数。
 */

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

// 对话流请求载荷接口
export interface ChatStreamPayload {
  query: string;                                // 用户查询语句
  model_source: "local" | "siliconflow";        // 模型来源
  model_name: string;                           // 模型名称
  api_key?: string;                             // 硅基流动 API Key
  neo4j_password?: string;                      // Neo4j 数据库密码
}

// 助手消息关联的元数据接口
export interface ChatMeta {
  intent: string;                               // 识别出的意图
  entities: Record<string, string>;             // 提取出的实体字典
  prompt: string;                               // 构造的最终 Prompt
  knowledge: string;                            // 检索到的知识片段
}

// 流式处理的回调函数接口
export interface StreamCallbacks {
  onMeta: (meta: ChatMeta) => void;             // 收到元数据时的回调
  onDelta: (delta: string) => void;             // 收到新的文本块时的回调
  onError: (message: string) => void;           // 发生错误时的回调
  onDone: () => void;                           // 流式结束后的回调
}

/**
 * 核心方法：发起流式对话请求并处理响应流
 */
export async function streamChat(payload: ChatStreamPayload, callbacks: StreamCallbacks) {
  // 发起 POST 请求到后端的 /api/chat/stream 接口
  const res = await fetch(`${API_BASE}/api/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  // 如果请求失败或响应体为空，触发错误回调
  if (!res.ok || !res.body) {
    callbacks.onError("无法连接聊天服务");
    callbacks.onDone();
    return;
  }

  // 获取响应流的读取器
  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = ""; // 用于暂存未处理完整的文本行

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }
      
      // 解码收到的字节块并拼接到 buffer
      buffer += decoder.decode(value, { stream: true });
      
      // 按换行符分割 buffer，处理完整的 JSON 行
      let index = buffer.indexOf("\n");
      while (index >= 0) {
        const line = buffer.slice(0, index).trim();
        buffer = buffer.slice(index + 1);
        
        if (line) {
          try {
            const data = JSON.parse(line);
            // 根据数据包类型调用不同的回调函数
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
            console.error("解析流式数据行失败:", line);
          }
        }
        index = buffer.indexOf("\n");
      }
    }
  } catch (err) {
    callbacks.onError(`读取数据流时发生异常: ${err}`);
  } finally {
    // 确保在循环结束或出错时释放锁并调用完成回调
    callbacks.onDone();
    reader.releaseLock();
  }
}
