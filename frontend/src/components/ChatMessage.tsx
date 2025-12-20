import { motion } from "framer-motion";
import { Bot, User, ChevronDown, ChevronRight, Activity, Brain, Database } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import type { ChatMessage as ChatMessageType } from "../types/chat";

interface ChatMessageProps {
  message: ChatMessageType;
  showEntities?: boolean;
  showIntent?: boolean;
  showPrompt?: boolean;
  isStreaming?: boolean;
}

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function ChatMessage({
  message,
  showEntities,
  showIntent,
  showPrompt,
  isStreaming
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const [isDebugOpen, setIsDebugOpen] = useState(false);

  const hasDebugInfo =
    message.role === "assistant" &&
    ((showEntities && message.ent) ||
      (showIntent && message.intent) ||
      (showPrompt && message.knowledge));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex w-full mb-6",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn("flex max-w-[85%] md:max-w-[75%]", isUser ? "flex-row-reverse" : "flex-row")}>
        {/* Avatar */}
        <div
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm",
            isUser ? "ml-3 bg-secondary text-white" : "mr-3 bg-primary text-white"
          )}
        >
          {isUser ? <User size={20} /> : <Bot size={20} />}
        </div>

        {/* Message Content */}
        <div className="flex flex-col items-start">
          <motion.div
            layout
            className={cn(
              "px-5 py-3 rounded-2xl shadow-sm text-sm leading-relaxed break-words",
              isUser
                ? "bg-primary text-white rounded-tr-none"
                : "bg-white text-text-main rounded-tl-none border border-slate-100"
            )}
          >
             {message.content === "正在连接模型，请稍候..." ? (
                <div className="flex space-x-1 h-6 items-center">
                  <motion.div
                    className="w-2 h-2 bg-current rounded-full opacity-60"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-current rounded-full opacity-60"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-current rounded-full opacity-60"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                  />
                </div>
             ) : (
                <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
             )}
          </motion.div>

          {/* Debug Info Accordion */}
          {hasDebugInfo && (
            <div className="mt-2 w-full">
              <button
                onClick={() => setIsDebugOpen(!isDebugOpen)}
                className="flex items-center text-xs text-text-muted hover:text-primary transition-colors"
              >
                {isDebugOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span className="ml-1 font-medium">思维链与调试信息</span>
              </button>
              
              <motion.div
                initial={false}
                animate={{ height: isDebugOpen ? "auto" : 0, opacity: isDebugOpen ? 1 : 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 p-3 bg-white/50 rounded-xl border border-slate-100 space-y-3 text-xs">
                  {showEntities && message.ent && (
                    <div className="space-y-1">
                      <div className="flex items-center text-accent-green font-semibold">
                        <Activity size={12} className="mr-1" /> 实体识别
                      </div>
                      <div className="p-2 bg-surface-background rounded-lg text-text-main font-mono">
                        {message.ent}
                      </div>
                    </div>
                  )}
                  {showIntent && message.intent && (
                    <div className="space-y-1">
                      <div className="flex items-center text-secondary font-semibold">
                        <Brain size={12} className="mr-1" /> 意图识别
                      </div>
                      <div className="p-2 bg-surface-background rounded-lg text-text-main">
                        {message.intent}
                      </div>
                    </div>
                  )}
                  {showPrompt && message.knowledge && (
                    <div className="space-y-1">
                      <div className="flex items-center text-primary font-semibold">
                        <Database size={12} className="mr-1" /> 知识库检索
                      </div>
                      <div className="p-2 bg-surface-background rounded-lg text-text-main whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar">
                        {message.knowledge}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
