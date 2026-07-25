'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ExternalLink, Key, Shield, Database } from 'lucide-react';
import { useAppStore } from '@/store';
import { PROVIDERS, getProvider } from '@/lib/providers';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: Props) {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const [localKey, setLocalKey] = useState('');
  const [localModel, setLocalModel] = useState('');
  const [localBaseURL, setLocalBaseURL] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  const provider = getProvider(settings.providerId);

  useEffect(() => {
    if (!open) return;
    const pid = settings.providerId;
    const prov = getProvider(pid);
    if (!prov) return;
    setLocalKey(settings.apiKeys[pid] ?? '');
    setLocalModel(settings.selectedModels[pid] ?? prov.defaultModel);
    if (pid === 'custom') {
      const customBase = (settings.selectedModels as any).__custom_base;
      setLocalBaseURL(customBase ?? prov.baseURL);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, settings.providerId]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  function saveKey() {
    updateSettings({
      apiKeys: { ...settings.apiKeys, [settings.providerId]: localKey.trim() },
    });
  }

  function saveModel() {
    updateSettings({
      selectedModels: {
        ...settings.selectedModels,
        [settings.providerId]: localModel.trim(),
      },
    });
  }

  const currentKey = settings.apiKeys[settings.providerId] ?? '';
  const isCustom = settings.providerId === 'custom';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-alizen-panel border border-alizen-border rounded-xl shadow-modal animate-scale-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-alizen-border">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Settings</h2>
            <p className="text-2xs text-alizen-muted/60 mt-0.5">
              Stored locally in your browser
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-alizen-muted hover:text-alizen-text hover:bg-white/[0.06] rounded-md transition-colors"
          >
            <X size={15} strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Privacy notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-alizen-accent-muted border border-alizen-accent/10">
            <Shield size={15} strokeWidth={1.5} className="text-alizen-accent/70 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-alizen-muted leading-relaxed">
              <strong className="text-alizen-dim font-medium">Keys stay in your browser.</strong>{' '}
              API keys are stored in localStorage and sent directly to the provider.
              Nothing is logged or saved on our servers.
            </div>
          </div>

          {/* Provider selection */}
          <section>
            <h3 className="text-xs font-medium mb-2.5 flex items-center gap-1.5 text-alizen-subtle">
              <Key size={13} strokeWidth={1.5} className="text-alizen-muted" />
              AI Provider
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => updateSettings({ providerId: p.id })}
                  className={cn(
                    'text-left p-2.5 rounded-lg border transition-all duration-100',
                    settings.providerId === p.id
                      ? 'border-alizen-accent/30 bg-alizen-accent-subtle ring-1 ring-alizen-accent/10'
                      : 'border-alizen-border hover:border-white/[0.08] hover:bg-white/[0.02]'
                  )}
                >
                  <div className="text-xs font-medium">{p.name}</div>
                  <div className="text-2xs text-alizen-muted/50 mt-0.5 truncate font-mono">
                    {p.defaultModel}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {provider && (
            <>
              {/* Custom base URL */}
              {isCustom && (
                <section>
                  <label className="text-xs font-medium mb-1.5 block text-alizen-subtle">Base URL</label>
                  <input
                    type="text"
                    value={localBaseURL}
                    onChange={(e) => setLocalBaseURL(e.target.value)}
                    onBlur={() => {
                      updateSettings({
                        selectedModels: {
                          ...settings.selectedModels,
                          __custom_base: localBaseURL,
                        } as any,
                      });
                    }}
                    placeholder="https://api.example.com/v1"
                    className="input font-mono text-xs"
                  />
                  <p className="text-2xs text-alizen-muted/50 mt-1.5">
                    For Ollama, lm-studio, vLLM, or any OpenAI-compatible endpoint.
                  </p>
                </section>
              )}

              {/* API Key */}
              <section>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-alizen-subtle">API Key</label>
                  {provider.apiKeyUrl && (
                    <a
                      href={provider.apiKeyUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-2xs text-alizen-accent hover:text-alizen-accent-hover inline-flex items-center gap-0.5 transition-colors"
                    >
                      Get a key <ExternalLink size={10} />
                    </a>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="password"
                    value={localKey}
                    onChange={(e) => setLocalKey(e.target.value)}
                    placeholder={
                      isCustom
                        ? 'Not required for local Ollama'
                        : `sk-... (${provider.name})`
                    }
                    className="input font-mono text-xs flex-1"
                    autoComplete="off"
                  />
                  <button
                    onClick={saveKey}
                    disabled={localKey === currentKey}
                    className={cn(
                      'btn-primary px-3 h-auto text-xs',
                      localKey === currentKey && 'opacity-30 cursor-not-allowed'
                    )}
                  >
                    Save
                  </button>
                </div>
                {currentKey && (
                  <p className="text-2xs text-green-500/70 mt-1.5 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-green-500/70" />
                    Key saved
                  </p>
                )}
              </section>

              {/* Model */}
              <section>
                <label className="text-xs font-medium mb-1.5 block text-alizen-subtle">Model</label>
                <input
                  type="text"
                  value={localModel}
                  onChange={(e) => setLocalModel(e.target.value)}
                  onBlur={saveModel}
                  list={`models-${provider.id}`}
                  className="input font-mono text-xs"
                />
                <datalist id={`models-${provider.id}`}>
                  {provider.models.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
                <p className="text-2xs text-alizen-muted/50 mt-1.5">
                  Choose from the list or type any model ID.
                </p>
              </section>
            </>
          )}

          {/* Data section */}
          <section>
            <h3 className="text-xs font-medium mb-2 flex items-center gap-1.5 text-alizen-subtle">
              <Database size={13} strokeWidth={1.5} className="text-alizen-muted" />
              Your data
            </h3>
            <div className="text-xs text-alizen-muted/70 leading-relaxed space-y-1">
              <p>Projects and chat history live in your browser only.</p>
              <p>Nothing is uploaded to any server.</p>
              <p>Clear browser data = erases projects. Use Export to back up.</p>
            </div>
          </section>
        </div>

        <div className="px-5 py-3 border-t border-alizen-border flex justify-end">
          <button onClick={onClose} className="btn-primary px-4 text-xs h-8">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
