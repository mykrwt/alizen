import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Github, KeyRound, Laptop, Play, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";

const FEATURES = [
  {
    icon: KeyRound,
    title: "Bring your own key",
    body: "Plug in your OpenAI, Anthropic, Gemini, Groq, OpenRouter, or local Ollama key. You pay your provider — we run nothing in the middle.",
  },
  {
    icon: Play,
    title: "Live preview",
    body: "Watch your app run instantly in a real in-browser runtime (WebContainers). Vite + React, hot-reloading as the AI writes code.",
  },
  {
    icon: ShieldCheck,
    title: "Local-first, no shutdown",
    body: "Projects, chats, and files live in your browser. No account, no managed backend that can disappear. GitHub is the optional cloud.",
  },
  {
    icon: Github,
    title: "Ship to GitHub",
    body: "One click pushes a new repo with your generated app, or download a ZIP. You own every line.",
  },
  {
    icon: Zap,
    title: "Agentic builds",
    body: "The AI writes files, runs the build, reads errors, and self-fixes — across as many turns as it takes.",
  },
  {
    icon: Laptop,
    title: "Frontend-only on Vercel",
    body: "The whole builder is a Next.js app. Free to host, nothing to operate.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="container flex flex-col items-center gap-6 py-24 text-center md:py-32">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Free · Open · BYOK · No login
          </div>
          <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            Describe it. <span className="text-primary">Ship it.</span>
          </h1>
          <p className="max-w-xl text-balance text-lg text-muted-foreground">
            Alize builds a real React app from a chat — live in your browser, on your own AI key.
            Refine by talking, then download the code or push to GitHub.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/builder">
                Start building <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/settings">Add your API key</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            No signup. Your keys never leave your browser.
          </p>
        </section>

        {/* Features */}
        <section className="container pb-24">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Card key={f.title} className="animate-fade-in">
                <CardHeader>
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{f.title}</CardTitle>
                  <CardDescription>{f.body}</CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8">
        <div className="container flex flex-col items-center justify-between gap-2 text-sm text-muted-foreground sm:flex-row">
          <span>Alize — a free AI app builder.</span>
          <span>Local-first. BYOK. Built for makers.</span>
        </div>
      </footer>
    </div>
  );
}
