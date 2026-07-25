import Dexie, { type Table } from "dexie";
import type { Project, Settings } from "./types";

/**
 * Local-first store. IndexedDB via Dexie. Browser-only — see getDB() guard.
 * This is the durable home for projects/chats/files; GitHub is the optional "cloud".
 */
class AlizeDB extends Dexie {
  projects!: Table<Project, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super("alize");
    this.version(1).stores({
      projects: "id, title, updatedAt",
      settings: "id",
    });
  }
}

let _db: AlizeDB | null = null;

/** Lazily create the DB on the client only (Dexie touches indexedDB). */
export function getDB(): AlizeDB {
  if (typeof window === "undefined") {
    throw new Error("AlizeDB is browser-only; called during SSR.");
  }
  if (!_db) _db = new AlizeDB();
  return _db;
}

export async function listProjects(): Promise<Project[]> {
  return getDB().projects.orderBy("updatedAt").reverse().toArray();
}
export async function getProject(id: string): Promise<Project | undefined> {
  return getDB().projects.get(id);
}
export async function saveProject(project: Project): Promise<void> {
  project.updatedAt = Date.now();
  await getDB().projects.put(project);
}
export async function deleteProject(id: string): Promise<void> {
  await getDB().projects.delete(id);
}
export async function getSettings(): Promise<Settings | undefined> {
  return getDB().settings.get("global");
}
export async function saveSettings(settings: Settings): Promise<void> {
  await getDB().settings.put(settings);
}
