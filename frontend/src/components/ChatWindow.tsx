import { useState, KeyboardEvent } from "react";
import { Send, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import MessageList from "./MessageList";
import type { ChatMessage } from "../types/chat";

interface ChatWindowProps {
  messages: ChatMessage[];      // 消息列表数据
  showEntities: boolean;        // 是否在助手气泡下方显示识别出的实体
  showIntent: boolean;          // 是否在助手气泡下方显示识别出的意图
  showPrompt: boolean;          // 是否在助手气泡下方显示发送给模型的原始 Prompt
  onSend: (text: string) => void; // 发送消息的回调函数
  disabled?: boolean;           // 是否禁用输入（例如正在生成答案时）
}

/**
 * 聊天窗口组件
 * 包含消息展示列表 (MessageList) 和 底部输入区域。
 */
export default function ChatWindow({
  messages,
  showEntities,
  showIntent,
  showPrompt,
  onSend,
  disabled
}: ChatWindowProps) {
  const [text, setText] = useState("");

  /**
   * 处理发送逻辑
   */
  const handleSend = () => {
    if (!text.trim() || disabled) {
      return;
    }
    onSend(text.trim());
    setText(""); // 清空输入框
  };

  /**
   * 处理回车键发送，Shift+Enter 换行
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* 消息展示区域：自动滚动到底部 */}
      <MessageList
        messages={messages}
        showEntities={showEntities}
        showIntent={showIntent}
        showPrompt={showPrompt}
      />

      {/* 底部输入区域 */}
      <div className="p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 pb-8">
        <div className="max-w-4xl mx-auto relative">
          <motion.div 
            className="relative rounded-2xl border border-slate-200 bg-white shadow-soft overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
             <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="请输入您的医疗问题..."
              disabled={disabled}
              className="w-full max-h-40 p-4 pr-14 resize-none focus:outline-none text-sm leading-relaxed text-text-main placeholder:text-text-light bg-transparent custom-scrollbar"
              rows={1}
              style={{ minHeight: "60px" }}
            />
            
            <div className="absolute right-2 bottom-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSend}
                disabled={disabled || !text.trim()}
                className={`p-2 rounded-xl flex items-center justify-center transition-colors ${
                  !text.trim() || disabled 
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                    : "bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary-hover"
                }`}
              >
                {/* 正在流式输出时显示加载动画 */}
                {disabled ? (
                  <Sparkles size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </motion.button>
            </div>
          </motion.div>
          <div className="text-center mt-2">
             <span className="text-[10px] text-text-light">内容由 AI 生成，仅供参考，不能替代专业医疗建议。</span>
          </div>
        </div>
      </div>
    </div>
  );
}

