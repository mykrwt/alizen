'use client';

import { useState } from 'react';
import {
  Plus,
  Trash2,
  MessageSquare,
  FolderKanban,
  Sparkles,
  Github,
  Download,
  Settings as SettingsIcon,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { timeAgo, cn } from '@/lib/utils';
import { exportProjectAsZip, triggerDownload } from '@/lib/exporter';
import { slugify } from '@/lib/utils';

interface SidebarProps {
  onOpenSettings: () => void;
}

export function Sidebar({ onOpenSettings }: SidebarProps) {
  const projects = useAppStore((s) => s.projects);
  const activeId = useAppStore((s) => s.activeProjectId);
  const newProject = useAppStore((s) => s.newProject);
  const openProject = useAppStore((s) => s.openProject);
  const deleteProject = useAppStore((s) => s.deleteProject);
  const renameProject = useAppStore((s) => s.renameProject);
  const active = projects.find((p) => p.id === activeId) ?? null;
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleExport = async () => {
    if (!active) return;
    const blob = await exportProjectAsZip(active.name, active.files);
    triggerDownload(blob, `${slugify(active.name)}.zip`);
  };

  return (
    <aside className="w-64 flex-shrink-0 h-full bg-alizen-panel border-r border-alizen-border flex flex-col">
      {/* Brand */}
      <div className="h-14 px-4 flex items-center gap-2 border-b border-alizen-border">
        <div className="w-7 h-7 rounded-md bg-gradient-to-br from-alizen-accent to-alizen-accent2 flex items-center justify-center shadow-glow">
          <Sparkles size={16} className="text-white" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold tracking-tight">Alizen</div>
          <div className="text-[10px] text-alizen-muted -mt-0.5">
            Build apps with AI · free forever
          </div>
        </div>
      </div>

      {/* New project */}
      <div className="p-3">
        <button
          onClick={() => newProject()}
          className="w-full btn-primary text-xs h-9"
        >
          <Plus size={15} /> New Project
        </button>
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-y-auto px-2">
        <div className="flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-wider text-alizen-muted font-semibold">
          <FolderKanban size={11} /> Projects
        </div>
        <ul className="space-y-0.5 mt-1">
          {projects.map((p) => {
            const isActive = p.id === activeId;
            return (
              <li key={p.id}>
                {renamingId === p.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => {
                      if (renameValue.trim()) renameProject(p.id, renameValue.trim());
                      setRenamingId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (renameValue.trim()) renameProject(p.id, renameValue.trim());
                        setRenamingId(null);
                      }
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                    className="w-full bg-alizen-surface border border-alizen-accent rounded px-2 py-1 text-xs"
                  />
                ) : (
                  <div
                    onClick={() => openProject(p.id)}
                    onDoubleClick={() => {
                      setRenamingId(p.id);
                      setRenameValue(p.name);
                    }}
                    className={cn(
                      'group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-xs transition-colors',
                      isActive
                        ? 'bg-alizen-surface text-alizen-text border-l-2 border-alizen-accent'
                        : 'text-alizen-subtle hover:bg-alizen-surface/60'
                    )}
                  >
                    <MessageSquare size={13} className="flex-shrink-0 opacity-70" />
                    <span className="flex-1 truncate">{p.name}</span>
                    <span className="text-[10px] text-alizen-muted opacity-0 group-hover:opacity-100 transition-opacity">
                      {timeAgo(p.updatedAt)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete project "${p.name}"?`)) deleteProject(p.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-alizen-muted hover:text-alizen-error transition-all"
                      title="Delete project"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Bottom actions */}
      <div className="border-t border-alizen-border p-2 space-y-1">
        <button
          onClick={handleExport}
          disabled={!active}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-alizen-subtle hover:bg-alizen-surface hover:text-alizen-text transition-colors disabled:opacity-50"
        >
          <Download size={14} /> Download ZIP
        </button>
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-alizen-subtle hover:bg-alizen-surface hover:text-alizen-text transition-colors"
        >
          <SettingsIcon size={14} /> Settings
        </button>
        <a
          href="https://github.com/mykrwt/alizen"
          target="_blank"
          rel="noreferrer noopener"
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-alizen-subtle hover:bg-alizen-surface hover:text-alizen-text transition-colors"
        >
          <Github size={14} /> Source on GitHub
        </a>
        <button
          onClick={() => {
            if (confirm('Reset all data? This will erase your local projects.')) {
              useAppStore.getState().resetAll();
            }
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-alizen-muted hover:text-alizen-error hover:bg-alizen-error/10 transition-colors"
        >
          <RefreshCw size={12} /> Reset all data
        </button>
        <div className="px-3 py-2 text-[10px] text-alizen-muted leading-relaxed">
          Your data stays in your browser. API keys are never sent to our servers.
        </div>
      </div>
    </aside>
  );
}
