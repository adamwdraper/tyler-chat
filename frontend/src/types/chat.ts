export interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
  timestamp: string;
  attachments?: Array<{
    filename: string;
    mime_type?: string;
    processed_content?: any;
  }>;
}

export interface Thread {
  id: string;
  title: string;
  messages: Message[];
  attributes: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ThreadCreate {
  title?: string;
  system_prompt?: string;
  attributes?: Record<string, any>;
}

export interface MessageCreate {
  role: string;
  content: string;
} 