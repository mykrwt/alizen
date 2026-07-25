import type { Provider } from "@/lib/types";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export interface ProviderConfig {
  provider: Provider;
  apiKey: string;
  modelId: string;
}

/**
 * BYOK model factory. Creates a LanguageModel from the user's provider + key + model id,
 * entirely in the browser. No server, no baked-in key.
 */
export function getModel({ provider, apiKey, modelId }: ProviderConfig): LanguageModel {
  switch (provider) {
    case "openai":
      return createOpenAI({ apiKey }).chat(modelId);
    case "anthropic":
      // NOTE: Anthropic blocks direct browser calls. Route via /api/proxy or use OpenRouter.
      return createAnthropic({ apiKey })(modelId);
    case "google":
      return createGoogleGenerativeAI({ apiKey })(modelId);
    case "groq":
      return createGroq({ apiKey }).languageModel(modelId);
    case "openrouter":
      return createOpenAI({ apiKey, baseURL: "https://openrouter.ai/api/v1" }).chat(modelId);
    case "ollama":
      return createOpenAI({
        apiKey: apiKey || "ollama",
        baseURL: "http://localhost:11434/v1",
      }).chat(modelId);
    default: {
      const _exhaustive: never = provider;
      throw new Error(`Unsupported provider: ${String(_exhaustive)}`);
    }
  }
}
