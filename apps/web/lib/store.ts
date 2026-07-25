import { create } from "zustand";

export type ContainerStatus = "idle" | "booting" | "running" | "error";

interface BuilderState {
  activeProjectId: string | null;
  isStreaming: boolean;
  previewUrl: string | null;
  containerStatus: ContainerStatus;
  setActiveProject: (id: string | null) => void;
  setStreaming: (v: boolean) => void;
  setPreviewUrl: (u: string | null) => void;
  setContainerStatus: (s: ContainerStatus) => void;
}

/** Ephemeral UI / build-session state. Persisted entities live in Dexie (db.ts). */
export const useBuilder = create<BuilderState>((set) => ({
  activeProjectId: null,
  isStreaming: false,
  previewUrl: null,
  containerStatus: "idle",
  setActiveProject: (id) => set({ activeProjectId: id }),
  setStreaming: (v) => set({ isStreaming: v }),
  setPreviewUrl: (u) => set({ previewUrl: u }),
  setContainerStatus: (s) => set({ containerStatus: s }),
}));
