"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Github, Sparkles } from "lucide-react";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          Alize
        </Link>
        <nav className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm">
            <Link href="/settings">Settings</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/builder">Builder</Link>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="GitHub">
            <a href="https://github.com/mykrwt/alizen" target="_blank" rel="noreferrer">
              <Github className="h-4 w-4" />
            </a>
          </Button>
          <ThemeToggle />
          <Button asChild size="sm" className="ml-1">
            <Link href="/builder">Start building</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
