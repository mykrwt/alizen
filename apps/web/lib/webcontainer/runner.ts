import type { FileNode } from "@/lib/types";

export type ContainerStatus = "idle" | "booting" | "running" | "error";

export interface RunnerCallbacks {
  onStatus?: (status: ContainerStatus) => void;
  onServerReady?: (url: string) => void;
  onStdout?: (data: string) => void;
  onStderr?: (data: string) => void;
}

/**
 * Wraps @webcontainer/api to boot a Node/Vite runtime in the browser.
 * Browser-only. Requires `self.crossOriginIsolated === true` (COOP/COEP headers —
 * set in next.config.ts and vercel.json).
 *
 * Status: scaffold. M2 implements the full dev-server lifecycle.
 */
export class WebContainerRunner {
  private instance: unknown = null;

  constructor(private readonly cb: RunnerCallbacks = {}) {}

  get isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      (window as Window & { crossOriginIsolated?: boolean }).crossOriginIsolated === true
    );
  }

  async boot(files: FileNode[]): Promise<void> {
    if (!this.isSupported) {
      this.cb.onStatus?.("error");
      throw new Error(
        "WebContainers need cross-origin isolation (COOP/COEP). Run via `next dev`/Vercel where headers are set.",
      );
    }
    this.cb.onStatus?.("booting");
    const mod = await import("@webcontainer/api");
    const WebContainer = mod.WebContainer;
    this.instance = await WebContainer.boot();
    await this.writeTree(files);
    this.cb.onStatus?.("running");
    // TODO(M2): run `npm install` then `npm run dev`; wire server-ready → onServerReady.
  }

  async writeTree(files: FileNode[]): Promise<void> {
    const inst = this.requireInstance();
    await (inst as { mount: (tree: unknown) => Promise<void> }).mount(filesToTree(files));
  }

  async writeFile(path: string, content: string): Promise<void> {
    const inst = this.requireInstance();
    await (inst as { fs: { writeFile: (p: string, c: string) => Promise<void> } }).fs.writeFile(
      path,
      content,
    );
  }

  async readFile(path: string): Promise<string> {
    const inst = this.requireInstance();
    const bytes = await (
      inst as { fs: { readFile: (p: string) => Promise<Uint8Array> } }
    ).fs.readFile(path);
    return new TextDecoder().decode(bytes);
  }

  async runDev(): Promise<void> {
    const inst = this.requireInstance();
    // TODO(M2): spawn `npm install` then `npm run dev`; surface stdout/stderr.
    (inst as { on: (e: string, cb: (...a: unknown[]) => void) => void }).on(
      "server-ready",
      (...args: unknown[]) => {
        const url = args[1] as string;
        this.cb.onServerReady?.(url);
      },
    );
  }

  teardown(): void {
    try {
      (this.instance as { teardown?: () => void } | null)?.teardown?.();
    } catch {
      /* noop */
    }
    this.instance = null;
    this.cb.onStatus?.("idle");
  }

  private requireInstance(): unknown {
    if (!this.instance) throw new Error("WebContainer not booted. Call boot() first.");
    return this.instance;
  }
}

/** Convert a flat FileNode[] into the nested tree @webcontainer/api expects. */
export function filesToTree(files: FileNode[]): Record<string, unknown> {
  const root: Record<string, unknown> = {};
  for (const file of files) {
    const parts = file.path.split("/");
    let node: Record<string, unknown> = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i] as string;
      if (i === parts.length - 1) {
        node[part] = { file: { contents: file.content } };
      } else {
        const next = (node[part] as Record<string, unknown> | undefined) ?? {};
        node[part] = next;
        node = next;
      }
    }
  }
  return root;
}
