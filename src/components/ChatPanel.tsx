'use client';

import { useEffect, useRef, useState, FormEvent } from 'react';
import {
  Send,
  Square,
  Sparkles,
  User,
  Bot,
  FileCode,
  ArrowUp,
} from 'lucide-react';
import { useAppStore, useActiveProject } from '@/store';
import { renderMarkdownLite, cn } from '@/lib/utils';
import { streamChatCompletion } from '@/lib/llm';
import { uid } from '@/lib/utils';

const SUGGESTIONS = [
  { label: 'Landing page', prompt: 'Build a beautiful SaaS landing page with a hero, features, pricing, and footer sections. Use a modern violet/cyan gradient theme.' },
  { label: 'Todo app', prompt: 'Build a todo list app with local storage persistence, drag-and-drop reordering, dark mode, and categories.' },
  { label: 'Calculator', prompt: 'Build a beautiful calculator app with a modern glassmorphism design.' },
  { label: 'Markdown editor', prompt: 'Build a live markdown editor with split view (editor on left, preview on right), syntax highlighting, and export to HTML.' },
  { label: 'Pomodoro timer', prompt: 'Build a pomodoro timer app with work/break sessions, stats, a beautiful circular progress indicator, and notification sounds.' },
  { label: 'Weather widget', prompt: 'Build a weather dashboard UI. Use fake data but make it look beautiful with gradient backgrounds and animated icons.' },
];

export function ChatPanel({ onOpenSettings }: { onOpenSettings: () => void }) {
  const project = useActiveProject();
  const addMessage = useAppStore((s) => s.addMessage);
  const applyAssistantResponse = useAppStore((s) => s.applyAssistantResponse);
  const isStreaming = useAppStore((s) => s.isStreaming);
  const streamingContent = useAppStore((s) => s.streamingContent);
  const setStreaming = useAppStore((s) => s.setStreaming);
  const appendStreaming = useAppStore((s) => s.appendStreaming);
  const settings = useAppStore((s) => s.settings);
  const setMobileView = useAppStore((s) => s.setMobileView);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const apiKey = settings.apiKeys[settings.providerId] ?? '';

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [project?.messages.length, streamingContent]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [input]);

  const hasMessages = (project?.messages.length ?? 0) > 0;

  async function handleSubmit(prompt?: string) {
    const text = (prompt ?? input).trim();
    if (!text || !project) return;
    if (isStreaming) return;
    if (!apiKey) {
      onOpenSettings();
      return;
    }

    setInput('');
    const userMsg = {
      id: uid('m_'),
      role: 'user' as const,
      content: text,
      createdAt: Date.now(),
    };
    addMessage(userMsg);
    setMobileView('code');

    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true, '');

    try {
      const messagesForLLM = [...project.messages, userMsg];
      const customBaseURL =
        settings.providerId === 'custom'
          ? (settings.selectedModels as any).__custom_base || undefined
          : undefined;
      await streamChatCompletion({
        providerId: settings.providerId,
        apiKey,
        model:
          settings.providerId === 'custom'
            ? settings.selectedModels[settings.providerId]
            : settings.selectedModels[settings.providerId],
        customBaseURL,
        baseURL: customBaseURL,
        messages: messagesForLLM,
        files: project.files,
        signal: controller.signal,
        onDelta: (delta) => appendStreaming(delta),
      });
      const finalContent = useAppStore.getState().streamingContent;
      applyAssistantResponse(finalContent);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        const partial = useAppStore.getState().streamingContent;
        if (partial.trim()) {
          applyAssistantResponse(partial + '\n\n*[stopped]*');
        } else {
          setStreaming(false, '');
        }
      } else {
        setStreaming(false, '');
        addMessage({
          id: uid('m_'),
          role: 'assistant',
          content: `**Error:** ${err.message ?? String(err)}\n\nDouble-check your API key in Settings.`,
          createdAt: Date.now(),
        });
      }
    } finally {
      abortRef.current = null;
    }
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  function onFormSubmit(e: FormEvent) {
    e.preventDefault();
    handleSubmit();
  }

  return (
    <div className="flex flex-col h-full bg-alizen-bg">
      {/* Header */}
      <div className="h-11 flex-shrink-0 flex items-center justify-between px-3 border-b border-alizen-border bg-alizen-panel/60 backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          <Sparkles size={13} strokeWidth={1.5} className="text-alizen-accent" />
          <span className="text-xs font-medium text-alizen-subtle">Chat</span>
        </div>
        {hasMessages && (
          <span className="text-2xs text-alizen-muted/60 tabular-nums">
            {project!.messages.length}
          </span>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {!hasMessages ? (
          <EmptyState
            onPick={(p) => handleSubmit(p)}
            hasApiKey={!!apiKey}
            onOpenSettings={onOpenSettings}
          />
        ) : (
          <div className="p-3 space-y-3">
            {project!.messages.map((msg, i) => (
              <MessageBubble key={msg.id} msg={msg} index={i} />
            ))}
            {isStreaming && streamingContent && (
              <MessageBubble
                streaming
                msg={{
                  id: 'streaming',
                  role: 'assistant',
                  content: streamingContent,
                  createdAt: Date.now(),
                }}
                index={project!.messages.length}
              />
            )}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="flex-shrink-0 p-3 border-t border-alizen-border bg-alizen-panel/60 backdrop-blur-sm">
        <form onSubmit={onFormSubmit}>
          <div className="flex items-end gap-2 bg-alizen-surface border border-alizen-border rounded-lg focus-within:border-white/[0.12] transition-all duration-150">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={
                apiKey
                  ? 'Describe the app you want to build…'
                  : 'Add your API key in Settings to start…'
              }
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none px-3 py-2.5 text-[13px] placeholder:text-alizen-muted/50 min-h-[38px]"
              disabled={isStreaming}
            />
            <div className="p-1.5">
              {isStreaming ? (
                <button
                  type="button"
                  onClick={handleStop}
                  className="flex items-center justify-center w-7 h-7 rounded-md bg-red-500/15 hover:bg-red-500/25 text-red-400 transition-colors"
                  title="Stop generating"
                >
                  <Square size={12} fill="currentColor" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className={cn(
                    'flex items-center justify-center w-7 h-7 rounded-md transition-all duration-150',
                    input.trim()
                      ? 'bg-alizen-accent hover:bg-alizen-accent-hover text-white shadow-glow-sm'
                      : 'bg-white/[0.04] text-alizen-muted/40 cursor-not-allowed'
                  )}
                  title="Send (Enter)"
                >
                  <ArrowUp size={14} strokeWidth={2} />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between mt-1.5 px-0.5">
            <span className="text-2xs text-alizen-muted/40">
              <kbd className="kbd mr-0.5">↵</kbd> send
              <span className="mx-1 opacity-40">·</span>
              <kbd className="kbd mr-0.5">⇧↵</kbd> newline
            </span>
            <span className={cn(
              'text-2xs flex items-center gap-1',
              isStreaming ? 'text-alizen-accent' : 'text-alizen-muted/40'
            )}>
              {isStreaming && (
                <span className="w-1.5 h-1.5 rounded-full bg-alizen-accent animate-pulse-dot" />
              )}
              {isStreaming ? 'Generating' : 'Ready'}
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}

function EmptyState({
  onPick,
  hasApiKey,
  onOpenSettings,
}: {
  onPick: (prompt: string) => void;
  hasApiKey: boolean;
  onOpenSettings: () => void;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 py-8 text-center">
      {/* Ambient glow behind icon */}
      <div className="relative mb-5">
        <div className="absolute inset-0 w-16 h-16 bg-alizen-accent/20 rounded-full blur-xl scale-150" />
        <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-alizen-accent/20 to-alizen-accent/[0.05] border border-alizen-accent/20 flex items-center justify-center">
          <Sparkles size={20} strokeWidth={1.5} className="text-alizen-accent" />
        </div>
      </div>

      <h2 className="text-base font-semibold tracking-tight mb-1.5">
        What do you want to build?
      </h2>
      <p className="text-[13px] text-alizen-muted max-w-xs mb-5 leading-relaxed">
        Describe an app in plain English. Alizen writes the code, previews it live,
        and gives you a downloadable project.
      </p>

      {!hasApiKey && (
        <button onClick={onOpenSettings} className="btn-primary text-xs h-8 px-4 mb-5">
          Add your API key to start
        </button>
      )}

      <div className="grid grid-cols-2 gap-1.5 w-full max-w-sm">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            onClick={() => hasApiKey && onPick(s.prompt)}
            disabled={!hasApiKey}
            className={cn(
              'flex items-start gap-2 p-2.5 rounded-lg border border-alizen-border bg-alizen-surface/30 text-left transition-all duration-100',
              'hover:bg-alizen-surface/60 hover:border-white/[0.08]',
              !hasApiKey && 'opacity-30 cursor-not-allowed'
            )}
          >
            <FileCode size={13} strokeWidth={1.5} className="mt-0.5 text-alizen-accent/60 flex-shrink-0" />
            <div>
              <div className="text-xs font-medium text-alizen-dim">{s.label}</div>
              <div className="text-2xs text-alizen-muted/50 mt-0.5 line-clamp-1">
                {s.prompt.slice(0, 50)}…
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({
  msg,
  streaming,
  index,
}: {
  msg: { id: string; role: 'user' | 'assistant' | 'system'; content: string; createdAt?: number };
  streaming?: boolean;
  index: number;
}) {
  const isUser = msg.role === 'user';
  return (
    <div
      className={cn('flex gap-2.5 animate-fade-up', isUser && 'flex-row-reverse')}
      style={{ animationDelay: `${Math.min(index * 20, 100)}ms` }}
    >
      <div
        className={cn(
          'w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center mt-0.5',
          isUser
            ? 'bg-white/[0.06] text-alizen-subtle'
            : 'bg-alizen-accent/10 text-alizen-accent'
        )}
      >
        {isUser ? <User size={12} strokeWidth={1.5} /> : <Bot size={12} strokeWidth={1.5} />}
      </div>
      <div
        className={cn(
          'max-w-[85%] rounded-lg px-3 py-2 text-[13px] leading-relaxed',
          isUser
            ? 'bg-white/[0.06] text-alizen-text border border-white/[0.06]'
            : 'bg-alizen-surface/60 text-alizen-text border border-alizen-border/60'
        )}
      >
        <div
          className={cn('prose-chat', streaming && 'typing-cursor')}
          dangerouslySetInnerHTML={{ __html: renderMarkdownLite(msg.content) || '…' }}
        />
      </div>
    </div>
  );
}
