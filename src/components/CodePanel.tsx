'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  FileCode,
  Plus,
  Trash2,
  FileText,
  FileJson,
  FileType2,
  Code2,
  Hash,
  ChevronRight,
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
      {/* Header */}
      <div className="h-12 flex-shrink-0 flex items-center px-2 border-b border-alizen-border bg-alizen-panel gap-1 overflow-x-auto">
        {project.files.map((f) => (
          <button
            key={f.path}
            onClick={() => setActiveFile(f.path)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border whitespace-nowrap transition-colors',
              f.path === activePath
                ? 'file-tab-active'
                : 'text-alizen-muted border-transparent hover:bg-alizen-surface hover:text-alizen-text'
            )}
          >
            <FileIcon type={f.type} size={12} />
            <span>{f.path}</span>
            {project.files.length > 1 && f.path === activePath && (
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete ${f.path}?`)) deleteFile(f.path);
                }}
                className="opacity-50 hover:opacity-100 hover:text-alizen-error ml-1"
              >
                ×
              </span>
            )}
          </button>
        ))}
        <button
          onClick={() => setShowNewFile(true)}
          className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs text-alizen-muted hover:text-alizen-accent hover:bg-alizen-surface"
          title="New file"
        >
          <Plus size={13} />
        </button>
        {showNewFile && (
          <div className="flex items-center gap-1 px-1">
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
              className="bg-alizen-surface border border-alizen-accent rounded px-2 py-1 text-xs w-32 outline-none"
            />
          </div>
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
          <div className="flex-1 flex items-center justify-center text-alizen-muted text-sm">
            Select a file to edit
          </div>
        )}
        {/* File status */}
        <div className="absolute bottom-0 right-0 text-[10px] text-alizen-muted bg-alizen-panel/80 backdrop-blur px-2 py-1 rounded-tl-md border-l border-t border-alizen-border">
          {activeFile ? `${activeFile.path} · v${activeFile.version}` : ''}
        </div>
      </div>
    </div>
  );
}

function FileIcon({ type, size = 14 }: { type: string; size?: number }) {
  switch (type) {
    case 'html':
      return <Code2 size={size} className="text-orange-400" />;
    case 'css':
      return <FileType2 size={size} className="text-blue-400" />;
    case 'js':
    case 'jsx':
      return <FileCode size={size} className="text-yellow-400" />;
    case 'ts':
    case 'tsx':
      return <FileCode size={size} className="text-blue-300" />;
    case 'json':
      return <FileJson size={size} className="text-green-400" />;
    case 'md':
      return <Hash size={size} className="text-gray-400" />;
    default:
      return <FileText size={size} className="text-alizen-muted" />;
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
