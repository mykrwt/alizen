'use client';

import { useState } from 'react';
import {
  Settings as SettingsIcon,
  Download,
  Github,
  ExternalLink,
  Pencil,
  Check,
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
  const [showShare, setShowShare] = useState(false);

  async function exportZip() {
    if (!project) return;
    const blob = await exportProjectAsZip(project.name, project.files);
    triggerDownload(blob, `${slugify(project.name)}.zip`);
  }

  function deployToVercel() {
    // Without a server there's no direct "deploy THIS project" URL, but we
    // can open Vercel's new-project page; the user can drag-and-drop the ZIP.
    window.open('https://vercel.com/new', '_blank');
  }

  if (!project) return null;

  return (
    <header className="h-14 flex-shrink-0 border-b border-alizen-border bg-alizen-panel flex items-center px-4 gap-3 relative z-20">
      {/* Project name */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
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
              className="bg-alizen-surface border border-alizen-accent rounded px-2 py-1 text-sm outline-none w-60"
            />
            <button
              onClick={() => {
                if (name.trim()) renameProject(project.id, name.trim());
                setEditing(false);
              }}
              className="text-alizen-accent hover:text-white"
            >
              <Check size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setName(project.name);
              setEditing(true);
            }}
            className="flex items-center gap-1.5 text-sm font-semibold hover:text-alizen-accent transition-colors group"
          >
            <span className="truncate">{project.name}</span>
            <Pencil size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-alizen-muted" />
          </button>
        )}
        <span className="text-xs text-alizen-muted">·</span>
        <span className="text-xs text-alizen-muted hidden sm:inline">
          {project.files.length} file{project.files.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={exportZip}
            className="btn-ghost text-xs h-9 hidden sm:inline-flex"
            title="Download as ZIP"
          >
            <Download size={14} /> Export
          </button>
        </div>
        <button
          onClick={deployToVercel}
          className="btn-primary text-xs h-9"
          title="Download the ZIP and drop it at vercel.com/new to deploy"
        >
          <svg width="14" height="14" viewBox="0 0 76 65" fill="currentColor">
            <path d="M37.5274 0L75.0548 65H0L37.5274 0Z"/>
          </svg>
          Deploy
        </button>
        <button
          onClick={onOpenSettings}
          className="btn-ghost text-xs h-9 w-9 p-0"
          title="Settings"
        >
          <SettingsIcon size={15} />
        </button>
        <a
          href="https://github.com/mykrwt/alizen"
          target="_blank"
          rel="noreferrer noopener"
          className="btn-ghost text-xs h-9 w-9 p-0 hidden sm:inline-flex"
          title="GitHub"
        >
          <Github size={15} />
        </a>
      </div>

      {showShare && (
        <div className="absolute right-4 top-14 w-72 bg-alizen-panel border border-alizen-border rounded-lg p-3 shadow-2xl">
          <div className="text-xs font-semibold mb-2">Deploy / Share</div>
          <button
            onClick={deployToVercel}
            className="w-full btn-primary text-xs mb-2"
          >
            <ExternalLink size={13} /> Deploy to Vercel
          </button>
          <button onClick={exportZip} className="w-full btn-ghost text-xs">
            <Download size={13} /> Download ZIP
          </button>
        </div>
      )}
    </header>
  );
}
