"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { runChat } from "@/lib/ai/chat";
import { MODELS, PROVIDERS, modelsForProvider } from "@/lib/ai/models";
import type { ProviderConfig } from "@/lib/ai/providers";
import type { BuildContext } from "@/lib/ai/tools";
import { getProject, saveProject } from "@/lib/db";
import { pushToGitHub } from "@/lib/github/export";
import { getGithubToken, getKey } from "@/lib/keys";
import { viteTemplate } from "@/lib/project/template";
import {
  type ChatMessage,
  type FileNode,
  type Project,
  type Provider,
  newProject,
} from "@/lib/types";
import { type ContainerStatus, WebContainerRunner } from "@/lib/webcontainer/runner";
import { downloadZip } from "@/lib/zip";
import type { CoreMessage } from "ai";
import {
  Download,
  FileCode2,
  Github,
  Loader2,
  Send,
  Settings as SettingsIcon,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const ACTIVE_KEY = "alize.activeProjectId";

function rid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `m_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function slug(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "alize-app"
  );
}

function upsertFile(prev: FileNode[], path: string, content: string): FileNode[] {
  const exists = prev.some((f) => f.path === path);
  return exists
    ? prev.map((f) => (f.path === path ? { ...f, content } : f))
    : [...prev, { path, content }];
}

export default function BuilderPage() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [title, setTitle] = useState("Untitled app");
  const [provider, setProvider] = useState<Provider>("openai");
  const [modelId, setModelId] = useState("gpt-4.1");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [containerStatus, setContainerStatus] = useState<ContainerStatus>("idle");
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const loaded = useRef(false);
  const createdAtRef = useRef<number>(Date.now());
  const runnerRef = useRef<WebContainerRunner | null>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const filesRef = useRef(files);
  filesRef.current = files;

  // Load or create the active project, then boot the preview runtime.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const id = typeof window !== "undefined" ? localStorage.getItem(ACTIVE_KEY) : null;
      let p: Project | undefined = id ? await getProject(id) : undefined;
      if (!p) {
        p = newProject({
          title: "Untitled app",
          provider: "openai",
          modelId: "gpt-4.1",
          files: viteTemplate(),
        });
        await saveProject(p);
        localStorage.setItem(ACTIVE_KEY, p.id);
      }
      if (cancelled) return;
      setProjectId(p.id);
      setTitle(p.title);
      setProvider(p.provider);
      setModelId(p.modelId);
      createdAtRef.current = p.createdAt;
      setMessages(p.messages);
      setFiles(p.files.length ? p.files : viteTemplate());
      loaded.current = true;

      // Boot WebContainer (browser + cross-origin-isolated only).
      const runner = new WebContainerRunner({
        onStatus: setContainerStatus,
        onServerReady: setPreviewUrl,
      });
      runnerRef.current = runner;
      if (runner.isSupported) {
        runner
          .boot(p.files.length ? p.files : viteTemplate())
          .then(() => runner.runDev())
          .catch(() => {
            /* surfaced via status */
          });
      }
    })();
    return () => {
      cancelled = true;
      runnerRef.current?.teardown();
    };
  }, []);

  // Persist project to IndexedDB (debounced).
  useEffect(() => {
    if (!loaded.current || !projectId) return;
    const t = setTimeout(() => {
      const project: Project = {
        id: projectId,
        title,
        provider,
        modelId,
        files,
        messages,
        createdAt: createdAtRef.current,
        updatedAt: Date.now(),
      };
      saveProject(project).catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [projectId, title, provider, modelId, files, messages]);

  const onSend = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;
    const key = getKey(provider);
    if (!key && provider !== "ollama") {
      setNotice("Add your API key in Settings first.");
      return;
    }
    setNotice(null);
    setInput("");

    const userMsg: ChatMessage = { id: rid(), role: "user", content: text, createdAt: Date.now() };
    const assistantMsg: ChatMessage = {
      id: rid(),
      role: "assistant",
      content: "",
      createdAt: Date.now() + 1,
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setStreaming(true);

    const ctx: BuildContext = {
      writeFile: async (path, content) => {
        setFiles((prev) => upsertFile(prev, path, content));
        await runnerRef.current?.writeFile(path, content);
      },
      readFile: async (path) => filesRef.current.find((f) => f.path === path)?.content ?? "",
      listFiles: async () => filesRef.current.map((f) => f.path),
      runCommand: async (command) => ({
        stdout: "",
        stderr: `(WebContainer command execution lands in M2 — requested: ${command})`,
        exitCode: 0,
      }),
    };

    const history = [...messagesRef.current, userMsg]
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })) as CoreMessage[];

    const config: ProviderConfig = { provider, apiKey: key ?? "", modelId };

    try {
      await runChat({
        config,
        messages: history,
        ctx,
        onDelta: (delta) =>
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: m.content + delta } : m)),
          ),
      });
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id ? { ...m, content: `⚠️ ${(err as Error).message}` } : m,
        ),
      );
    } finally {
      setStreaming(false);
    }
  }, [input, streaming, provider, modelId]);

  async function onDownloadZip() {
    setBusy("zip");
    try {
      await downloadZip(title, files);
    } finally {
      setBusy(null);
    }
  }

  async function onPush() {
    const token = getGithubToken();
    if (!token) {
      setNotice("Add a GitHub token in Settings first.");
      return;
    }
    setBusy("github");
    try {
      const res = await pushToGitHub(token, slug(title), files);
      setNotice(`Pushed to ${res.url}`);
    } catch (err) {
      setNotice(`GitHub error: ${(err as Error).message}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/60 px-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">Alize</span>
        </Link>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-8 max-w-[14rem] text-sm"
          aria-label="Project title"
        />
        <Select
          aria-label="Provider"
          className="h-8 w-auto text-sm"
          value={provider}
          onChange={(e) => {
            const next = e.target.value as Provider;
            setProvider(next);
            setModelId((modelsForProvider(next)[0] ?? MODELS[0]!).id);
          }}
        >
          {PROVIDERS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Model"
          className="h-8 w-auto text-sm"
          value={modelId}
          onChange={(e) => setModelId(e.target.value)}
        >
          {modelsForProvider(provider).map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </Select>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={onDownloadZip} disabled={busy === "zip"}>
            {busy === "zip" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">ZIP</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onPush} disabled={busy === "github"}>
            {busy === "github" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Github className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Push</span>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="Settings">
            <Link href="/settings">
              <SettingsIcon className="h-4 w-4" />
            </Link>
          </Button>
          <ThemeToggle />
        </div>
      </header>

      {/* Split: chat | preview */}
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(320px,2fr)_3fr]">
        {/* Chat */}
        <section className="flex min-h-0 flex-col border-r border-border/60">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Describe the app you want to build. The AI will create files and run them live.
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
                      : "max-w-[90%] rounded-lg bg-card px-3 py-2 text-sm"
                  }
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content || "…"}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
              </div>
            ))}
            {streaming && <div className="text-xs text-muted-foreground">Alize is working…</div>}
          </div>

          {notice && (
            <div className="mx-4 mb-2 flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-500">
              <TriangleAlert className="h-3.5 w-3.5" /> {notice}
            </div>
          )}

          <div className="border-t border-border/60 p-3">
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    onSend();
                  }
                }}
                placeholder="Describe an app… (⌘/Ctrl+Enter to send)"
                className="min-h-16 resize-none"
              />
              <Button
                size="icon"
                onClick={onSend}
                disabled={streaming || !input.trim()}
                aria-label="Send"
              >
                {streaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </section>

        {/* Preview + files */}
        <section className="flex min-h-0 flex-col">
          <div className="flex items-center gap-2 border-b border-border/60 px-3 py-1.5 text-xs text-muted-foreground">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                containerStatus === "running"
                  ? "bg-emerald-500"
                  : containerStatus === "booting"
                    ? "bg-amber-500"
                    : containerStatus === "error"
                      ? "bg-destructive"
                      : "bg-muted-foreground"
              }`}
            />
            Preview · {containerStatus}
          </div>
          <div className="relative min-h-0 flex-1 bg-muted/30">
            {previewUrl ? (
              <iframe title="preview" src={previewUrl} className="h-full w-full" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
                {containerStatus === "error" ? (
                  <>
                    <TriangleAlert className="h-5 w-5 text-amber-500" />
                    Live preview needs cross-origin isolation (COOP/COEP). It works on the deployed
                    site / via
                    <code className="mx-1">next dev</code>, not in this static preview.
                  </>
                ) : (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Starting the in-browser runtime…
                  </>
                )}
              </div>
            )}
          </div>

          {/* File tree */}
          <div className="h-40 shrink-0 overflow-y-auto border-t border-border/60 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <FileCode2 className="h-3.5 w-3.5" /> Files ({files.length})
            </div>
            <ul className="space-y-0.5 font-mono text-xs">
              {files.map((f) => (
                <li key={f.path} className="truncate text-muted-foreground">
                  {f.path}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
