<div align="center">

# Alize

### Describe it. Ship it.

A **free, in-browser AI app builder**. Describe an app in chat — Alize builds a real **React + Vite** app live in your browser using **your own AI key**, shows it running instantly, and lets you refine, **download a ZIP**, or **push to GitHub**.

**BYOK · Local-first · No login · No backend · No shutdown.** Hosted free on Vercel.

</div>

---

## ✨ What it does
1. Open the **builder** (no signup).
2. Add your **AI provider key** (OpenAI / Anthropic / Gemini / Groq / OpenRouter / Ollama).
3. **Describe** an app → the AI **writes files**, runs them in a live **WebContainer** preview, and **self-fixes** errors.
4. **Refine by chatting**, then **Download ZIP** or **Push to GitHub**.

Everything (projects, chats, files, keys) lives in your browser. GitHub is the optional durable "cloud."

## 🚀 Quickstart
```bash
corepack enable pnpm          # or: npm i -g pnpm
pnpm install
pnpm dev                      # http://localhost:3000
```
Then open **/settings** to add a provider key, and **/builder** to start building.

## 🧱 Stack
Next.js 15 · React 19 · TypeScript (strict) · Tailwind · shadcn-style UI · Zustand · **Vercel AI SDK** (BYOK) · **Dexie** (IndexedDB) · **@webcontainer/api** (live preview) · JSZip · Octokit · pnpm + Turborepo · Biome · Vitest · Playwright.

## 📁 Project layout
```
apps/web            # the Alize builder (Next.js)
  app/              # routes: landing, /builder, /settings (+ manifest, icon)
  components/       # ui primitives, site-header, theme, builder UI
  lib/              # types, db (Dexie), ai (providers/tools/chat), webcontainer, project, github, zip, keys
  test/ · e2e/      # Vitest unit + Playwright smoke
docs/               # product-spec, architecture, roadmap, byok, agent-tooling
.mcp.json           # MCP servers for AI assistants
AGENTS.md           # canonical agent rulebook
```

## 📜 Docs
- [`docs/product-spec.md`](docs/product-spec.md) — *what* to build (locked)
- [`docs/architecture.md`](docs/architecture.md) — *how* it's built
- [`docs/roadmap.md`](docs/roadmap.md) — milestones M0–M6
- [`docs/byok.md`](docs/byok.md) — bring-your-own-key model & the Anthropic caveat
- [`docs/agent-tooling.md`](docs/agent-tooling.md) — MCP servers, graphify memory, rules

## 🤖 Building Alize with an AI assistant
This repo is pre-wired for AI coding agents:
- **Memory:** graphify knowledge graph (run `graphify .` or `graphify update .`).
- **MCP:** context7 (docs), playwright (preview), sequential-thinking, magic, github — see `.mcp.json`.
- **Rules:** `AGENTS.md` (canonical) mirrored to `CLAUDE.md`, `.cursor/rules/`, `.windsurfrules`.
- **Primary assistant:** Claude Code. Status is **🟢 SPEC READY** — see the roadmap for build order.

## 🛠️ Commands
| Command | What it does |
|---|---|
| `pnpm dev` | Start the builder on :3000 |
| `pnpm build` | Production build |
| `pnpm typecheck` | `tsc --noEmit` across the workspace |
| `pnpm lint` | Biome check |
| `pnpm test` | Vitest unit tests |
| `pnpm test:e2e` | Playwright smoke tests (starts dev server) |
| `graphify update .` | Refresh the codebase memory graph (free, AST-only) |

## ▲ Deploying to Vercel
This is a **pnpm + Turborepo monorepo**; the deployable app is `apps/web`. Vercel must be told
where the Next.js output lives or it falls back to looking for a static `public/` directory and
fails with `No Output Directory named "public" found after the Build completed`.

**Recommended (Vercel Project → Settings → Build & Deployment):**

| Setting | Value |
|---|---|
| Framework Preset | Next.js |
| **Root Directory** | `apps/web` |
| Include files outside the Root Directory | ✅ enabled (needed for the workspace root + lockfile) |
| Build Command | leave default (`next build`), or `cd ../.. && pnpm turbo run build --filter=web` |
| Output Directory | leave default (`.next`) |
| Install Command | leave default (Vercel detects pnpm) |

With Root Directory set to `apps/web`, Vercel reads `apps/web/vercel.json` and the root
`vercel.json` is ignored — both files carry the same COOP/COEP headers so the config is
identical either way.

**Fallback (Root Directory left at the repo root):** the root `vercel.json` pins
`framework: nextjs`, the Turborepo build command, and `outputDirectory: apps/web/.next` so the
build is discoverable from the root. Setting the Root Directory is still the more reliable path.

## ⚙️ Notes
- **WebContainers** require cross-origin isolation → COOP/COEP headers are set in `vercel.json`, `apps/web/vercel.json`, and `next.config.ts`.
- **No `.env` needed** — keys/tokens are entered in-app (Settings) and stored in the browser.

## 📄 License
MIT.
