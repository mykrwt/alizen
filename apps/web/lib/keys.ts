import type { Provider } from "./types";

const KEYS_STORAGE = "alize.keys.v1";
const GITHUB_STORAGE = "alize.githubToken.v1";

/** Per-provider AI keys in localStorage (per Decisions Log). */
export function getKeys(): Partial<Record<Provider, string>> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEYS_STORAGE) ?? "{}") as Partial<
      Record<Provider, string>
    >;
  } catch {
    return {};
  }
}

export function setKeys(keys: Partial<Record<Provider, string>>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS_STORAGE, JSON.stringify(keys));
}

export function getKey(provider: Provider): string | undefined {
  return getKeys()[provider];
}

export function getGithubToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(GITHUB_STORAGE) ?? "";
}

export function setGithubToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GITHUB_STORAGE, token.trim());
}
