import type { NextConfig } from "next";

/**
 * COOP/COEP cross-origin isolation is REQUIRED for WebContainers (@webcontainer/api)
 * to run the generated Vite app live in the browser. These headers enable
 * `self.crossOriginIsolated === true`.
 * `credentialless` (vs `require-corp`) keeps third-party resources (fonts, etc.) loadable.
 * Prod headers are mirrored in /vercel.json.
 */
const securityHeaders = [
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
];

const config: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default config;
