import { useEffect, useMemo, useState } from "react";

import ChatWindow from "../components/ChatWindow";
import SidebarPanel from "../components/SidebarPanel";
import { useAuth } from "../contexts/AuthContext";
import { streamChat } from "../services/chatApi";
import { fetchModels } from "../services/modelApi";
import { connectNeo4j, fetchNeo4jStatus } from "../services/neo4jApi";
import type { ChatMessage, ChatWindowState } from "../types/chat";
import "../styles/chat.css";

const createWindow = (index: number): ChatWindowState => ({
  id: crypto.randomUUID(),
  title: `对话窗口 ${index + 1}`,
  messages: []
});

export default function ChatPage() {
  const { auth, setAuth } = useAuth();
  const [windows, setWindows] = useState<ChatWindowState[]>([createWindow(0)]);
  const [activeId, setActiveId] = useState(windows[0].id);
  const [models, setModels] = useState({ local: [], siliconflow: [] } as {
    local: string[];
    siliconflow: string[];
  });
  const [modelSource, setModelSource] = useState<"local" | "siliconflow">("local");
  const [modelName, setModelName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [neo4jStatus, setNeo4jStatus] = useState({ connected: false, error: null as string | null });
  const [neo4jPassword, setNeo4jPassword] = useState("");
  const [showEntities, setShowEntities] = useState(true);
  const [showIntent, setShowIntent] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);
  const [streamingIds, setStreamingIds] = useState<string[]>([]);

  const activeWindow = useMemo(
    () => windows.find((window) => window.id === activeId) ?? windows[0],
    [windows, activeId]
  );

  useEffect(() => {
    fetchModels().then((data) => {
      setModels(data);
      if (data.local.length > 0 && !modelName) {
        setModelName(data.local[0]);
      } else if (data.siliconflow.length > 0 && !modelName) {
        setModelName(data.siliconflow[0]);
      }
    });
  }, [modelName]);

  useEffect(() => {
    fetchNeo4jStatus().then(setNeo4jStatus);
  }, []);

  const handleNewWindow = () => {
    setWindows((prev) => {
      const next = [...prev, createWindow(prev.length)];
      setActiveId(next[next.length - 1].id);
      return next;
    });
  };

  const handleSend = (text: string) => {
    if (!modelName) {
      return;
    }
    const windowId = activeId;
    const userId = crypto.randomUUID();
    const assistantId = crypto.randomUUID();
    setWindows((prev) =>
      prev.map((window) => {
        if (window.id !== windowId) {
          return window;
        }
        const userMsg: ChatMessage = {
          id: userId,
          role: "user",
          content: text
        };
        const assistantMsg: ChatMessage = {
          id: assistantId,
          role: "assistant",
          content: "正在连接模型，请稍候..."
        };
        return { ...window, messages: [...window.messages, userMsg, assistantMsg] };
      })
    );

    const updateAssistant = (updater: (msg: ChatMessage) => ChatMessage) => {
      setWindows((prev) =>
        prev.map((window) => {
          if (window.id !== windowId) {
            return window;
          }
          return {
            ...window,
            messages: window.messages.map((message) =>
              message.id === assistantId ? updater(message) : message
            )
          };
        })
      );
    };

    setStreamingIds((prev) => [...prev, windowId]);
    void streamChat(
      {
        query: text,
        model_source: modelSource,
        model_name: modelName,
        api_key: modelSource === "siliconflow" ? apiKey : undefined,
        neo4j_password: auth?.role === "admin" ? neo4jPassword || undefined : undefined
      },
      {
        onMeta: (meta) => {
          updateAssistant((msg) => ({
            ...msg,
            ent: JSON.stringify(meta.entities),
            intent: meta.intent,
            prompt: meta.prompt,
            knowledge: meta.knowledge
          }));
        },
        onDelta: (delta) => {
          updateAssistant((msg) => {
            // 如果当前内容是初始等待消息，则替换为delta内容；否则追加
            const waitingMsg = "正在连接模型，请稍候...";
            const newContent = msg.content === waitingMsg ? delta : `${msg.content}${delta}`;
            return { ...msg, content: newContent };
          });
        },
        onError: (message) => {
          updateAssistant((msg) => ({ ...msg, content: message }));
        },
        onDone: () => {
          setStreamingIds((prev) => prev.filter((id) => id !== windowId));
        }
      }
    );
  };

  return (
    <div className="chat-shell">
      <aside className="chat-sidebar">
        <div className="brand-block">
          <div className="brand-title">医疗智能问答</div>
          <div className="brand-subtitle">FastAPI + React 版</div>
        </div>
        <div className="user-card">
          <div>用户：{auth?.username}</div>
          <div>角色：{auth?.role === "admin" ? "管理员" : "普通用户"}</div>
        </div>
        <SidebarPanel
          role={auth?.role ?? "user"}
          models={models}
          modelSource={modelSource}
          modelName={modelName}
          apiKey={apiKey}
          neo4jStatus={neo4jStatus}
          neo4jPassword={neo4jPassword}
          showEntities={showEntities}
          showIntent={showIntent}
          showPrompt={showPrompt}
          onChangeModelSource={(next) => {
            setModelSource(next);
            const nextOptions = next === "local" ? models.local : models.siliconflow;
            setModelName(nextOptions[0] ?? "");
          }}
          onChangeModelName={setModelName}
          onChangeApiKey={setApiKey}
          onChangeNeo4jPassword={setNeo4jPassword}
          onConnectNeo4j={async () => {
            const status = await connectNeo4j(neo4jPassword || undefined);
            setNeo4jStatus(status);
          }}
          onChangeDebug={(next) => {
            setShowEntities(next.showEntities);
            setShowIntent(next.showIntent);
            setShowPrompt(next.showPrompt);
          }}
        />
        <button className="sidebar-button primary" type="button" onClick={handleNewWindow}>
          新建对话窗口
        </button>
        <div className="window-list">
          {windows.map((window) => (
            <button
              key={window.id}
              type="button"
              className={`window-item ${window.id === activeId ? "active" : ""}`}
              onClick={() => setActiveId(window.id)}
            >
              {window.title}
            </button>
          ))}
        </div>
        <button className="sidebar-button" type="button" onClick={() => setAuth(null)}>
          返回登录
        </button>
      </aside>
      <main className="chat-main">
        <div className="chat-header">
          <div className="chat-title">{activeWindow?.title}</div>
        </div>
        {activeWindow && (
          <ChatWindow
            messages={activeWindow.messages}
            showEntities={showEntities}
            showIntent={showIntent}
            showPrompt={showPrompt}
            onSend={handleSend}
            disabled={streamingIds.includes(activeWindow.id)}
          />
        )}
      </main>
    </div>
  );
}
