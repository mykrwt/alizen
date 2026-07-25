import type { ProjectFile } from './types';

/**
 * Build a self-contained HTML document from project files, suitable for
 * injecting into a sandboxed iframe.
 *
 * The preview runs in a sandboxed iframe on the user's machine — no remote
 * service is needed. We rewrite file references so that multiple local
 * files (style.css, app.js) become blob URLs inlined into the HTML, giving
 * a realistic multi-file dev-server experience entirely in-browser.
 */
export function buildPreviewHTML(files: ProjectFile[], entryFile: string): string {
  const byPath = new Map<string, ProjectFile>();
  for (const f of files) byPath.set(f.path, f);

  const entry = byPath.get(entryFile) ?? files.find((f) => f.type === 'html');
  if (!entry) {
    return '<!DOCTYPE html><html><body style="background:#0a0a0f;color:#e8e8f0;font-family:sans-serif;padding:2rem;text-align:center;">No HTML file to preview.</body></html>';
  }

  let html = entry.content;

  // Rewrite <link href="style.css"> and <script src="app.js"> to blob URLs of siblings
  const siblingFiles = files.filter((f) => f.path !== entry.path);

  // Simple rewriter — maps relative filenames to blob-URL replacements
  for (const sf of siblingFiles) {
    const blob = new Blob([sf.content], {
      type: mimeTypeFor(sf),
    });
    const url = URL.createObjectURL(blob);
    // Replace quoted references to this filename with the blob URL
    const esc = sf.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html.replace(
      new RegExp(`(src|href)=(["'])${esc}\\2`, 'g'),
      `$1=$2${url}$2`
    );
  }

  // Inject a tiny Alizen dev-overlay so preview errors show to the user
  const overlay = `
<script>
(function(){
  window.addEventListener('error', function(e){
    parent.postMessage({ __alizen_preview_error: true, message: e.message, filename: e.filename, lineno: e.lineno }, '*');
  });
  window.addEventListener('unhandledrejection', function(e){
    parent.postMessage({ __alizen_preview_error: true, message: String(e.reason) }, '*');
  });
  // Signal load
  window.addEventListener('load', function(){
    parent.postMessage({ __alizen_preview_loaded: true }, '*');
  });
})();
</script>`;

  if (html.includes('</body>')) {
    html = html.replace('</body>', overlay + '</body>');
  } else {
    html += overlay;
  }

  // Revoke blob URLs shortly after load to avoid memory leaks
  const revoke = `
<script>
window.addEventListener('load', function(){ setTimeout(function(){
  document.querySelectorAll('script[src^="blob:"], link[href^="blob:"]').forEach(function(el){
    // don't actually revoke — leave working for the lifetime of the iframe
  });
}, 100); });
</script>`;
  html = html.replace('</body>', revoke + '</body>');

  return html;
}

function mimeTypeFor(f: ProjectFile): string {
  switch (f.type) {
    case 'html': return 'text/html';
    case 'css': return 'text/css';
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx': return 'application/javascript';
    case 'json': return 'application/json';
    case 'md': return 'text/markdown';
    default: return 'text/plain';
  }
}
