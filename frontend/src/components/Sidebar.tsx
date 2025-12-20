import { motion, AnimatePresence, Variants } from "framer-motion";
import { 
  MessageSquarePlus, 
  LogOut, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Database,
  Server,
  Cpu,
  User,
  Shield,
  MessageSquare,
  Activity,
  ChevronDown
} from "lucide-react";
import { useState } from "react";
import { cn } from "./ChatMessage";
import type { ChatWindowState } from "../types/chat";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  windows: ChatWindowState[];
  activeId: string;
  onSelectWindow: (id: string) => void;
  onNewWindow: () => void;
  user: { username: string; role: string } | null;
  onLogout: () => void;
  
  // Model & Connection Props
  models: { local: string[]; siliconflow: string[] };
  modelSource: "local" | "siliconflow";
  modelName: string;
  apiKey: string;
  neo4jStatus: { connected: boolean; error: string | null };
  
  // Handlers
  onChangeModelSource: (source: "local" | "siliconflow") => void;
  onChangeModelName: (name: string) => void;
  onChangeApiKey: (key: string) => void;
  onConnectNeo4j: () => void;
  onOpenSettings: () => void;
}

export default function Sidebar({
  isOpen,
  onToggle,
  windows,
  activeId,
  onSelectWindow,
  onNewWindow,
  user,
  onLogout,
  models,
  modelSource,
  modelName,
  apiKey,
  neo4jStatus,
  onChangeModelSource,
  onChangeModelName,
  onChangeApiKey,
  onConnectNeo4j,
  onOpenSettings
}: SidebarProps) {
  
  const sidebarVariants: Variants = {
    open: { width: 300, transition: { type: "spring", stiffness: 300, damping: 30 } },
    closed: { width: 80, transition: { type: "spring", stiffness: 300, damping: 30 } }
  };

  return (
    <motion.aside
      initial="open"
      animate={isOpen ? "open" : "closed"}
      variants={sidebarVariants}
      className="h-screen bg-white border-r border-slate-100 flex flex-col shadow-soft relative z-20"
    >
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-8 w-6 h-6 bg-white border border-slate-100 rounded-full flex items-center justify-center shadow-sm text-text-muted hover:text-primary transition-colors z-50"
      >
        {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      {/* Header / Brand */}
      <div className="p-6 flex items-center">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-active flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
           <Activity className="text-white" size={24} />
        </div>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="ml-3 overflow-hidden whitespace-nowrap"
            >
              <h1 className="font-bold text-lg text-text-main">HealthRAG</h1>
              <p className="text-xs text-text-muted">智能医疗问答助手</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User Info Card */}
      <div className="px-4 mb-6">
        <motion.div 
          className={cn(
            "rounded-2xl bg-surface-background p-3 flex items-center transition-all",
            !isOpen && "justify-center bg-transparent p-0"
          )}
        >
          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary flex-shrink-0">
             {user?.role === "admin" ? <Shield size={20} /> : <User size={20} />}
          </div>
          {isOpen && (
            <div className="ml-3 overflow-hidden">
              <div className="font-medium text-sm text-text-main truncate">{user?.username}</div>
              <div className="text-xs text-text-muted flex items-center">
                <span className={cn("w-2 h-2 rounded-full mr-1.5", neo4jStatus.connected ? "bg-accent-green animate-pulse" : "bg-red-400")} />
                {neo4jStatus.connected ? "已连接知识图谱" : "未连接"}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* New Chat Button */}
      <div className="px-4 mb-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewWindow}
          className={cn(
            "w-full h-12 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:bg-primary-hover transition-colors",
            !isOpen && "w-10 h-10 rounded-full p-0"
          )}
        >
          <MessageSquarePlus size={20} />
          {isOpen && <span className="ml-2 font-medium">新建对话</span>}
        </motion.button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
        {isOpen && <div className="text-xs font-semibold text-text-light mb-2 px-2">历史记录</div>}
        {windows.map((window, i) => (
          <motion.button
            key={window.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelectWindow(window.id)}
            className={cn(
              "w-full p-3 rounded-xl flex items-center text-sm transition-all text-left group",
              activeId === window.id 
                ? "bg-white shadow-soft border border-primary/20 text-primary" 
                : "text-text-muted hover:bg-surface-background hover:text-text-main",
              !isOpen && "justify-center px-0"
            )}
          >
            <MessageSquare size={18} className={cn("flex-shrink-0", activeId === window.id ? "text-primary" : "text-text-light group-hover:text-text-muted")} />
            {isOpen && <span className="ml-3 truncate">{window.title}</span>}
          </motion.button>
        ))}
      </div>

      {/* Bottom Actions / Config */}
      <div className="p-4 border-t border-slate-100 bg-surface-background/30">
        <AnimatePresence>
          {isOpen ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Model Source Selector */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-muted flex items-center">
                  <Server size={12} className="mr-1.5" /> 模型来源
                </label>
                <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => onChangeModelSource("local")}
                    className={cn(
                      "text-xs py-1.5 rounded-md transition-all",
                      modelSource === "local" ? "bg-white shadow-sm text-primary font-medium" : "text-text-muted"
                    )}
                  >
                    本地 Ollama
                  </button>
                  <button
                    onClick={() => onChangeModelSource("siliconflow")}
                    className={cn(
                      "text-xs py-1.5 rounded-md transition-all",
                      modelSource === "siliconflow" ? "bg-white shadow-sm text-secondary font-medium" : "text-text-muted"
                    )}
                  >
                    云端 API
                  </button>
                </div>
              </div>

              {/* Model Select */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-muted flex items-center">
                  <Cpu size={12} className="mr-1.5" /> 选择模型
                </label>
                <div className="relative">
                  <select 
                    value={modelName}
                    onChange={(e) => onChangeModelName(e.target.value)}
                    className="w-full appearance-none bg-white border border-slate-200 text-text-main text-sm rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {(modelSource === "local" ? models.local : models.siliconflow).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
              </div>
              
              {/* Settings Trigger */}
              <button 
                onClick={onOpenSettings}
                className="w-full flex items-center justify-between p-2 rounded-lg text-xs text-text-muted hover:bg-white hover:shadow-sm transition-all"
              >
                <span className="flex items-center"><Settings size={14} className="mr-2" />设置 & 调试</span>
              </button>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <button onClick={onOpenSettings} className="p-2 text-text-muted hover:text-primary transition-colors">
                <Settings size={20} />
              </button>
            </div>
          )}
        </AnimatePresence>

        {/* Logout */}
        <button
          onClick={onLogout}
          className={cn(
            "mt-4 w-full flex items-center text-text-muted hover:text-accent-red transition-colors",
            isOpen ? "px-2 text-sm" : "justify-center"
          )}
        >
          <LogOut size={18} />
          {isOpen && <span className="ml-2">退出登录</span>}
        </button>
      </div>
    </motion.aside>
  );
}
