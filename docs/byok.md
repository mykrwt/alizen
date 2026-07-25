# Alize — BYOK (Bring Your Own Key)

Alize never pays for AI inference and never holds a master key. Each user provides their own provider key; the app calls the provider **directly from the browser**. Keys are stored in `localStorage` only.

## Supported providers

| Provider | Browser-direct? | Notes |
|---|---|---|
| OpenAI | ✅ | `sk-...` |
| Google Gemini | ✅ | `AIza...` |
| Groq | ✅ | `gsk_...` |
| OpenRouter | ✅ | `sk-or-...` — one key, many models |
| Ollama (local) | ✅ | no key; user runs Ollama on `localhost:11434` |
| Anthropic | ⚠️ | **Blocked from browsers (CORS).** |

## Handling Anthropic (the one caveat)

Anthropic's API does not allow direct browser calls. Two clean options:

1. **Use Claude via OpenRouter** (recommended, fully browser-direct). OpenRouter proxies Anthropic and is CORS-friendly. The user pastes an OpenRouter key and picks `anthropic/claude-3.7-sonnet`.
2. **Route through `/api/proxy`** (a tiny Vercel edge function we add in M4). The browser calls our function, which forwards to Anthropic with the user's key (passed in the request header, never stored server-side). This keeps us "frontend-only on Vercel" — edge functions are Vercel infra, not a hosted app/DB.

## Security model

- Keys live **only** in the user's browser (`localStorage`). They are sent solely to the chosen provider's API endpoint (or our optional same-origin proxy).
- Alize has **no server-side storage of keys** and **no accounts**.
- Clearing data (Settings → "Clear all local data") wipes keys + local projects.

## Why BYOK

- **Free forever for us** — we run no inference.
- **No vendor plan can shut the product down** — there's no managed AI plan to deprecate.
- **User owns cost & model choice** — pick the cheapest or the best.
