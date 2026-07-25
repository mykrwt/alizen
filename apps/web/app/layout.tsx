import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: { default: "Alize — Describe it. Ship it.", template: "%s · Alize" },
  description:
    "A free, in-browser AI app builder. Bring your own key. No login. Build a real React + Vite app from a chat, preview it live, and push to GitHub.",
  applicationName: "Alize",
  authors: [{ name: "Alize" }],
  keywords: [
    "AI app builder",
    "no-code",
    "React",
    "Vite",
    "BYOK",
    "bolt.new alternative",
    "lovable alternative",
  ],
  openGraph: {
    title: "Alize — Describe it. Ship it.",
    description: "A free, in-browser AI app builder. BYOK. No login. No shutdown.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
