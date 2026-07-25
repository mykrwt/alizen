import type { ChatMessage, ProjectFile } from './types';
import { getProvider } from './providers';

/**
 * Direct browser-to-LLM streaming client.
 *
 * We always call the provider using the OpenAI-compatible chat/completions
 * SSE protocol. For providers that don't allow CORS from the browser we
 * fall back to a tiny serverless proxy at /api/proxy that simply forwards
 * the request. Importantly, the proxy does NOT store or pay for keys —
 * the user's API key is sent in the Authorization header of every request
 * just like it would be directly.
 */

export interface LLMCallOptions {
  providerId: string;
  apiKey: string;
  model?: string;
  baseURL?: string;
  messages: ChatMessage[];
  files?: ProjectFile[];
  signal?: AbortSignal;
  /** Called for each token delta as it arrives */
  onDelta?: (text: string) => void;
  /** Higher temperature = more creative */
  temperature?: number;
}

export interface LLMResult {
  content: string;
  fullRaw: any;
}

const SYSTEM_PROMPT = `You are Alizen, an expert AI software architect and frontend engineer.

Your job is to help the user build a working web application by writing real, runnable code.

RULES:
1. You MUST produce actual working code. Do not give pseudo-code or placeholders.
2. The app runs inside a single HTML page that may contain inline CSS and JavaScript.
   If the user asks for more complexity you can split it into multiple files.
3. Use modern web standards: ES modules, CSS variables, semantic HTML.
4. You MAY use CDN imports (e.g. https://esm.sh or unpkg) for libraries like React, Vue, etc.
5. ALWAYS prefer beautiful, polished UI: good typography, spacing, colors, micro-interactions.
6. When the user asks you to create or modify the app, output code using this EXACT XML format:

<alizen-files>
  <file path="index.html">
    ... full file content here ...
  </file>
  <file path="style.css">
    ... optional additional files ...
  </file>
  <file path="app.js">
    ... optional additional files ...
  </file>
</alizen-files>

7. You MUST include EVERY file the app needs, each with COMPLETE content (no "// rest unchanged" shortcuts).
8. Before the <alizen-files> block you may briefly (1-3 sentences) explain what you're doing.
9. If the user is chatting or asking a non-coding question, just answer normally WITHOUT the <alizen-files> block.
10. Start simple. The first version should be a single index.html file. Add complexity only when asked.
11. Make the apps LOOK PREMIUM. Use gradients, subtle shadows, nice color palettes, responsive layout.

Remember: the user will see your code running LIVE in a preview iframe as you type. Make it work.`;

/** Build the messages array to send to the LLM, including current file state */
export function buildRequestMessages(
  messages: ChatMessage[],
  files: ProjectFile[]
): Array<{ role: string; content: string }> {
  const systemContent = files.length
    ? SYSTEM_PROMPT +
      '\n\nCURRENT APP FILES (reference and modify these):\n' +
      files
        .map(
          (f) =>
            `<file path="${f.path}">\n${f.content}\n</file>`
        )
        .join('\n\n')
    : SYSTEM_PROMPT;

  return [
    { role: 'system', content: systemContent },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];
}

/** Extract <alizen-files> blocks from assistant text, returning cleaned text + files */
export function parseFileBlocks(text: string): {
  reply: string;
  files: Array<{ path: string; content: string }>;
} {
  const outer = /<alizen-files>([\s\S]*?)<\/alizen-files>/g;
  const fileRegex = /<file\s+path="([^"]+)">([\s\S]*?)<\/file>/g;

  const files: Array<{ path: string; content: string }> = [];
  let reply = text;

  let m: RegExpExecArray | null;
  while ((m = outer.exec(text))) {
    const block = m[1];
    let fm: RegExpExecArray | null;
    while ((fm = fileRegex.exec(block))) {
      files.push({ path: fm[1].trim(), content: fm[2].trim() });
    }
    reply = reply.replace(m[0], '').trim();
  }

  return { reply, files };
}

/** Classify a file path into a known type */
export function classifyFile(path: string): ProjectFile['type'] {
  const lower = path.toLowerCase();
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'html';
  if (lower.endsWith('.css')) return 'css';
  if (lower.endsWith('.tsx')) return 'tsx';
  if (lower.endsWith('.ts')) return 'ts';
  if (lower.endsWith('.jsx')) return 'jsx';
  if (lower.endsWith('.js') || lower.endsWith('.mjs')) return 'js';
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.md')) return 'md';
  return 'other';
}

/** Create an empty starter project */
export function createStarterProject(): {
  files: ProjectFile[];
  entryFile: string;
} {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My Alizen App</title>
  <style>
    :root {
      --bg: #0a0a0f;
      --accent: #7c5cff;
      --accent2: #22d3ee;
      --text: #e8e8f0;
      --muted: #9999ad;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: radial-gradient(ellipse at top, rgba(124,92,255,0.15), transparent 60%), var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .container {
      text-align: center;
      max-width: 600px;
    }
    h1 {
      font-size: 3rem;
      font-weight: 800;
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 1rem;
    }
    p {
      font-size: 1.125rem;
      color: var(--muted);
      margin-bottom: 2rem;
      line-height: 1.6;
    }
    .btn {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px -10px rgba(124,92,255,0.5);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Hello from Alizen</h1>
    <p>Your AI-generated app is live. Edit the code or ask Alizen to build something new.</p>
    <button class="btn" onclick="alert('Welcome to Alizen! Start chatting to build your app.')">Get Started</button>
  </div>
</body>
</html>`;

  return {
    files: [
      { path: 'index.html', content: html, type: 'html', version: 1 },
    ],
    entryFile: 'index.html',
  };
}

/** Determine whether we should proxy through /api/proxy for CORS reasons */
function resolveEndpoint(providerId: string, baseURL: string): {
  url: string;
  headers: Record<string, string>;
  direct: boolean;
} {
  const provider = getProvider(providerId);
  // If provider is known to not support CORS from the browser, proxy
  if (provider && provider.corsFriendly === false) {
    return {
      url: `/api/proxy?target=${encodeURIComponent(baseURL + '/chat/completions')}`,
      headers: {
        'X-Target-URL': baseURL + '/chat/completions',
        'X-Provider': providerId,
      },
      direct: false,
    };
  }
  return {
    url: baseURL.replace(/\/$/, '') + '/chat/completions',
    headers: {},
    direct: true,
  };
}

/** Stream a chat completion. Returns the final assembled content. */
export async function streamChatCompletion(
  opts: LLMCallOptions & { customBaseURL?: string }
): Promise<LLMResult> {
  const provider = getProvider(opts.providerId);
  let baseURL = opts.baseURL ?? provider?.baseURL ?? 'https://api.openai.com/v1';
  if (opts.customBaseURL) baseURL = opts.customBaseURL;
  const model = opts.model ?? provider?.defaultModel ?? 'gpt-4o-mini';

  if (!opts.apiKey) {
    throw new Error('No API key provided. Add your key in Settings (top-right gear icon).');
  }

  const endpoint = resolveEndpoint(opts.providerId, baseURL);
  const payloadMessages = buildRequestMessages(opts.messages, opts.files ?? []);

  const body = {
    model,
    messages: payloadMessages,
    stream: true,
    temperature: opts.temperature ?? 0.7,
    max_tokens: 8192,
  };

  const res = await fetch(endpoint.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.apiKey}`,
      ...endpoint.headers,
      // OpenRouter likes to see a referrer for app identification
      ...(opts.providerId === 'openrouter' || opts.providerId === 'anthropic' || opts.providerId === 'google'
        ? { 'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '', 'X-Title': 'Alizen' }
        : {}),
    },
    body: JSON.stringify(body),
    signal: opts.signal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${errText.slice(0, 500)}`);
  }

  if (!res.body) {
    throw new Error('Response has no body (stream not supported).');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE parsing: split on double-newline, process lines starting with "data: "
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';

    for (const part of parts) {
      const lines = part.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') continue;
        try {
          const json = JSON.parse(data);
          const delta =
            json.choices?.[0]?.delta?.content ??
            json.choices?.[0]?.message?.content ??
            '';
          if (delta) {
            fullContent += delta;
            opts.onDelta?.(delta);
          }
        } catch {
          // skip malformed chunks
        }
      }
    }
  }

  return { content: fullContent, fullRaw: null };
}
