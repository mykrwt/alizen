import type { FileNode } from "@/lib/types";

/**
 * The seed project the WebContainer boots with (React + Vite + TS).
 * The AI then mutates these files via the write_file tool.
 */
export function viteTemplate(): FileNode[] {
  return [
    {
      path: "package.json",
      content: JSON.stringify(
        {
          name: "generated-app",
          private: true,
          version: "0.0.0",
          type: "module",
          scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
          dependencies: { react: "^18.3.1", "react-dom": "^18.3.1" },
          devDependencies: {
            "@vitejs/plugin-react": "^4.3.4",
            "@types/react": "^18.3.0",
            "@types/react-dom": "^18.3.0",
            typescript: "^5.6.0",
            vite: "^5.4.0",
          },
        },
        null,
        2,
      ),
    },
    {
      path: "vite.config.ts",
      content: `import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\n\nexport default defineConfig({\n  plugins: [react()],\n  server: { host: true },\n});\n`,
    },
    {
      path: "index.html",
      content: `<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>App</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>\n`,
    },
    {
      path: "tsconfig.json",
      content: `{\n  "compilerOptions": {\n    "target": "ES2020",\n    "module": "ESNext",\n    "moduleResolution": "Bundler",\n    "jsx": "react-jsx",\n    "strict": true\n  },\n  "include": ["src"]\n}\n`,
    },
    {
      path: "src/main.tsx",
      content: `import React from "react";\nimport ReactDOM from "react-dom/client";\nimport App from "./App";\n\nReactDOM.createRoot(document.getElementById("root")!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);\n`,
    },
    {
      path: "src/App.tsx",
      content: `export default function App() {\n  return (\n    <div style={{ fontFamily: "system-ui", padding: "2rem", color: "#0f172a" }}>\n      <h1>Hello from Alize 👋</h1>\n      <p>Describe what you want to build, and I'll make it real.</p>\n    </div>\n  );\n}\n`,
    },
  ];
}
