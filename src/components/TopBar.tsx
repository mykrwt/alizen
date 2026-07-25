'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Download,
  Github,
  Pencil,
  Check,
  ChevronDown,
} from 'lucide-react';
import { useAppStore, useActiveProject } from '@/store';
import { exportProjectAsZip, triggerDownload } from '@/lib/exporter';
import { slugify } from '@/lib/utils';

interface Props {
  onOpenSettings: () => void;
}

export function TopBar({ onOpenSettings }: Props) {
  const project = useActiveProject();
  const renameProject = useAppStore((s) => s.renameProject);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project?.name ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  async function exportZip() {
    if (!project) return;
    const blob = await exportProjectAsZip(project.name, project.files);
    triggerDownload(blob, `${slugify(project.name)}.zip`);
  }

  function deployToVercel() {
    window.open('https://vercel.com/new', '_blank');
  }

  if (!project) return null;

  return (
    <header className="h-11 flex-shrink-0 border-b border-alizen-border bg-alizen-panel/80 backdrop-blur-sm flex items-center px-3 gap-2 relative z-20">
      {/* Left: project name */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-1.5">
            <input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {
                if (name.trim()) renameProject(project.id, name.trim());
                setEditing(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (name.trim()) renameProject(project.id, name.trim());
                  setEditing(false);
                }
                if (e.key === 'Escape') {
                  setName(project.name);
                  setEditing(false);
                }
              }}
              className="bg-alizen-surface border border-white/[0.1] rounded-md px-2 py-0.5 text-[13px] font-medium outline-none w-56 focus:border-alizen-accent/50 transition-colors"
            />
          </div>
        ) : (
          <button
            onClick={() => {
              setName(project.name);
              setEditing(true);
            }}
            className="flex items-center gap-1 text-[13px] font-medium text-alizen-dim hover:text-alizen-text transition-colors group"
          >
            <span className="truncate">{project.name}</span>
            <Pencil size={11} className="opacity-0 group-hover:opacity-60 transition-opacity text-alizen-muted" />
          </button>
        )}

        <div className="w-px h-3.5 bg-white/[0.06] hidden sm:block" />

        <span className="text-2xs text-alizen-muted tabular-nums hidden sm:inline">
          {project.files.length} file{project.files.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={exportZip}
          className="btn-ghost h-7 px-2 text-xs hidden sm:inline-flex"
          title="Download as ZIP"
        >
          <Download size={13} />
          <span className="ml-0.5">Export</span>
        </button>

        <button
          onClick={deployToVercel}
          className="btn-primary h-7 px-2.5 text-xs"
          title="Deploy to Vercel"
        >
          <svg width="12" height="12" viewBox="0 0 76 65" fill="currentColor">
            <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
          </svg>
          <span className="ml-0.5">Deploy</span>
        </button>

        <div className="w-px h-3.5 bg-white/[0.06] mx-0.5 hidden sm:block" />

        <button
          onClick={onOpenSettings}
          className="btn-ghost h-7 w-7 p-0"
          title="Settings"
        >
          <SettingsIcon size={14} />
        </button>

        <a
          href="https://github.com/mykrwt/alizen"
          target="_blank"
          rel="noreferrer noopener"
          className="btn-ghost h-7 w-7 p-0 hidden sm:inline-flex"
          title="GitHub"
        >
          <Github size={14} />
        </a>
      </div>
    </header>
  );
}
