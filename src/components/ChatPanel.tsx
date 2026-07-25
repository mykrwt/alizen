'use client';

import { useEffect, useRef, useState, FormEvent } from 'react';
import {
  Send,
  Square,
  Sparkles,
  User,
  Bot,
  Zap,
  FileCode,
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

  // Auto-scroll to bottom when messages / streaming updates
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [project?.messages.length, streamingContent]);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
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
      // Read optional custom base URL (used by the "custom" provider for Ollama, etc.)
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
      // After streaming completes, parse files from final content
      const finalContent = useAppStore.getState().streamingContent;
      applyAssistantResponse(finalContent);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Treat partial as final
        const partial = useAppStore.getState().streamingContent;
        if (partial.trim()) {
          applyAssistantResponse(partial + '\n\n*[stopped]*');
        } else {
          setStreaming(false, '');
        }
      } else {
        // Show error as assistant message
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
      <div className="h-12 flex-shrink-0 flex items-center justify-between px-4 border-b border-alizen-border bg-alizen-panel">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-alizen-accent" />
          <span className="text-xs font-semibold">Chat</span>
        </div>
        {hasMessages && (
          <div className="text-[10px] text-alizen-muted">
            {project!.messages.length} message{project!.messages.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {!hasMessages ? (
          <EmptyState
            onPick={(p) => handleSubmit(p)}
            hasApiKey={!!apiKey}
            onOpenSettings={onOpenSettings}
          />
        ) : (
          <div className="p-4 space-y-4">
            {project!.messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
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
              />
            )}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="flex-shrink-0 p-3 border-t border-alizen-border bg-alizen-panel">
        <form onSubmit={onFormSubmit} className="relative">
          <div className="flex items-end gap-2 bg-alizen-surface border border-alizen-border rounded-xl focus-within:border-alizen-accent focus-within:ring-1 focus-within:ring-alizen-accent/30 transition-all">
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
                  : 'Add your API key in Settings to start building…'
              }
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none px-4 py-3 text-sm placeholder:text-alizen-muted"
              disabled={isStreaming}
            />
            <div className="p-2">
              {isStreaming ? (
                <button
                  type="button"
                  onClick={handleStop}
                  className="btn bg-alizen-error/80 hover:bg-alizen-error text-white h-9 w-9 p-0"
                  title="Stop generating"
                >
                  <Square size={14} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className={cn(
                    'btn-primary h-9 w-9 p-0',
                    !input.trim() && 'opacity-40 cursor-not-allowed'
                  )}
                  title="Send (Enter)"
                >
                  <Send size={14} />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 px-1">
            <div className="text-[10px] text-alizen-muted">
              <kbd>Enter</kbd> send · <kbd>Shift+Enter</kbd> newline
            </div>
            <div className="text-[10px] text-alizen-muted flex items-center gap-1">
              <Zap size={10} className="text-alizen-accent" />
              {isStreaming ? 'Generating…' : 'Ready'}
            </div>
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
    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-alizen-accent to-alizen-accent2 flex items-center justify-center mb-4 shadow-glow">
        <Sparkles size={28} className="text-white" />
      </div>
      <h2 className="text-xl font-bold mb-2">What do you want to build?</h2>
      <p className="text-sm text-alizen-muted max-w-sm mb-6 leading-relaxed">
        Describe an app in plain English. Alizen will write the code, live-preview it, and
        give you a downloadable project you can deploy anywhere.
      </p>
      {!hasApiKey && (
        <button onClick={onOpenSettings} className="btn-primary text-sm mb-5">
          <Zap size={14} /> Add your API key to start
        </button>
      )}
      <div className="grid grid-cols-2 gap-2 w-full max-w-md">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            onClick={() => hasApiKey && onPick(s.prompt)}
            disabled={!hasApiKey}
            className={cn(
              'flex items-start gap-2 p-3 rounded-lg border border-alizen-border bg-alizen-surface/40 hover:bg-alizen-surface hover:border-alizen-accent/40 text-left transition-all text-xs',
              !hasApiKey && 'opacity-50 cursor-not-allowed'
            )}
          >
            <FileCode size={14} className="mt-0.5 text-alizen-accent flex-shrink-0" />
            <div>
              <div className="font-semibold text-alizen-text">{s.label}</div>
              <div className="text-alizen-muted text-[10px] mt-0.5 line-clamp-2">
                {s.prompt.slice(0, 80)}…
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
}: {
  msg: { id: string; role: 'user' | 'assistant' | 'system'; content: string; createdAt?: number };
  streaming?: boolean;
}) {
  const isUser = msg.role === 'user';
  return (
    <div className={cn('flex gap-3 animate-fade-in', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'w-7 h-7 rounded-md flex-shrink-0 flex items-center justify-center',
          isUser
            ? 'bg-alizen-accent/20 text-alizen-accent'
            : 'bg-gradient-to-br from-alizen-accent to-alizen-accent2 text-white'
        )}
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-alizen-accent/15 text-alizen-text border border-alizen-accent/25'
            : 'bg-alizen-surface text-alizen-text border border-alizen-border'
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
