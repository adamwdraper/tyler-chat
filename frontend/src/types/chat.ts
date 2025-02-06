export interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

export interface ImageUrl {
  url: string;
}

export interface ImageContent {
  type: 'image_url';
  image_url: ImageUrl;
}

export interface TextContent {
  type: 'text';
  text: string;
}

export interface WeaveCall {
  id: string;
  trace_id: string;
  project_id: string;
  request_id: string;
}

export interface MessageMetrics {
  model: string | null;
  timing: {
    started_at: string | null;
    ended_at: string | null;
    latency: number;
  };
  usage: {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
  };
  weave_call: WeaveCall;
}

export interface Message {
  id: string;
  role: "system" | "user" | "assistant" | "tool";
  sequence?: number;  // Message sequence number within thread
  content: string | (TextContent | ImageContent)[];
  name?: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
  attributes: Record<string, any>;
  timestamp: string;
  source?: Record<string, any>;
  attachments: Array<{
    filename: string;
    content: string;  // base64 string
    mime_type?: string;
    processed_content?: any;
  }>;
  metrics: MessageMetrics;
}

export interface Thread {
  id: string;
  title: string;
  messages: Message[];
  attributes: Record<string, any>;
  source?: Record<string, any>;
  created_at: string;
  updated_at: string;
  get_total_tokens(): {
    overall: {
      completion_tokens: number;
      prompt_tokens: number;
      total_tokens: number;
    };
    by_model: Record<string, {
      completion_tokens: number;
      prompt_tokens: number;
      total_tokens: number;
    }>;
  };
  get_model_usage(model_name?: string): Record<string, {
    calls: number;
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
  }>;
  get_message_timing_stats(): {
    total_latency: number;
    average_latency: number;
    message_count: number;
  };
  get_message_counts(): {
    system: number;
    user: number;
    assistant: number;
    tool: number;
  };
  get_tool_usage(): {
    tools: Record<string, number>;
    total_calls: number;
  };
}

export interface ThreadCreate {
  title?: string;
  system_prompt?: string;
  attributes?: Record<string, any>;
  source?: Record<string, any>;
  metrics?: {
    completion_tokens?: number;
    prompt_tokens?: number;
    total_tokens?: number;
    model_usage?: Record<string, any>;
  };
}

export interface MessageCreate {
  role: "system" | "user" | "assistant" | "tool";
  content: string | (TextContent | ImageContent)[];
  name?: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
  attributes?: Record<string, any>;
  source?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: string;
    mime_type?: string;
  }>;
} 