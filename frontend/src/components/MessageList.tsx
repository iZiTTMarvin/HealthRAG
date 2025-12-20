import { useRef, useEffect } from "react";
import ChatMessage from "./ChatMessage";
import type { ChatMessage as ChatMessageType } from "../types/chat";

interface MessageListProps {
  messages: ChatMessageType[];
  showEntities: boolean;
  showIntent: boolean;
  showPrompt: boolean;
}

export default function MessageList({
  messages,
  showEntities,
  showIntent,
  showPrompt
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar scroll-smooth">
      <div className="max-w-4xl mx-auto">
        {messages.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-full text-center text-text-muted mt-20 opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5c0-2 2-3 4-4a4 4 0 0 0-4-4Z"/></svg>
              </div>
              <h2 className="text-xl font-semibold text-text-main mb-2">欢迎使用 HealthRAG</h2>
              <p className="max-w-md">我是您的智能医疗助手。您可以问我关于疾病、症状、治疗方案等问题。</p>
           </div>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              showEntities={showEntities}
              showIntent={showIntent}
              showPrompt={showPrompt}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
