/**
 * Safe browser storage wrappers. All Alizen state lives in the user's
 * browser (localStorage for small JSON, IndexedDB can be added later
 * for larger blobs). Nothing is sent to a server unless the user
 * explicitly exports.
 */

const PREFIX = 'alizen:';

export function storageGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function storageSet<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Quota exceeded or disabled — silently fall back; user loses persistence
    // but the app continues to work in-memory for the session.
  }
}

export function storageDelete(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

/** Project list is stored in localStorage; individual projects in separate keys */
const PROJECTS_INDEX_KEY = 'projects-index';

export function loadProjectIds(): string[] {
  return storageGet<string[]>(PROJECTS_INDEX_KEY, []);
}

export function saveProjectIds(ids: string[]): void {
  storageSet(PROJECTS_INDEX_KEY, ids);
}
