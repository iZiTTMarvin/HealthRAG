export type Role = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  ent?: string;
  intent?: string;
  prompt?: string;
  knowledge?: string;
}

export interface ChatWindowState {
  id: string;
  title: string;
  messages: ChatMessage[];
}
