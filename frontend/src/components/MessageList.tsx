import type { ChatMessage } from "../types/chat";

interface MessageListProps {
  messages: ChatMessage[];
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
  return (
    <div className="chat-content">
      {messages.map((message) => (
        <div key={message.id} className={`message ${message.role}`}>
          <div>{message.content}</div>
          {message.role === "assistant" && (showEntities || showIntent || showPrompt) && (
            <details className="message-debug">
              <summary>查看识别与知识库信息</summary>
              {showEntities && message.ent && (
                <div className="debug-block">
                  <div className="debug-title">实体识别结果</div>
                  <div className="debug-content">{message.ent}</div>
                </div>
              )}
              {showIntent && message.intent && (
                <div className="debug-block">
                  <div className="debug-title">意图识别结果</div>
                  <div className="debug-content">{message.intent}</div>
                </div>
              )}
              {showPrompt && message.knowledge && (
                <div className="debug-block">
                  <div className="debug-title">知识库信息</div>
                  <div className="debug-content">{message.knowledge}</div>
                </div>
              )}
            </details>
          )}
        </div>
      ))}
    </div>
  );
}
