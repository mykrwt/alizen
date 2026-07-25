# Alize — Agent Guide (canonical)

> **Read this first.** Single source of truth for any AI agent (Claude Code, Cursor, Windsurf, Codex, Gemini CLI, …) in this repo. Cursor/Windsurf rules mirror it.

## 1. What Alize is (one line)
**Alize is a free, AI prompt-to-app builder that runs in the browser.** A person describes an app, Alize uses **their own AI API key (BYOK)** to build a full **React + Vite** app across a multi-turn chat, shows it **live via WebContainers**, and lets them **refine by chatting**, **download a ZIP**, or **push to GitHub** — with **no login, no backend to run, and no shutdown risk** (everything is local-first; GitHub is the optional "cloud").

## 2. Project status: 🟢 SPEC READY
Requirements are **locked** (see `docs/product-spec.md`). Implement the scaffold + features in the order defined by `docs/roadmap.md`.
- Build only what the **Decisions Log** marks ✅.
- Still unsure about something? **Ask the human** — don't invent.
- Keep the memory graph current: `graphify update .` after code changes.

## 3. Hard constraints (non-negotiable)
| # | Constraint | Why |
|---|---|---|
| C1 | **Frontend-only, deployed on Vercel.** No long-running server. Serverless functions are OK (they're Vercel infra, not a hosted DB/app server). | No ops, no shutdown. |
| C2 | **BYOK** — the user pastes their own AI provider key; Alize calls the provider. Never bake in paid inference. | We never pay; no plan can kill it. |
| C3 | **Local-first storage.** Projects/chats/keys live in the browser (IndexedDB). GitHub is the optional "cloud." No managed backend dependency to function. | Free, durable, no shutdown. |
| C4 | **Multi-turn chat → working app** is the core experience. | Defines the UX. |
| C5 | **Web / PWA.** | One codebase, installable. |
| C6 | **No auth / guest mode** by default. | Lowest friction. |
| C7 | Scaffold + architecture first, features incrementally. | Quality-first. |

## 4. Stack (confirmed)
**App (the builder):** Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 3 · shadcn-style UI · Zustand · next-themes.
**AI:** Vercel AI SDK (`ai`) + provider packages (`@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/groq`, OpenAI-compatible for OpenRouter/Ollama). BYOK from the browser; optional `/api/proxy` route only for providers that block direct browser calls (Anthropic).
**Runtime preview:** `@webcontainer/api` (StackBlitz) — boots Node + Vite in-browser. Requires **COOP/COEP** cross-origin isolation (set in `vercel.json` + `next.config`).
**Storage:** Dexie (IndexedDB) — projects, messages, files, settings, encrypted-ish keys in localStorage.
**Exports:** JSZip (+ file-saver) for ZIP; `@octokit/rest` for GitHub push.
**Tooling:** pnpm + Turborepo · Biome (lint/format) · Vitest · Playwright · GitHub Actions.

## 5. Decisions Log (all ✅ = locked)
| Decision | Status | Value |
|---|---|---|
| Core generation flow | ✅ | Multi-turn chat builder — app grows file-by-file (bolt.new / Lovable style) |
| Generated artifact | ✅ | React + Vite multi-file SPA |
| Live preview mechanism | ✅ | WebContainers (in-browser Node/Vite); COOP/COEP required |
| AI build scope | ✅ | Unlimited — AI builds whatever the user asks. Exports: Download ZIP · Push to GitHub |
| Refinement UX | ✅ | Prompt-based chat refinement |
| Templates | ✅ | None — pure AI from a blank prompt |
| AI providers | ✅ | OpenAI · Anthropic · Google Gemini · Groq · OpenRouter · Ollama (Vercel AI SDK adapters) |
| API-key storage | ✅ | Browser localStorage (per-provider) |
| Model selection + streaming | ✅ | User picks model per project (dropdown); tokens stream live |
| Build reliability | ✅ | Full agent loop w/ tool-use (create/read/list files, run build, read errors, self-fix) |
| Auth model | ✅ | None — guest/local only |
| Cross-device sync | ✅ | Local-first (Dexie) + GitHub as the "cloud" (projects → repos/gists, BYOK token) |
| Sharing & collaboration | ✅ | None — private, single-user |
| Brand + vibe + theme | ✅ | "Alize" · minimal/Linear-style · dark default · violet accent `#7c3aed` |
| Layout + audience | ✅ | Split: chat left ↔ live preview right · audience = everyone |
| Landing + extras | ✅ | Marketing landing + installable PWA; analytics & i18n deferred |
| Build assistant | ✅ | Claude Code (primary); MCP + rules wired for Claude, Cursor, Windsurf |

## 6. Agent workflow & principles
1. **Memory first.** If `graphify-out/graph.json` exists, run `graphify query "<q>"` / `graphify path A B` / `graphify explain X` before grepping. Run `graphify update .` after edits (hooks nudge this).
2. **Don't assume.** Requirements come from the Decisions Log + `docs/product-spec.md`. Unsure → ask.
3. **Respect the constraints (C1–C7).** Flag anything that needs a server or a paid path.
4. **Type-safe.** Strict TS, no `any` without a justifying comment. Validate external shapes with Zod.
5. **Local-first.** No feature may *require* a backend to work. Backend/edge functions = optional enhancement.
6. **Small commits** on `arena/019f976c-alize` only.
7. **Quality gates before "done":** `pnpm typecheck && pnpm lint && pnpm test`.

## 7. Tooling map
| Need | Where |
|---|---|
| Knowledge-graph memory | `graphify-out/` · rebuild `graphify .` / `graphify update .` |
| graphify skill + hooks | `.claude/skills/graphify/`, `.claude/settings.json` |
| MCP servers (Claude) | `.mcp.json` |
| MCP servers (Cursor) | `.cursor/mcp.json` |
| Cursor rules | `.cursor/rules/000-alize.mdc` |
| Windsurf rules | `.windsurfrules` |
| Full tooling how-to | `docs/agent-tooling.md` |
| Product spec | `docs/product-spec.md` |
| Architecture | `docs/architecture.md` |
| Roadmap / milestones | `docs/roadmap.md` |

## 8. Command map
```
pnpm install
pnpm dev            # start builder (apps/web, Next.js) on :3000
pnpm build
pnpm typecheck
pnpm lint
pnpm test           # Vitest unit tests
pnpm test:e2e       # Playwright (needs `pnpm dev` running)
graphify .          # full memory rebuild (LLM community naming)
graphify update .   # AST-only memory refresh (free)
```
