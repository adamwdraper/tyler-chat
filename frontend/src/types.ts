export interface Message {
  id: string;
  content: string;
  type: string;
  senderId: string;
  timestamp: string;
}

export interface Thread {
  id: string;
  name: string;
  avatar: string;
  status: string;
  messages: Message[];
  lastActivity: string;
} 