'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Project, ChatMessage, ProjectFile, UserSettings } from './lib/types';
import { uid } from './lib/utils';
import { classifyFile, createStarterProject, parseFileBlocks } from './lib/llm';

interface AppState {
  // Projects
  projects: Project[];
  activeProjectId: string | null;
  // Currently open file path in the editor
  activeFilePath: string;
  // UI: which panel to show on mobile: 'chat' | 'code' | 'preview'
  mobileView: 'chat' | 'code' | 'preview';
  // User settings
  settings: UserSettings;
  // Streaming state
  isStreaming: boolean;
  streamingContent: string;

  // Actions
  newProject: (name?: string) => Project;
  openProject: (id: string) => void;
  deleteProject: (id: string) => void;
  renameProject: (id: string, name: string) => void;
  setActiveFile: (path: string) => void;
  createFile: (path: string, content?: string) => void;
  deleteFile: (path: string) => void;
  updateFile: (path: string, content: string) => void;
  setMobileView: (v: 'chat' | 'code' | 'preview') => void;
  updateSettings: (patch: Partial<UserSettings>) => void;
  addMessage: (msg: ChatMessage) => void;
  /** Apply assistant response: parse file blocks & update files */
  applyAssistantResponse: (content: string) => { fileCount: number };
  setStreaming: (is: boolean, content?: string) => void;
  appendStreaming: (delta: string) => void;
  resetAll: () => void;
}

function createDefaultProject(): Project {
  const starter = createStarterProject();
  return {
    id: uid('p_'),
    name: 'New Project',
    description: 'Start building your app with AI',
    files: starter.files,
    messages: [],
    entryFile: starter.entryFile,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function initialState(): { projects: Project[]; activeProjectId: string; activeFilePath: string } {
  const project = createDefaultProject();
  return {
    projects: [project],
    activeProjectId: project.id,
    activeFilePath: project.entryFile,
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState(),
      mobileView: 'chat',
      settings: {
        providerId: 'openrouter',
        apiKeys: {},
        selectedModels: {},
        theme: 'dark',
        verbose: true,
      },
      isStreaming: false,
      streamingContent: '',

      newProject: (name) => {
        const starter = createStarterProject();
        const p: Project = {
          id: uid('p_'),
          name: name ?? `Project ${get().projects.length + 1}`,
          description: '',
          files: starter.files,
          messages: [],
          entryFile: starter.entryFile,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((s) => ({
          projects: [p, ...s.projects],
          activeProjectId: p.id,
          activeFilePath: p.entryFile,
        }));
        return p;
      },

      openProject: (id) => {
        const p = get().projects.find((x) => x.id === id);
        if (!p) return;
        set({
          activeProjectId: id,
          activeFilePath: p.files[0]?.path ?? 'index.html',
          mobileView: 'chat',
        });
      },

      deleteProject: (id) => {
        set((s) => {
          const remaining = s.projects.filter((p) => p.id !== id);
          const fallback = remaining[0]?.id ?? null;
          let activeId = s.activeProjectId;
          let activePath = s.activeFilePath;
          if (activeId === id) {
            if (fallback) {
              const next = remaining[0];
              activeId = next.id;
              activePath = next.files[0]?.path ?? 'index.html';
            } else {
              // create a new starter
              const np = createDefaultProject();
              return {
                projects: [np],
                activeProjectId: np.id,
                activeFilePath: np.entryFile,
              };
            }
          }
          return { projects: remaining, activeProjectId: activeId, activeFilePath: activePath };
        });
      },

      renameProject: (id, name) => {
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, name, updatedAt: Date.now() } : p
          ),
        }));
      },

      setActiveFile: (path) => set({ activeFilePath: path }),

      createFile: (path, content = '') => {
        set((s) => {
          const proj = s.projects.find((p) => p.id === s.activeProjectId);
          if (!proj) return {};
          if (proj.files.some((f) => f.path === path)) return { activeFilePath: path };
          const newFile: ProjectFile = {
            path,
            content,
            type: classifyFile(path),
            version: 1,
          };
          return {
            projects: s.projects.map((p) =>
              p.id === proj.id
                ? { ...p, files: [...p.files, newFile], updatedAt: Date.now() }
                : p
            ),
            activeFilePath: path,
          };
        });
      },

      deleteFile: (path) => {
        set((s) => {
          const proj = s.projects.find((p) => p.id === s.activeProjectId);
          if (!proj || proj.files.length <= 1) return {}; // always keep at least one
          const newFiles = proj.files.filter((f) => f.path !== path);
          const newActive =
            s.activeFilePath === path ? newFiles[0].path : s.activeFilePath;
          return {
            projects: s.projects.map((p) =>
              p.id === proj.id
                ? { ...p, files: newFiles, updatedAt: Date.now() }
                : p
            ),
            activeFilePath: newActive,
          };
        });
      },

      updateFile: (path, content) => {
        set((s) => {
          const proj = s.projects.find((p) => p.id === s.activeProjectId);
          if (!proj) return {};
          const file = proj.files.find((f) => f.path === path);
          if (!file) return {};
          // Skip if content identical — avoids unnecessary re-renders / persistence
          if (file.content === content) return {};
          return {
            projects: s.projects.map((p) =>
              p.id === proj.id
                ? {
                    ...p,
                    files: p.files.map((f) =>
                      f.path === path
                        ? { ...f, content, version: f.version + 1 }
                        : f
                    ),
                    updatedAt: Date.now(),
                  }
                : p
            ),
          };
        });
      },

      setMobileView: (v) => set({ mobileView: v }),

      updateSettings: (patch) => {
        set((s) => ({ settings: { ...s.settings, ...patch } }));
      },

      addMessage: (msg) => {
        set((s) => {
          const proj = s.projects.find((p) => p.id === s.activeProjectId);
          if (!proj) return {};
          return {
            projects: s.projects.map((p) =>
              p.id === proj.id
                ? { ...p, messages: [...p.messages, msg], updatedAt: Date.now() }
                : p
            ),
          };
        });
      },

      applyAssistantResponse: (content) => {
        const { reply, files } = parseFileBlocks(content);
        set((s) => {
          const proj = s.projects.find((p) => p.id === s.activeProjectId);
          if (!proj) return {};
          let newFiles = [...proj.files];
          for (const parsed of files) {
            const existingIdx = newFiles.findIndex((f) => f.path === parsed.path);
            if (existingIdx >= 0) {
              newFiles[existingIdx] = {
                ...newFiles[existingIdx],
                content: parsed.content,
                version: newFiles[existingIdx].version + 1,
              };
            } else {
              newFiles.push({
                path: parsed.path,
                content: parsed.content,
                type: classifyFile(parsed.path),
                version: 1,
              });
            }
          }
          const finalReply = reply || (files.length ? `Updated ${files.length} file(s).` : '');
          const assistantMsg: ChatMessage = {
            id: uid('m_'),
            role: 'assistant',
            content: finalReply,
            createdAt: Date.now(),
            fileVersions: Object.fromEntries(
              newFiles.map((f) => [f.path, f.version])
            ),
          };
          // If we updated index.html (or any new html file became the entry), prefer it
          let entryFile = proj.entryFile;
          if (files.some((f) => f.path === 'index.html')) entryFile = 'index.html';
          // Auto-switch to the newest/updated html file if we have one
          const activeFilePath =
            files.find((f) => f.path.endsWith('.html'))?.path ?? s.activeFilePath;
          return {
            projects: s.projects.map((p) =>
              p.id === proj.id
                ? {
                    ...p,
                    files: newFiles,
                    messages: [...p.messages, assistantMsg],
                    entryFile,
                    updatedAt: Date.now(),
                  }
                : p
            ),
            activeFilePath,
            streamingContent: '',
            isStreaming: false,
          };
        });
        return { fileCount: files.length };
      },

      setStreaming: (is, content = '') =>
        set({ isStreaming: is, streamingContent: content }),
      appendStreaming: (delta) =>
        set((s) => ({ streamingContent: s.streamingContent + delta })),

      resetAll: () => {
        const fresh = initialState();
        set({ ...fresh, mobileView: 'chat', isStreaming: false, streamingContent: '' });
      },
    }),
    {
      name: 'alizen-state',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({
        projects: state.projects,
        activeProjectId: state.activeProjectId,
        activeFilePath: state.activeFilePath,
        settings: state.settings,
      }),
    }
  )
);

/** Selector for the active project */
export function useActiveProject(): Project | null {
  const { projects, activeProjectId } = useAppStore();
  return projects.find((p) => p.id === activeProjectId) ?? null;
}
