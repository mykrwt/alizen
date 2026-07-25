import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind-aware classname combiner */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Generate a short ID */
export function uid(prefix = ''): string {
  return (
    prefix +
    Math.random().toString(36).slice(2, 9) +
    Date.now().toString(36).slice(-4)
  );
}

/** Safe filename from a project name */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'alizen-app';
}

/** Very small HTML-to-plain-text escape */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Format a date relative to now */
export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

/** Simple markdown-lite to HTML renderer for assistant messages (bold, code, lists) */
export function renderMarkdownLite(md: string): string {
  let html = md;
  // Escape HTML first
  html = escapeHtml(html);
  // Code blocks ```lang\n...\n```
  html = html.replace(/```([a-zA-Z0-9]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code class="language-${lang}">${code}</code></pre>`;
  });
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Bold **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italic *text*
  html = html.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  // Links
  html = html.replace(
    /\[([^\]]+)\]\((https?:[^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer noopener">$1</a>'
  );
  // Unordered lists
  html = html.replace(/(^|\n)([-*] .+(\n|$))+/g, (match) => {
    const items = match
      .trim()
      .split('\n')
      .map((l) => `<li>${l.replace(/^[-*]\s+/, '')}</li>`)
      .join('');
    return `\n<ul>${items}</ul>\n`;
  });
  // Numbered lists
  html = html.replace(/(^|\n)(\d+\. .+(\n|$))+/g, (match) => {
    const items = match
      .trim()
      .split('\n')
      .map((l) => `<li>${l.replace(/^\d+\.\s+/, '')}</li>`)
      .join('');
    return `\n<ol>${items}</ol>\n`;
  });
  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  // Paragraphs — wrap double-newline delimited blocks
  const blocks = html.split(/\n{2,}/);
  html = blocks
    .map((b) => {
      if (b.startsWith('<pre') || b.startsWith('<ul') || b.startsWith('<ol') || b.startsWith('<h')) {
        return b;
      }
      return `<p>${b.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('\n');
  return html;
}
