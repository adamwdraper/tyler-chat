export interface Thread {
  id: string;
  name: string;
  avatar: string;
  status: string;
  messages: ThreadMessage[];
  lastActivity: string;
}

export interface ThreadMessage {
  id: string;
  content: string;
  timestamp: string;
  senderId: 'user' | 'assistant';
  status?: 'sending' | 'sent' | 'error';
}

export interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
}

export interface WebSocketMessage {
  type: string;
  threadId: string;
  message: ThreadMessage;
} 