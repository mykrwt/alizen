# Alize — Architecture

> *How* it's built. Pair with `product-spec.md` (what) and `roadmap.md` (when).

## 1. High-level
A single **Next.js 15** app (`apps/web`) on Vercel. 100% client-driven except an optional edge proxy. Everything a user creates is stored locally (IndexedDB) and optionally mirrored to **their own GitHub**.

```
Browser (Next.js app)
 ├─ Chat UI ──► Vercel AI SDK (BYOK) ──► provider API (OpenAI/Anthropic/Gemini/Groq/OpenRouter/Ollama)
 │                ▲ tool-use loop
 │                └─ tools: write_file / read_file / list_files / run_command
 ├─ WebContainer (WASM Node) ── runs the generated React+Vite app ──► <iframe> preview
 ├─ Dexie (IndexedDB) ── projects, messages, files, settings
 └─ Exports: JSZip (ZIP) · Octokit (GitHub push / cloud sync)
(Edge, optional) /api/proxy ── for providers that block browser calls (Anthropic)
```

## 2. Folder structure (target)
```
apps/web
├─ app/                     # Next.js App Router
│  ├─ layout.tsx            # root layout, fonts, ThemeProvider, metadata
│  ├─ globals.css           # Tailwind + design tokens (dark/violet)
│  ├─ page.tsx              # marketing landing
│  ├─ builder/page.tsx      # the builder (split: chat ↔ preview)
│  ├─ settings/page.tsx     # keys, GitHub token, defaults, data controls
│  └─ manifest.ts           # PWA manifest
├─ components/
│  ├─ ui/                   # button, input, textarea, card, select, dialog, … (shadcn-style)
│  ├─ landing/              # hero, features, footer
│  └─ builder/              # chat-panel, message, composer, preview-panel, file-tree, topbar, model-picker, code-view
├─ lib/
│  ├─ types.ts              # Project, Message, FileNode, Provider, Model, Settings
│  ├─ db.ts                 # Dexie schema + CRUD
│  ├─ store.ts              # Zustand: active project/session UI state
│  ├─ env.ts                # typed env (NEXT_PUBLIC_*)
│  ├─ utils.ts              # cn(), etc.
│  ├─ ai/
│  │  ├─ providers.ts       # BYOK model factory (provider + key + modelId → LanguageModel)
│  │  ├─ models.ts          # curated model catalog per provider
│  │  ├─ tools.ts           # agent tools (file ops + run_command) bound to the active WebContainer
│  │  └─ chat.ts            # streamText/agent runner; maps tool calls → FS mutations + preview refresh
│  ├─ webcontainer/runner.ts# boot WebContainer, write tree, run `npm install` + `vite`, expose preview URL
│  ├─ project/              # vite template scaffolder (initial files), fs helpers
│  ├─ github/export.ts      # create repo + commit tree (Octokit)
│  ├─ github/sync.ts        # (later) push/pull project as repo
│  └─ zip.ts                # build & download ZIP (JSZip)
├─ hooks/                   # use-projects, use-active-project, use-settings
└─ public/                  # icons, og image
```

## 3. Data model (Dexie / IndexedDB)
```ts
Project   { id, title, createdAt, updatedAt, provider, modelId, files: FileNode[] }
Message   { id, projectId, role: 'user'|'assistant'|'tool', content, toolCalls?, createdAt }
FileNode  { path, content, isBinary? }            // virtual FS for the generated app
Settings  { id:'global', keys: Record<Provider,string>, githubToken?, defaultModel? }
```
- `files` mirror the WebContainer FS so reload restores state and ZIP/export work without a running container.
- Keys live in **localStorage** (simple, per `C2`/Decisions). Never sent anywhere except the chosen provider (or our optional proxy).

## 4. The build loop (prompt → running app)
1. User sends a message.
2. `lib/ai/chat.ts` calls the AI SDK with the active model + a **system prompt** ("you build a React+Vite app; use tools to create/modify files; the project runs in a WebContainer").
3. The model emits **tool calls**: `write_file({path,content})`, `read_file`, `list_files`, `run_command`.
4. Each tool call mutates the in-memory `FileNode[]` (persisted to Dexie) and, when stable, syncs into the **WebContainer**; `run_command` shells inside the container and returns stdout/stderr.
5. The **Vite dev server** inside the container HMR-reloads; the iframe shows it live.
6. Tool results go back to the model (loop) until it finishes; assistant message streams to the chat UI throughout.

## 5. WebContainers
- `@webcontainer/api`. Boot once per project; seed with the Vite template + current files.
- Cross-origin isolation **required**: `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Epoch/Embedder-Policy: require-corp` (or `credentialless`). Set in **`vercel.json`** headers + `next.config.ts`. Validate with `self.crossOriginIsolated` at runtime.
- Dev server runs on an internal port; we `webcontainer.on('server-ready', ...)` to get the iframe URL.

## 6. BYOK provider matrix (browser-direct)
| Provider | Package | Browser-direct? | Notes |
|---|---|---|---|
| OpenAI | `@ai-sdk/openai` | ✅ | set `dangerouslyAllowBrowser` (AI SDK handles) |
| Google Gemini | `@ai-sdk/google` | ✅ | API key, CORS ok |
| Groq | `@ai-sdk/groq` | ✅ | OpenAI-compatible |
| OpenRouter | `@ai-sdk/openai` (compat) | ✅ | one key → many models |
| Ollama (local) | `@ai-sdk/openai` (compat, baseURL) | ✅ | user runs Ollama locally |
| Anthropic | `@ai-sdk/anthropic` | ⚠️ | blocked from browser → use `/api/proxy` or OpenRouter |

## 7. Exports & "cloud"
- **ZIP:** collect `FileNode[]` → JSZip → `file-saver`. No deps, no tokens.
- **Push to GitHub:** user's PAT (scope `repo`) → `octokit.repos.create…` + create tree/commit. Plain `fetch` blob updates.
- **GitHub-as-cloud (later):** serialize a Project (files + messages) to a repo/gist for durable cross-device storage without a managed backend — satisfies "no shutdown."

## 8. State management
- **Zustand** for ephemeral UI/build session state (active panel, streaming status, container status).
- **Dexie** (`dexie-react-hooks` `useLiveQuery`) for persisted entities (projects, messages).
- **React state/local** for forms.

## 9. Testing strategy
- **Vitest** — unit tests for `lib/` (providers factory, fs/zip helpers, tools dispatch).
- **Playwright** — E2E smoke: open builder → (mocked or BYOK) send prompt → see preview → download ZIP.
- **Biome** — lint + format. **tsc --noEmit** — typecheck.

## 10. Security/privacy notes
- Keys are the user's, in their browser. UI must warn that browser storage is device-local.
- Sanitize/validate provider responses; never `eval` model output directly.
- WebContainer runs untrusted-by-proxy code in a sandboxed WASM VM — still, cap generated `run_command` allowlist where practical (future hardening).
