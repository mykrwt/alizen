export type Provider = "openai" | "anthropic" | "google" | "groq" | "openrouter" | "ollama";

export interface ModelInfo {
  /** Model id sent to the provider API. */
  id: string;
  /** Human-readable label. */
  label: string;
  provider: Provider;
  contextWindow?: number;
}

export interface FileNode {
  /** Project-relative path, e.g. "src/App.tsx". */
  path: string;
  content: string;
}

export type Role = "user" | "assistant" | "tool" | "system";

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  /** Tool name when role === "tool" (for rendering). */
  toolName?: string;
  createdAt: number;
}

export interface Project {
  id: string;
  title: string;
  provider: Provider;
  modelId: string;
  files: FileNode[];
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface Settings {
  id: "global";
  keys: Partial<Record<Provider, string>>;
  githubToken?: string;
  defaultProvider?: Provider;
  defaultModelId?: string;
}

export function newProject(p?: Partial<Project>): Project {
  const now = Date.now();
  return {
    id: cryptoRandom(),
    title: "Untitled app",
    provider: "openai",
    modelId: "gpt-4.1",
    files: [],
    messages: [],
    createdAt: now,
    updatedAt: now,
    ...p,
  };
}

function cryptoRandom(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
