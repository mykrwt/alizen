# Alize — Roadmap

> Build order for the AI(s). Each milestone is independently shippable. Check off acceptance items as you go.

## M0 — Foundation ✅ (this scaffold)
- [x] Repo tooling: graphify memory, MCP servers, agent rules (`AGENTS.md`, `.cursor`, `.windsurfrules`).
- [x] Docs: `product-spec.md`, `architecture.md`, `roadmap.md`, `agent-tooling.md`.
- [ ] Monorepo: pnpm workspace + Turborepo, TS strict base, Biome, Vitest, Playwright.
- [ ] `apps/web` boots: landing page + builder shell (split layout) + settings page.
- [ ] Design tokens: dark default, violet accent, Inter + mono fonts.
- [ ] PWA manifest + `vercel.json` COOP/COEP headers.
- [ ] CI: typecheck + lint + test on push.

## M1 — Chat + BYOK + single-file preview
- [ ] Dexie schema + project CRUD (home list, create/rename/delete).
- [ ] Settings: enter provider keys (localStorage), pick default model.
- [ ] `lib/ai/providers.ts` BYOK model factory (OpenAI first).
- [ ] Streaming chat UI (messages, markdown, composer).
- [ ] Render a **single** generated file in a sandboxed iframe (no WebContainer yet) as the first "live" wow.

## M2 — WebContainers runtime
- [ ] `lib/webcontainer/runner.ts`: boot, seed Vite template, `npm install`, run `vite`, surface preview URL.
- [ ] File-tree view + code view; sync files → container.
- [ ] Verify `crossOriginIsolated` on Vercel preview.

## M3 — Agent loop (the real builder)
- [ ] `lib/ai/tools.ts`: `write_file`, `read_file`, `list_files`, `run_command` (bound to container).
- [ ] Multi-step tool-use loop; surface each tool call in the chat.
- [ ] Read build/runtime errors → feed back → self-fix.
- [ ] Persist `FileNode[]` to Dexie; restore on reload.

## M4 — Exports
- [ ] **Download ZIP** (JSZip).
- [ ] **Push to GitHub**: PAT entry → create repo → commit tree.
- [ ] Optional `/api/proxy` edge route for Anthropic (documented in `byok.md`).

## M5 — Polish: landing + PWA
- [ ] Marketing landing (hero, how-it-works, CTA → /builder).
- [ ] Installable PWA (icons, offline shell, theme color).
- [ ] Empty/loading/error states across the app; keyboard shortcuts (⌘K, ⌘Enter).

## M6 — GitHub as cloud (durable, no managed backend)
- [ ] Save/load a project to a GitHub repo/gist.
- [ ] Project list shows sync status; conflict-free last-write-wins for MVP.

## Later (explicitly deferred)
Direct Vercel deploy · diff/undo · branches/versions · sharing/multiplayer · analytics · i18n.

---
**Definition of MVP done:** all of M0–M4 + landing/PWA from M5, per acceptance criteria in `product-spec.md` §7.
