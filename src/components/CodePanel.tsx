'use client';

import { useState, useMemo } from 'react';
import {
  FileCode,
  Plus,
  FileText,
  FileJson,
  FileType2,
  Code2,
  Hash,
  X,
} from 'lucide-react';
import { useAppStore, useActiveProject } from '@/store';
import { cn } from '@/lib/utils';
import { PrismCodeEditor } from './PrismCodeEditor';

export function CodePanel() {
  const project = useActiveProject();
  const activePath = useAppStore((s) => s.activeFilePath);
  const setActiveFile = useAppStore((s) => s.setActiveFile);
  const createFile = useAppStore((s) => s.createFile);
  const deleteFile = useAppStore((s) => s.deleteFile);
  const updateFile = useAppStore((s) => s.updateFile);

  const [showNewFile, setShowNewFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const activeFile = useMemo(
    () => project?.files.find((f) => f.path === activePath) ?? null,
    [project, activePath]
  );

  function addFile() {
    const name = newFileName.trim();
    if (!name || !project) return;
    if (project.files.some((f) => f.path === name)) {
      setActiveFile(name);
    } else {
      createFile(name);
    }
    setNewFileName('');
    setShowNewFile(false);
  }

  if (!project) return null;

  return (
    <div className="flex flex-col h-full bg-alizen-bg">
      {/* File tabs */}
      <div className="h-9 flex-shrink-0 flex items-center px-1.5 border-b border-alizen-border bg-alizen-panel/60 backdrop-blur-sm gap-px overflow-x-auto">
        {project.files.map((f) => (
          <button
            key={f.path}
            onClick={() => setActiveFile(f.path)}
            className={cn(
              'group flex items-center gap-1.5 px-2.5 py-1 text-xs whitespace-nowrap transition-all duration-100 rounded-t-[5px] relative',
              f.path === activePath
                ? 'text-alizen-dim bg-alizen-bg'
                : 'text-alizen-muted/60 hover:text-alizen-muted hover:bg-white/[0.02]'
            )}
          >
            {/* Active indicator line */}
            {f.path === activePath && (
              <div className="absolute bottom-0 left-1.5 right-1.5 h-px bg-alizen-accent" />
            )}
            <FileIcon type={f.type} size={12} />
            <span>{f.path}</span>
            {project.files.length > 1 && (
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete ${f.path}?`)) deleteFile(f.path);
                }}
                className={cn(
                  'ml-0.5 transition-all duration-100',
                  f.path === activePath
                    ? 'opacity-40 hover:opacity-100 hover:text-red-400'
                    : 'opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:!text-red-400'
                )}
              >
                <X size={10} strokeWidth={2} />
              </span>
            )}
          </button>
        ))}
        <button
          onClick={() => setShowNewFile(true)}
          className="flex items-center justify-center w-6 h-6 rounded-md text-alizen-muted/40 hover:text-alizen-muted hover:bg-white/[0.04] transition-colors ml-0.5"
          title="New file"
        >
          <Plus size={13} strokeWidth={1.5} />
        </button>
        {showNewFile && (
          <input
            autoFocus
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addFile();
              if (e.key === 'Escape') {
                setShowNewFile(false);
                setNewFileName('');
              }
            }}
            onBlur={() => {
              if (newFileName.trim()) addFile();
              else setShowNewFile(false);
            }}
            placeholder="filename.html"
            className="bg-alizen-surface border border-alizen-accent/30 rounded-md px-2 py-1 text-xs w-28 outline-none focus:border-alizen-accent/50 transition-colors ml-1"
          />
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        {activeFile ? (
          <PrismCodeEditor
            key={activeFile.path + ':' + activeFile.version}
            value={activeFile.content}
            language={prismLangFor(activeFile.type)}
            onChange={(v) => updateFile(activeFile.path, v)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-alizen-muted/40 text-sm">
            Select a file to edit
          </div>
        )}
        {/* Status bar */}
        {activeFile && (
          <div className="absolute bottom-0 right-0 text-2xs text-alizen-muted/40 bg-alizen-panel/60 backdrop-blur-sm px-2 py-0.5 rounded-tl-md border-l border-t border-alizen-border/40 font-mono">
            {activeFile.path} <span className="opacity-50">v{activeFile.version}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function FileIcon({ type, size = 13 }: { type: string; size?: number }) {
  const cls = cn(size <= 12 ? 'opacity-70' : '');
  switch (type) {
    case 'html':
      return <Code2 size={size} strokeWidth={1.5} className={cn('text-orange-400/70', cls)} />;
    case 'css':
      return <FileType2 size={size} strokeWidth={1.5} className={cn('text-blue-400/70', cls)} />;
    case 'js':
    case 'jsx':
      return <FileCode size={size} strokeWidth={1.5} className={cn('text-yellow-400/70', cls)} />;
    case 'ts':
    case 'tsx':
      return <FileCode size={size} strokeWidth={1.5} className={cn('text-blue-300/70', cls)} />;
    case 'json':
      return <FileJson size={size} strokeWidth={1.5} className={cn('text-green-400/70', cls)} />;
    case 'md':
      return <Hash size={size} strokeWidth={1.5} className={cn('text-gray-400/70', cls)} />;
    default:
      return <FileText size={size} strokeWidth={1.5} className={cn('text-alizen-muted/50', cls)} />;
  }
}

function prismLangFor(type: string): string {
  switch (type) {
    case 'html': return 'html';
    case 'css': return 'css';
    case 'js':
    case 'jsx': return 'javascript';
    case 'ts': return 'typescript';
    case 'tsx': return 'tsx';
    case 'json': return 'json';
    case 'md': return 'markdown';
    default: return 'text';
  }
}
