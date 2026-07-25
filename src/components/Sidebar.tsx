'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Trash2,
  MessageSquare,
  Github,
  Download,
  Settings as SettingsIcon,
  RefreshCw,
  FolderClosed,
  Sparkles,
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
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const handleExport = async () => {
    if (!active) return;
    const blob = await exportProjectAsZip(active.name, active.files);
    triggerDownload(blob, `${slugify(active.name)}.zip`);
  };

  return (
    <aside className="w-60 flex-shrink-0 h-full bg-alizen-panel flex flex-col">
      {/* Brand */}
      <div className="h-11 px-3 flex items-center gap-2 border-b border-alizen-border">
        <div className="w-5 h-5 rounded bg-gradient-to-br from-alizen-accent to-[#818cf8] flex items-center justify-center">
          <Sparkles size={10} className="text-white" />
        </div>
        <span className="text-[13px] font-semibold tracking-tight">Alizen</span>
      </div>

      {/* New project */}
      <div className="px-2 pt-2.5 pb-1">
        <button
          onClick={() => newProject()}
          className="w-full btn-outline text-xs h-8 justify-start px-2.5"
        >
          <Plus size={14} strokeWidth={1.5} />
          <span>New Project</span>
        </button>
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-y-auto px-1.5 pt-2">
        <div className="flex items-center gap-1.5 px-2 py-1 text-2xs uppercase tracking-wider text-alizen-muted/70 font-medium">
          <FolderClosed size={11} strokeWidth={1.5} />
          Projects
        </div>
        <ul className="mt-0.5 space-y-px">
          {projects.map((p) => {
            const isActive = p.id === activeId;
            return (
              <li key={p.id}>
                {renamingId === p.id ? (
                  <input
                    ref={renameInputRef}
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
                    className="w-full bg-alizen-surface border border-alizen-accent/30 rounded-md px-2 py-1 text-xs outline-none focus:border-alizen-accent/50 transition-colors"
                  />
                ) : (
                  <div
                    onClick={() => openProject(p.id)}
                    onDoubleClick={() => {
                      setRenamingId(p.id);
                      setRenameValue(p.name);
                    }}
                    className={cn(
                      'group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-[13px] transition-all duration-100',
                      isActive
                        ? 'bg-white/[0.06] text-alizen-text'
                        : 'text-alizen-muted hover:bg-white/[0.04] hover:text-alizen-subtle'
                    )}
                  >
                    <MessageSquare
                      size={13}
                      strokeWidth={1.5}
                      className={cn(
                        'flex-shrink-0 transition-colors',
                        isActive ? 'text-alizen-accent' : 'text-alizen-muted/50'
                      )}
                    />
                    <span className="flex-1 truncate font-medium">{p.name}</span>
                    <span className="text-2xs text-alizen-muted/50 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                      {timeAgo(p.updatedAt)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${p.name}"?`)) deleteProject(p.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-alizen-muted/40 hover:text-red-400 transition-all duration-100"
                      title="Delete project"
                    >
                      <Trash2 size={12} strokeWidth={1.5} />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Bottom actions */}
      <div className="border-t border-alizen-border px-1.5 py-1.5 space-y-px">
        <SidebarAction onClick={handleExport} disabled={!active} icon={<Download size={14} strokeWidth={1.5} />}>
          Download ZIP
        </SidebarAction>
        <SidebarAction onClick={onOpenSettings} icon={<SettingsIcon size={14} strokeWidth={1.5} />}>
          Settings
        </SidebarAction>
        <SidebarAction
          as="a"
          href="https://github.com/mykrwt/alizen"
          icon={<Github size={14} strokeWidth={1.5} />}
        >
          GitHub
        </SidebarAction>
        <SidebarAction
          onClick={() => {
            if (confirm('Reset all data? This will erase your local projects.')) {
              useAppStore.getState().resetAll();
            }
          }}
          icon={<RefreshCw size={12} strokeWidth={1.5} />}
          variant="danger"
        >
          Reset all data
        </SidebarAction>
        <div className="px-2.5 py-2 text-2xs text-alizen-muted/50 leading-relaxed">
          Data stays in your browser.
        </div>
      </div>
    </aside>
  );
}

function SidebarAction({
  children,
  icon,
  onClick,
  disabled,
  variant = 'default',
  as,
  href,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'danger';
  as?: 'a';
  href?: string;
}) {
  const cls = cn(
    'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] transition-all duration-100',
    variant === 'danger'
      ? 'text-alizen-muted/60 hover:text-red-400 hover:bg-red-500/[0.06]'
      : 'text-alizen-muted hover:bg-white/[0.04] hover:text-alizen-subtle',
    disabled && 'opacity-30 pointer-events-none'
  );

  if (as === 'a') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className={cls}
      >
        {icon}
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled} className={cls}>
      {icon}
      {children}
    </button>
  );
}
