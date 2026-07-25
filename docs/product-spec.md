# Alize — Product Specification

> The single authoritative description of *what* to build. Architecture lives in `architecture.md`; order of work in `roadmap.md`.

## 1. Elevator pitch
Alize is a **free, in-browser AI app builder**. Describe an app in chat; Alize builds a real **React + Vite** app across the conversation, shows it **running live**, and lets you **refine by chatting**, **download the code**, or **push it to GitHub**. Bring your own AI key. No login. Nothing to host. Nothing that can shut down.

## 2. Target users
- **Indie hackers / founders** prototyping an idea in minutes.
- **Developers** who want a fast starting scaffold they fully own.
- **Non-coders** who want a working app without writing code.
Primary audience tag: *everyone*. UX must be usable by a non-coder but not dumbed down for a dev.

## 3. Core user flow (the magic moment)
1. Land on the **marketing page** → click **"Start building"** (no signup).
2. Enter the **builder**: split screen — **chat on the left, live preview on the right**.
3. First visit: a **settings prompt** asks for at least one **AI provider API key** (stored in browser). Optionally a **GitHub token** for push/sync.
4. Pick a **model** in the top bar.
5. Type a prompt ("a pricing page for a SaaS called Nimbus with 3 tiers and a dark theme").
6. The AI **streams** its plan and **writes files** (tool-use). The **preview boots live** (WebContainers runs Vite).
7. Keep chatting to refine: "make tier 2 highlighted", "add an FAQ". The app updates live.
8. Export: **Download ZIP** or **Push to GitHub** (new repo). Optionally **sync** projects to GitHub as the durable store.

## 4. Features (MVP → later)
### Must-have (M1–M4)
- **Multi-turn chat** with the AI, message history per project, markdown rendering.
- **Live token streaming**.
- **Agent tool-use**: the AI can `write_file`, `read_file`, `list_files`, `run_command` (in the WebContainer), and read build/runtime errors to self-fix.
- **Live preview** via WebContainers (Vite dev server inside an iframe).
- **File tree** + **code view** of the generated project.
- **BYOK**: enter keys for OpenAI / Anthropic / Google / Groq / OpenRouter / Ollama; pick **model per project**.
- **Persistence**: projects, chats, files in IndexedDB (Dexie); survive reload.
- **Exports**: Download ZIP; Push to GitHub (create repo + commit).
- **Settings** page: manage keys, GitHub token, default model, clear data.

### Should-have (M5–M6)
- **Installable PWA** (manifest + offline shell).
- **Marketing landing page** (hero, how-it-works, CTA).
- **GitHub as cloud**: save/load a project to a GitHub repo/gist (durable, cross-device without a managed backend).
- Per-project **rename / duplicate / delete**; project list/home.

### Nice-to-have / later
- Multi-file **diff view** of AI changes; undo/redo of generations.
- **Branches/versions** per project.
- Direct **Deploy to Vercel** (via user's Vercel token).
- **Collaboration / sharing** (currently explicitly out of scope).
- Analytics, i18n (deferred).

## 5. Non-goals (explicit)
- No user accounts / login (guest-first). Auth is a later opt-in only.
- No managed backend or database we operate.
- No vendor lock-in (no hardcoded provider; no paid inference path).
- No sharing/multiplayer for MVP.
- Not a no-code visual canvas — it's **chat-driven**.

## 6. Constraints (from the human)
See `AGENTS.md` §3 (C1–C7). Highlights: frontend-only on Vercel · BYOK · local-first · guest mode · Web/PWA.

## 7. Acceptance criteria — "MVP done" when
- [ ] A new visitor can open the builder with **zero account**.
- [ ] They enter an OpenAI (or other) key, pick a model, and send a prompt.
- [ ] The AI **streams** a response and **writes files**; the **preview runs live**.
- [ ] They can refine with 3+ follow-up turns and the app updates.
- [ ] They can **Download ZIP** and **Push to GitHub** successfully.
- [ ] Reloading the page **restores** the project + chat from IndexedDB.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` pass; Playwright smoke test green.
- [ ] Deploys to Vercel with WebContainers working (COOP/COEP set).

## 8. Design language
- **Brand:** Alize. Tagline candidate: *"Describe it. Ship it."*
- **Vibe:** minimal, Linear-inspired. Confident whitespace, subtle borders, restrained motion.
- **Theme:** **dark by default**, light available. Accent **violet `#7c3aed`** (hover `#6d28d9`).
- **Type:** Inter (UI) + a mono for code (e.g. Geist Mono / JetBrains Mono).
- **Layout:** responsive split — chat (≈40%) ↔ preview (≈60%); collapsible panels; mobile stacks vertically.

## 9. Out-of-scope providers' browser caveat (implementation note)
Anthropic blocks direct browser calls (CORS). For MVP we either (a) route Anthropic through the optional `/api/proxy` edge function, or (b) recommend users reach Claude via **OpenRouter** (which is browser-friendly). Document this in `docs/byok.md`. All other supported providers work directly from the browser.
