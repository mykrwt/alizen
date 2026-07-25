"use client";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { MODELS, PROVIDERS, modelsForProvider } from "@/lib/ai/models";
import { getDB } from "@/lib/db";
import { getGithubToken, getKeys, setGithubToken, setKeys } from "@/lib/keys";
import type { Provider } from "@/lib/types";
import { ArrowLeft, Check, ExternalLink, KeyRound, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const DEFAULTS_KEY = "alize.defaults.v1";

interface Defaults {
  provider: Provider;
  modelId: string;
}

function loadDefaults(): Defaults {
  try {
    const raw = localStorage.getItem(DEFAULTS_KEY);
    if (raw) return JSON.parse(raw) as Defaults;
  } catch {
    /* noop */
  }
  return { provider: "openai", modelId: "gpt-4.1" };
}

export default function SettingsPage() {
  const [keys, setLocalKeys] = useState<Partial<Record<Provider, string>>>({});
  const [githubToken, setLocalGithub] = useState("");
  const [provider, setProvider] = useState<Provider>("openai");
  const [modelId, setModelId] = useState("gpt-4.1");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocalKeys(getKeys());
    setLocalGithub(getGithubToken());
    const d = loadDefaults();
    setProvider(d.provider);
    setModelId(d.modelId);
  }, []);

  function persist() {
    setKeys(keys);
    setGithubToken(githubToken);
    localStorage.setItem(DEFAULTS_KEY, JSON.stringify({ provider, modelId } satisfies Defaults));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function clearAll() {
    if (!confirm("Clear all keys, tokens, and local projects? This cannot be undone.")) return;
    localStorage.removeItem("alize.keys.v1");
    localStorage.removeItem("alize.githubToken.v1");
    localStorage.removeItem("alize.defaults.v1");
    try {
      await getDB().delete();
    } catch {
      /* noop */
    }
    setLocalKeys({});
    setLocalGithub("");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container max-w-3xl flex-1 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link href="/builder">
            <ArrowLeft className="h-4 w-4" /> Back to builder
          </Link>
        </Button>

        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything here is stored only in <strong>your browser</strong> (localStorage). It never
          leaves your device except to the provider you choose.
        </p>

        {/* Provider keys */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              <CardTitle>AI provider keys</CardTitle>
            </div>
            <CardDescription>Bring your own key. Add the ones you want to use.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {PROVIDERS.map((p) => (
              <div key={p.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor={`key-${p.id}`} className="text-sm font-medium">
                    {p.label}
                  </label>
                  <a
                    href={p.docs}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Get key <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <Input
                  id={`key-${p.id}`}
                  type="password"
                  autoComplete="off"
                  placeholder={p.placeholder}
                  value={keys[p.id] ?? ""}
                  onChange={(e) => setLocalKeys((prev) => ({ ...prev, [p.id]: e.target.value }))}
                />
                {!p.browserDirect && (
                  <p className="text-xs text-amber-500">
                    Direct browser calls are blocked for {p.label}. Use the /api/proxy route or
                    reach it via OpenRouter.
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* GitHub token */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>GitHub token</CardTitle>
            <CardDescription>
              A personal access token (scope: <code>repo</code>) to push generated apps to your
              GitHub.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              type="password"
              autoComplete="off"
              placeholder="ghp_... / github_pat_..."
              value={githubToken}
              onChange={(e) => setLocalGithub(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Defaults */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Defaults</CardTitle>
            <CardDescription>
              Provider and model used for new projects (you can change per project).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="def-provider" className="text-sm font-medium">
                Provider
              </label>
              <Select
                id="def-provider"
                value={provider}
                onChange={(e) => {
                  const next = e.target.value as Provider;
                  setProvider(next);
                  setModelId((modelsForProvider(next)[0] ?? MODELS[0]!).id);
                }}
              >
                {PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="def-model" className="text-sm font-medium">
                Model
              </label>
              <Select id="def-model" value={modelId} onChange={(e) => setModelId(e.target.value)}>
                {modelsForProvider(provider).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 flex items-center gap-3">
          <Button onClick={persist}>{saved ? <Check className="h-4 w-4" /> : null} Save</Button>
          <Button variant="outline" onClick={clearAll}>
            <Trash2 className="h-4 w-4" /> Clear all local data
          </Button>
        </div>
      </main>
    </div>
  );
}
