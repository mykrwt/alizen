'use client';

import { useState, useEffect } from 'react';
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-alizen-panel border border-alizen-border rounded-xl shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-alizen-border">
          <div>
            <h2 className="text-lg font-bold">Settings</h2>
            <p className="text-xs text-alizen-muted mt-0.5">
              All settings are saved in your browser only.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-alizen-muted hover:text-alizen-text hover:bg-alizen-surface rounded-md">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Privacy notice */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-alizen-accent/10 border border-alizen-accent/20">
            <Shield size={18} className="text-alizen-accent mt-0.5 flex-shrink-0" />
            <div className="text-xs text-alizen-subtle leading-relaxed">
              <strong className="text-alizen-text">Your keys stay in your browser.</strong> API keys
              are stored in your browser&apos;s localStorage and sent directly to the AI provider
              (or a thin Vercel proxy for CORS-incompatible providers — keys are never logged
              or saved). Alizen has no server database.
            </div>
          </div>

          {/* Provider */}
          <section>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Key size={14} className="text-alizen-accent" /> AI Provider
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => updateSettings({ providerId: p.id })}
                  className={cn(
                    'text-left p-3 rounded-lg border transition-all',
                    settings.providerId === p.id
                      ? 'border-alizen-accent bg-alizen-accent/10'
                      : 'border-alizen-border bg-alizen-surface/40 hover:border-alizen-border/80 hover:bg-alizen-surface'
                  )}
                >
                  <div className="text-xs font-semibold">{p.name}</div>
                  <div className="text-[10px] text-alizen-muted mt-1 truncate">
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
                  <label className="text-xs font-semibold mb-2 block">Base URL</label>
                  <input
                    type="text"
                    value={localBaseURL}
                    onChange={(e) => setLocalBaseURL(e.target.value)}
                    onBlur={() => {
                      // For custom provider, we let the user override baseURL via selectedModels mechanism too; simplest: store on provider object via settings
                      // Since provider objects are static, we store customBaseURL as a side map
                      updateSettings({
                        selectedModels: {
                          ...settings.selectedModels,
                          __custom_base: localBaseURL,
                        } as any,
                      });
                    }}
                    placeholder="https://api.example.com/v1"
                    className="input"
                  />
                  <p className="text-[10px] text-alizen-muted mt-1.5">
                    Use this for Ollama (http://localhost:11434/v1), lm-studio, vLLM, or any
                    OpenAI-compatible endpoint.
                  </p>
                </section>
              )}

              {/* API Key */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold">API Key</label>
                  {provider.apiKeyUrl && (
                    <a
                      href={provider.apiKeyUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-[11px] text-alizen-accent hover:underline inline-flex items-center gap-1"
                    >
                      Get a key <ExternalLink size={11} />
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={localKey}
                    onChange={(e) => setLocalKey(e.target.value)}
                    placeholder={
                      isCustom
                        ? 'Not required for local Ollama'
                        : `sk-... (${provider.name} key)`
                    }
                    className="input font-mono"
                    autoComplete="off"
                  />
                  <button
                    onClick={saveKey}
                    disabled={localKey === currentKey}
                    className={cn(
                      'btn-primary px-4',
                      localKey === currentKey && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    Save
                  </button>
                </div>
                {currentKey && (
                  <p className="text-[10px] text-alizen-success mt-1.5">
                    ✓ Key saved in browser.
                  </p>
                )}
              </section>

              {/* Model */}
              <section>
                <label className="text-xs font-semibold mb-2 block">Model</label>
                <input
                  type="text"
                  value={localModel}
                  onChange={(e) => setLocalModel(e.target.value)}
                  onBlur={saveModel}
                  list={`models-${provider.id}`}
                  className="input"
                />
                <datalist id={`models-${provider.id}`}>
                  {provider.models.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
                <p className="text-[10px] text-alizen-muted mt-1.5">
                  Choose from the list or type any model ID supported by this provider.
                </p>
              </section>
            </>
          )}

          {/* Data info */}
          <section>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Database size={14} className="text-alizen-accent" /> Your data
            </h3>
            <div className="text-xs text-alizen-subtle leading-relaxed space-y-1">
              <p>· Projects and chat history are stored only in your browser (localStorage).</p>
              <p>· Nothing is uploaded to Alizen&apos;s servers.</p>
              <p>· Clearing browser data will erase your projects — use &quot;Download ZIP&quot; to back up.</p>
            </div>
          </section>
        </div>

        <div className="px-6 py-4 border-t border-alizen-border flex justify-end gap-2">
          <button onClick={onClose} className="btn-primary px-5">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
