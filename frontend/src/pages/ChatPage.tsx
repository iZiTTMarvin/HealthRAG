import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import ChatWindow from "../components/ChatWindow";
import Sidebar from "../components/Sidebar";
import SettingsModal from "../components/SettingsModal";
import { useAuth } from "../contexts/AuthContext";
import { streamChat } from "../services/chatApi";
import { fetchModels } from "../services/modelApi";
import { connectNeo4j, fetchNeo4jStatus } from "../services/neo4jApi";
import type { ChatMessage, ChatWindowState } from "../types/chat";

/**
 * 工厂方法：创建一个新的对话窗口状态
 * @param index 序号，用于生成默认窗口标题
 */
const createWindow = (index: number): ChatWindowState => ({
  id: crypto.randomUUID(),
  title: `对话窗口 ${index + 1}`,
  messages: []
});

/**
 * 聊天主页面组件
 * 该组件是应用的核心，负责：
 * 1. 会话窗口管理（多会话切换、新建窗口）。
 * 2. 模型配置（选择本地 Ollama 或硅基流动 API）。
 * 3. 知识图谱状态管理（连接 Neo4j 数据库）。
 * 4. 调试信息开关控制（显示实体、意图、Prompt 等）。
 * 5. 消息发送逻辑与流式响应处理。
 */
export default function ChatPage() {
  // 从 Context 中获取用户信息和状态设置函数
  const { auth, setAuth } = useAuth();
  
  // --- 状态定义 ---
  
  // 所有的对话窗口列表
  const [windows, setWindows] = useState<ChatWindowState[]>([createWindow(0)]);
  // 当前正在查看的窗口 ID
  const [activeId, setActiveId] = useState(windows[0].id);
  // 控制侧边栏是否展开
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  // 控制设置弹窗是否显示
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // 存储从后端获取的可用模型列表
  const [models, setModels] = useState({ local: [], siliconflow: [] } as {
    local: string[];
    siliconflow: string[];
  });
  // 当前选择的模型来源 ('local' 本地或 'siliconflow' 云端)
  const [modelSource, setModelSource] = useState<"local" | "siliconflow">("local");
  // 当前选中的模型名称
  const [modelName, setModelName] = useState("");
  // 硅基流动 API Key
  const [apiKey, setApiKey] = useState("");
  // Neo4j 数据库连接状态
  const [neo4jStatus, setNeo4jStatus] = useState({ connected: false, error: null as string | null });
  // Neo4j 数据库密码
  const [neo4jPassword, setNeo4jPassword] = useState("");
  
  // 调试辅助信息显示开关
  const [showEntities, setShowEntities] = useState(true); // 显示识别出的实体
  const [showIntent, setShowIntent] = useState(true);     // 显示意图识别结果
  const [showPrompt, setShowPrompt] = useState(false);     // 显示发送给 LLM 的完整 Prompt
  
  // 记录哪些窗口正在接收流式数据，用于禁用发送按钮
  const [streamingIds, setStreamingIds] = useState<string[]>([]);

  // 计算属性：当前激活的窗口对象
  const activeWindow = useMemo(
    () => windows.find((window) => window.id === activeId) ?? windows[0],
    [windows, activeId]
  );

  /**
   * 副作用：组件挂载后拉取所有可用模型
   */
  useEffect(() => {
    fetchModels().then((data) => {
      setModels(data);
      // 如果还没有设置模型名，默认选第一个可用的
      if (data.local.length > 0 && !modelName) {
        setModelName(data.local[0]);
      } else if (data.siliconflow.length > 0 && !modelName) {
        setModelName(data.siliconflow[0]);
      }
    });
  }, [modelName]);

  /**
   * 副作用：组件挂载后检查数据库连接状态
   */
  useEffect(() => {
    fetchNeo4jStatus().then(setNeo4jStatus);
  }, []);

  /**
   * 处理逻辑：新建一个对话会话
   */
  const handleNewWindow = () => {
    setWindows((prev) => {
      const next = [...prev, createWindow(prev.length)];
      setActiveId(next[next.length - 1].id);
      return next;
    });
  };

  /**
   * 核心逻辑：处理用户发送的消息
   * @param text 用户输入的问题文本
   */
  const handleSend = (text: string) => {
    if (!modelName) {
      alert("请先选择一个模型");
      return;
    }
    const windowId = activeId;
    const userId = crypto.randomUUID();
    const assistantId = crypto.randomUUID();
    
    // 1. 在 UI 上即时显示用户消息，并添加一个助手消息占位符
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

    /**
     * 辅助更新函数：更新特定助手消息的内容或属性
     */
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

    // 2. 将窗口加入“流式中”列表
    setStreamingIds((prev) => [...prev, windowId]);

    // 3. 调用 API 进行流式请求
    void streamChat(
      {
        query: text,
        model_source: modelSource,
        model_name: modelName,
        api_key: modelSource === "siliconflow" ? apiKey : undefined,
        neo4j_password: auth?.role === "admin" ? neo4jPassword || undefined : undefined
      },
      {
        // 收到元数据（实体、意图等）：更新助手消息的扩展属性
        onMeta: (meta) => {
          updateAssistant((msg) => ({
            ...msg,
            ent: JSON.stringify(meta.entities),
            intent: meta.intent,
            prompt: meta.prompt,
            knowledge: meta.knowledge
          }));
        },
        // 收到增量文本块：实时追加到助手内容中
        onDelta: (delta) => {
          updateAssistant((msg) => {
            const waitingMsg = "正在连接模型，请稍候...";
            // 如果是第一块内容，替换占位符；否则追加文本
            const newContent = msg.content === waitingMsg ? delta : `${msg.content}${delta}`;
            return { ...msg, content: newContent };
          });
        },
        // 发生错误
        onError: (message) => {
          updateAssistant((msg) => ({ ...msg, content: `错误: ${message}` }));
        },
        // 对话完成：解除锁定
        onDone: () => {
          setStreamingIds((prev) => prev.filter((id) => id !== windowId));
        }
      }
    );
  };

  return (
    <div className="flex h-screen bg-background text-text-main overflow-hidden font-sans">
      {/* 侧边栏：管理模型配置与历史窗口 */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        windows={windows}
        activeId={activeId}
        onSelectWindow={setActiveId}
        onNewWindow={handleNewWindow}
        user={auth ? { username: auth.username, role: auth.role } : null}
        onLogout={() => setAuth(null)}
        models={models}
        modelSource={modelSource}
        modelName={modelName}
        apiKey={apiKey}
        neo4jStatus={neo4jStatus}
        onChangeModelSource={(next) => {
          setModelSource(next);
          // 切换源时自动重置为该源下的第一个模型
          const nextOptions = next === "local" ? models.local : models.siliconflow;
          setModelName(nextOptions[0] ?? "");
        }}
        onChangeModelName={setModelName}
        onChangeApiKey={setApiKey}
        onConnectNeo4j={async () => {
          const status = await connectNeo4j(neo4jPassword || undefined);
          setNeo4jStatus({
            connected: status.connected,
            error: status.error ?? null
          });
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* 主聊天区域 */}
      <main className="flex-1 flex flex-col h-full relative z-10">
        <header className="h-16 border-b border-slate-100 bg-white/50 backdrop-blur-sm flex items-center justify-between px-6 flex-shrink-0">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            key={activeWindow?.id}
            className="font-medium text-lg text-text-main truncate"
          >
            {activeWindow?.title}
          </motion.div>
        </header>

        <div className="flex-1 overflow-hidden relative">
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
        </div>
      </main>

      {/* 系统设置模态框 */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        role={auth?.role ?? "user"}
        neo4jStatus={neo4jStatus}
        neo4jPassword={neo4jPassword}
        showEntities={showEntities}
        showIntent={showIntent}
        showPrompt={showPrompt}
        onChangeNeo4jPassword={setNeo4jPassword}
        onConnectNeo4j={async () => {
          const status = await connectNeo4j(neo4jPassword || undefined);
          setNeo4jStatus({
            connected: status.connected,
            error: status.error ?? null
          });
        }}
        onChangeDebug={(next) => {
          setShowEntities(next.showEntities);
          setShowIntent(next.showIntent);
          setShowPrompt(next.showPrompt);
        }}
      />
    </div>
  );
}
