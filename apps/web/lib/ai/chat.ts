import { type CoreMessage, streamText } from "ai";
import { type ProviderConfig, getModel } from "./providers";
import { type BuildContext, buildTools } from "./tools";

export const SYSTEM_PROMPT = `You are Alize, an expert full-stack app builder working inside the user's browser.
You build a React + Vite + TypeScript + Tailwind app from the user's requests.

Rules:
- Use the provided tools to create and modify files: write_file, read_file, list_files, run_command.
- Paths are project-relative (e.g. "src/App.tsx", "index.html").
- The project runs inside a WebContainer. Use run_command to "npm install" deps and to verify builds.
- Prefer minimal, correct, well-structured code. Use TypeScript. Use Tailwind for styling.
- After making changes, briefly tell the user what you built and confirm it runs.
- Never invent file contents you didn't write; read before editing when unsure.`;

export interface RunChatArgs {
  config: ProviderConfig;
  messages: CoreMessage[];
  ctx: BuildContext;
  maxSteps?: number;
  onDelta?: (textDelta: string) => void;
  onToolCall?: (name: string, args: unknown) => void;
}

/**
 * Runs the agent loop: the model can call tools across multiple steps, observing results
 * and self-correcting (e.g. reading build errors and fixing them). Events stream to the UI.
 */
export async function runChat({
  config,
  messages,
  ctx,
  maxSteps = 12,
  onDelta,
  onToolCall,
}: RunChatArgs): Promise<string> {
  const result = streamText({
    model: getModel(config),
    system: SYSTEM_PROMPT,
    messages,
    tools: buildTools(ctx),
    maxSteps,
    onError: ({ error }) => console.error("[alize] stream error", error),
  });

  for await (const part of result.fullStream) {
    switch (part.type) {
      case "text-delta":
        onDelta?.(part.textDelta);
        break;
      case "tool-call":
        onToolCall?.(part.toolName, part.args);
        break;
      default:
        break;
    }
  }

  return await result.text;
}
