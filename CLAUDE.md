## Alize — project guide
**Status: PLANNING.** Read **`AGENTS.md`** (canonical rulebook) before doing anything product-related. Only build what the **Decisions Log** (in AGENTS.md) marks ✅ Confirmed. If something is ambiguous, **ask the human** — do not assume.
Hard constraints: C1 frontend-only on Vercel · C2 BYOK (user's own AI key) · C3 local-first storage (IndexedDB/Dexie, no managed-backend dependency) · C4 prompt→app · C5 web/PWA · C6 scaffold-first.
Tooling: MCP servers (`.mcp.json`), graphify memory (below), Cursor rules (`.cursor/`), Windsurf (`.windsurfrules`). See `docs/agent-tooling.md`.

---

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
