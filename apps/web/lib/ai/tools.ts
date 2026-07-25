import { tool } from "ai";
import { z } from "zod";

/**
 * The agent's tool surface. The implementation (BuildContext) is injected so the
 * same tools operate against an in-memory FileNode[] (persisted to Dexie) and,
 * when a WebContainer is running, the live Vite project.
 */
export interface BuildContext {
  writeFile: (path: string, content: string) => Promise<void>;
  readFile: (path: string) => Promise<string>;
  listFiles: () => Promise<string[]>;
  runCommand: (command: string) => Promise<{ stdout: string; stderr: string; exitCode: number }>;
}

export function buildTools(ctx: BuildContext) {
  return {
    write_file: tool({
      description:
        "Create or overwrite a file in the project (path is project-relative, e.g. 'src/App.tsx').",
      parameters: z.object({ path: z.string(), content: z.string() }),
      execute: async ({ path, content }) => {
        await ctx.writeFile(path, content);
        return { ok: true, path };
      },
    }),
    read_file: tool({
      description: "Read a file's current contents.",
      parameters: z.object({ path: z.string() }),
      execute: async ({ path }) => ({ path, content: await ctx.readFile(path) }),
    }),
    list_files: tool({
      description: "List all files in the project.",
      parameters: z.object({}),
      execute: async () => ({ files: await ctx.listFiles() }),
    }),
    run_command: tool({
      description:
        "Run a shell command inside the project's WebContainer (e.g. 'npm install', 'npm run build'). Returns stdout/stderr/exitCode.",
      parameters: z.object({ command: z.string() }),
      execute: async ({ command }) => ctx.runCommand(command),
    }),
  };
}

export type BuildTools = ReturnType<typeof buildTools>;
