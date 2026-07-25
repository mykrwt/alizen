import type { LLMProvider } from './types';

/**
 * Catalog of supported LLM providers.
 *
 * Design principle: all providers must be OpenAI-compatible at the
 * /chat/completions endpoint, so the browser client can speak to them
 * with a uniform fetch. Where a provider has native CORS support we can
 * call it directly from the browser; otherwise we route through a thin
 * Vercel serverless proxy that does nothing but forward the request
 * (the user's API key is still used; Alizen never pays for tokens).
 */
export const PROVIDERS: LLMProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1', 'o3-mini'],
    corsFriendly: false, // OpenAI does not allow browser CORS — we proxy
    apiKeyUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'anthropic',
    name: 'Anthropic (via OpenRouter or compatible)',
    baseURL: 'https://openrouter.ai/api/v1',
    defaultModel: 'anthropic/claude-3.5-sonnet',
    models: [
      'anthropic/claude-3.5-sonnet',
      'anthropic/claude-3.5-haiku',
      'anthropic/claude-opus-4',
    ],
    corsFriendly: true,
    apiKeyUrl: 'https://openrouter.ai/keys',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter (any model)',
    baseURL: 'https://openrouter.ai/api/v1',
    defaultModel: 'openai/gpt-4o-mini',
    models: [
      'openai/gpt-4o-mini',
      'openai/gpt-4o',
      'anthropic/claude-3.5-sonnet',
      'google/gemini-2.0-flash-001',
      'google/gemini-2.5-pro-preview',
      'meta-llama/llama-3.1-70b-instruct',
      'meta-llama/llama-3.3-70b-instruct',
      'deepseek/deepseek-chat',
      'qwen/qwen-2.5-72b-instruct',
    ],
    corsFriendly: true,
    apiKeyUrl: 'https://openrouter.ai/keys',
  },
  {
    id: 'groq',
    name: 'Groq (fast, free tier)',
    baseURL: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    models: [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
    ],
    corsFriendly: false,
    apiKeyUrl: 'https://console.groq.com/keys',
  },
  {
    id: 'google',
    name: 'Google Gemini (via OpenRouter)',
    baseURL: 'https://openrouter.ai/api/v1',
    defaultModel: 'google/gemini-2.0-flash-001',
    models: ['google/gemini-2.0-flash-001', 'google/gemini-2.5-pro-preview'],
    corsFriendly: true,
    apiKeyUrl: 'https://openrouter.ai/keys',
  },
  {
    id: 'custom',
    name: 'Custom / OpenAI-compatible endpoint',
    baseURL: 'http://localhost:11434/v1', // default: Ollama
    defaultModel: 'llama3.2',
    models: ['llama3.2', 'llama3.1', 'qwen2.5-coder', 'deepseek-coder-v2'],
    corsFriendly: true, // local dev servers often allow CORS
    apiKeyUrl: '',
  },
];

export function getProvider(id: string): LLMProvider | undefined {
  return PROVIDERS.find((p) => p.id === id);
}
