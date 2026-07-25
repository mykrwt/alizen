
<p align="center">
  <h1 align="center">
    <span style="background: linear-gradient(135deg, #7c5cff, #22d3ee); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Alizen</span>
  </h1>
  <p align="center"><strong>Build full-stack web apps with AI — free, forever.</strong></p>
</p>

<p align="center">
  <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-purple.svg" />
  <img alt="Zero infrastructure" src="https://img.shields.io/badge/infrastructure-%240-green.svg" />
  <img alt="Bring your own keys" src="https://img.shields.io/badge/BYOK-bring%20your%20own%20keys-blueviolet" />
</p>

---

## What is Alizen?

Alizen is a free, open-source AI app builder — think Vercel v0, Bolt.new, or Lovable, but built to run **indefinitely with zero recurring costs**.

**The core idea:** You bring your own API keys (OpenAI, Anthropic, Google, Groq, OpenRouter, any OpenAI-compatible endpoint). Alizen never pays for inference. Your data lives in your browser. Your projects are yours.

## Why Alizen?

| Feature | Alizen | Other AI builders |
|---|---|---|
| Cost to build | **$0** | Thousands/month |
| Inference costs | **$0** (your keys) | Paid by platform, passed to you |
| Data storage | **Your browser** | Their servers |
| Vendor lock-in | **None** — download a runnable ZIP | Often locked to their platform |
| Can it run forever? | **Yes** | Depends on funding/pricing changes |

## How it works

1. **Add your API key** (stored locally in your browser, never sent to our servers).
2. **Describe your app** in plain English.
3. Alizen streams AI responses directly from the provider to your browser — no middleman.
4. **Preview live** in a sandboxed iframe as code is generated.
5. **Iterate** with follow-up chat messages.
6. **Export** a complete ZIP file you can run locally or deploy to Vercel/Netlify/Cloudflare with one click.

## Tech stack (chosen for zero-cost, long-term sustainability)

- **Next.js 14** (App Router) — hosted free on Vercel
- **React + TypeScript + Tailwind** — premium UI, no paid UI kits
- **Zustand + IndexedDB/localStorage** — all state lives in the user's browser
- **Sandboxed iframe** for live preview — no cloud sandbox service required
- **Direct browser-to-LLM streaming** — no proxy server paying for tokens
- **JSZip** for export; no backend ZIP service
- **Serverless functions** used only for non-essential metadata (optional)

## Running locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Deploying

Click to deploy your own instance to Vercel (free):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mykrwt/alizen)

No environment variables required. No database. No paid services. Deploy once, run forever.

## Philosophy

> "Can this platform continue working indefinitely without costing the owner money?"

Every technical decision answers this question. We avoid:

- Managed databases (Supabase, Firebase, Neon, PlanetScale, MongoDB Atlas)
- Paid APIs or freemium services that can expire
- Cloud sandboxes that bill per second
- Authentication providers with per-seat costs

We prefer:

- User-owned data (local storage, browser)
- User-supplied credentials (BYOK)
- Static hosting + serverless functions
- Open standards (OpenAI-compatible APIs work everywhere)
- Exportable, portable artifacts (plain HTML/JS/CSS/React projects you own)

## License

MIT — use it, fork it, build your own. Free forever.
