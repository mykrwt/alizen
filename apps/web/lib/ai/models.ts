import type { ModelInfo, Provider } from "@/lib/types";

/** Curated model catalog per provider. Users may also type a custom model id. */
export const MODELS: ModelInfo[] = [
  { id: "gpt-4.1", label: "GPT-4.1", provider: "openai" },
  { id: "gpt-4o", label: "GPT-4o", provider: "openai" },
  { id: "o3-mini", label: "o3-mini", provider: "openai" },
  { id: "claude-3-7-sonnet-latest", label: "Claude 3.7 Sonnet", provider: "anthropic" },
  { id: "claude-3-5-haiku-latest", label: "Claude 3.5 Haiku", provider: "anthropic" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", provider: "google" },
  { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", provider: "google" },
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", provider: "groq" },
  { id: "anthropic/claude-3.7-sonnet", label: "Claude 3.7 (OpenRouter)", provider: "openrouter" },
  { id: "openai/gpt-4o", label: "GPT-4o (OpenRouter)", provider: "openrouter" },
  { id: "google/gemini-2.0-flash-exp", label: "Gemini 2.0 (OpenRouter)", provider: "openrouter" },
  { id: "llama3.2", label: "Llama 3.2 (local)", provider: "ollama" },
  { id: "qwen2.5-coder", label: "Qwen 2.5 Coder (local)", provider: "ollama" },
];

export interface ProviderMeta {
  id: Provider;
  label: string;
  keyPrefix?: string;
  /** Can the browser call this provider directly? false → needs /api/proxy or OpenRouter. */
  browserDirect: boolean;
  docs: string;
  placeholder: string;
}

export const PROVIDERS: ProviderMeta[] = [
  {
    id: "openai",
    label: "OpenAI",
    keyPrefix: "sk-",
    browserDirect: true,
    docs: "https://platform.openai.com/api-keys",
    placeholder: "sk-...",
  },
  {
    id: "anthropic",
    label: "Anthropic",
    keyPrefix: "sk-ant-",
    browserDirect: false,
    docs: "https://console.anthropic.com",
    placeholder: "sk-ant-...",
  },
  {
    id: "google",
    label: "Google Gemini",
    browserDirect: true,
    docs: "https://aistudio.google.com/apikey",
    placeholder: "AIza...",
  },
  {
    id: "groq",
    label: "Groq",
    keyPrefix: "gsk_",
    browserDirect: true,
    docs: "https://console.groq.com/keys",
    placeholder: "gsk_...",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    keyPrefix: "sk-or-",
    browserDirect: true,
    docs: "https://openrouter.ai/keys",
    placeholder: "sk-or-...",
  },
  {
    id: "ollama",
    label: "Ollama (local)",
    browserDirect: true,
    docs: "https://ollama.com",
    placeholder: "(no key needed)",
  },
];

export function modelsForProvider(provider: Provider): ModelInfo[] {
  return MODELS.filter((m) => m.provider === provider);
}

export function providerMeta(provider: Provider): ProviderMeta {
  return PROVIDERS.find((p) => p.id === provider)!;
}
