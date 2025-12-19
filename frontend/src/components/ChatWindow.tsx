import { useState } from "react";

import MessageList from "./MessageList";
import type { ChatMessage } from "../types/chat";

interface ChatWindowProps {
  messages: ChatMessage[];
  showEntities: boolean;
  showIntent: boolean;
  showPrompt: boolean;
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function ChatWindow({
  messages,
  showEntities,
  showIntent,
  showPrompt,
  onSend,
  disabled
}: ChatWindowProps) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) {
      return;
    }
    onSend(text.trim());
    setText("");
  };

  return (
    <>
      <MessageList
        messages={messages}
        showEntities={showEntities}
        showIntent={showIntent}
        showPrompt={showPrompt}
      />
      <div className="chat-input">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="请输入你的医疗问题..."
          disabled={disabled}
        />
        <button type="button" onClick={handleSend} disabled={disabled}>
          {disabled ? "发送中..." : "发送"}
        </button>
      </div>
    </>
  );
}
