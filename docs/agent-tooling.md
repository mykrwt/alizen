# Alize — AI tooling setup

Everything an AI coding assistant needs to build Alize is pre-wired. This doc explains how to connect each assistant and what each tool does.

## TL;DR
| Capability | Tool | Where |
|---|---|---|
| Codebase memory (knowledge graph) | **graphify** | `.claude/skills/graphify/`, `graphify-out/`, hooks in `.claude/settings.json` |
| Live library docs | **context7** MCP | `.mcp.json` / `.cursor/mcp.json` |
| Browser / preview automation | **playwright** MCP | `.mcp.json` / `.cursor/mcp.json` |
| Structured reasoning | **sequential-thinking** MCP | `.mcp.json` / `.cursor/mcp.json` |
| Polished UI components | **magic** (21st.dev) MCP | optional, needs `TWENTYFIRST_API_KEY` |
| GitHub PRs/issues/checks | **github** MCP | optional, needs `GITHUB_PERSONAL_ACCESS_TOKEN` |
| Project rulebook | **AGENTS.md** | canonical; mirrored to CLAUDE.md, `.cursor/rules/`, `.windsurfrules` |

## 1. graphify — memory (already installed)
- Installed via `uv tool install graphifyy` (official double-`y` package).
- Generates `graphify-out/` = `graph.html` (clickable map), `GRAPH_REPORT.md`, `graph.json`, `wiki/`.
- The skill is registered **project-scoped** at `.claude/skills/graphify/SKILL.md`; hooks in `.claude/settings.json` prompt the assistant to query the graph before searching and rebuild it after edits.
- **Rebuild memory after big changes:** `graphify update .` (AST-only, free, no API) or `graphify .` (full, incl. community naming via LLM).
- **Query it:** `graphify query "how does auth work?"` · `graphify path "A" "B"` · `graphify explain "X"` · `graphify god-nodes`.

## 2. MCP servers
All packages below were validated to resolve on npm. Declared in **`.mcp.json`** (Claude Code) and **`.cursor/mcp.json`** (Cursor). Run via `npx -y <pkg>` (no global install needed).

| Server | Package | Purpose | Env needed? |
|---|---|---|---|
| context7 | `@upstash/context7-mcp` | Current docs for Next.js, React, Tailwind, shadcn, Vercel AI SDK | none |
| playwright | `@playwright/mcp` | Drive the live preview & E2E in a real browser | none |
| sequential-thinking | `@modelcontextprotocol/server-sequential-thinking` | Step-by-step reasoning for hard problems | none |
| magic | `@21st-dev/magic` | Generate polished React UI components | **`TWENTYFIRST_API_KEY`** (free, 21st.dev) |
| github | `@modelcontextprotocol/server-github` | PRs, issues, checks, code search | **`GITHUB_PERSONAL_ACCESS_TOKEN`** |

### Before you launch the assistant, export optional keys (once per shell):
```bash
export TWENTYFIRST_API_KEY=...               # optional, for magic MCP
export GITHUB_PERSONAL_ACCESS_TOKEN="$(gh auth token)"   # optional, for github MCP
```
If an optional server's env var is missing, that one server is skipped — the rest still work.

## 3. Per-assistant connection
- **Claude Code:** open the repo; it auto-reads `.mcp.json`, `CLAUDE.md`, `.claude/`. Run `/mcp` to confirm servers are connected (green). Type `/graphify .` to build the memory graph.
- **Cursor:** auto-reads `.cursor/mcp.json` + `.cursor/rules/*.mdc`. Check *Settings → MCP* for server status.
- **Windsurf:** reads `.windsurfrules`; add the same servers via *Settings → MCP* (or symlink `.cursor/mcp.json`).
- **Codex / Gemini CLI / others:** read `AGENTS.md`. Add MCP servers per their docs (same packages).

## 4. Rulebook hierarchy
`AGENTS.md` is canonical. Mirrors: `CLAUDE.md` (Claude), `.cursor/rules/000-alize.mdc` (Cursor), `.windsurfrules` (Windsurf). **Edit AGENTS.md first**, then sync mirrors. Status is **PLANNING** until the Decisions Log is filled — don't implement product features speculatively.
