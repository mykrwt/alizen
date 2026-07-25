// Core types for Alizen

export type Role = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  /** When this message contained or produced file edits, the resulting file snapshot versions */
  fileVersions?: Record<string, number>;
  createdAt: number;
}

export interface ProjectFile {
  path: string;
  content: string;
  /** Which kind of file — used for syntax highlighting and preview */
  type: 'html' | 'css' | 'js' | 'jsx' | 'ts' | 'tsx' | 'json' | 'md' | 'other';
  /** Version counter — increments on each edit */
  version: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  files: ProjectFile[];
  /** Ordered chat history */
  messages: ChatMessage[];
  /** Entry file used for preview (defaults to index.html) */
  entryFile: string;
  createdAt: number;
  updatedAt: number;
}

export interface LLMProvider {
  id: string;
  name: string;
  /** Base URL for chat completions (OpenAI-compatible) */
  baseURL: string;
  /** Default model id */
  defaultModel: string;
  /** Common model options */
  models: string[];
  /** Whether the endpoint is CORS-accessible from a browser */
  corsFriendly?: boolean;
  /** Homepage URL for getting an API key */
  apiKeyUrl: string;
}

export interface UserSettings {
  /** Selected provider id */
  providerId: string;
  /** Per-provider API keys, stored in browser only */
  apiKeys: Record<string, string>;
  /** Per-provider selected model overrides */
  selectedModels: Record<string, string>;
  /** UI theme */
  theme: 'dark' | 'light';
  /** Whether to send system info with requests */
  verbose: boolean;
}

export interface StreamingState {
  isStreaming: boolean;
  abortController: AbortController | null;
  /** Partial message content while streaming */
  streamingContent: string;
}
