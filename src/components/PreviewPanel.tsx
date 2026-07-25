'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, RefreshCw, ExternalLink, Smartphone, Monitor, Tablet } from 'lucide-react';
import { useAppStore, useActiveProject } from '@/store';
import { buildPreviewHTML } from '@/lib/preview';
import { cn } from '@/lib/utils';

type Device = 'desktop' | 'tablet' | 'mobile';
const DEVICE_WIDTHS: Record<Device, string> = {
  desktop: '100%',
  tablet: '820px',
  mobile: '390px',
};

export function PreviewPanel() {
  const project = useActiveProject();
  const [device, setDevice] = useState<Device>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const html = useMemo(() => {
    if (!project) return '';
    return buildPreviewHTML(project.files, project.entryFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.files, project?.entryFile, refreshKey]);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const data = e.data;
      if (data && typeof data === 'object' && data.__alizen_preview_error) {
        setPreviewError(data.message ?? 'Unknown error');
      }
      if (data && typeof data === 'object' && data.__alizen_preview_loaded) {
        setPreviewError(null);
      }
    }
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  function openInNewTab() {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  if (!project) return null;

  return (
    <div className="flex flex-col h-full bg-alizen-bg">
      {/* Toolbar */}
      <div className="h-9 flex-shrink-0 flex items-center px-2.5 border-b border-alizen-border bg-alizen-panel/60 backdrop-blur-sm gap-1.5">
        <Eye size={13} strokeWidth={1.5} className="text-alizen-accent/70" />
        <span className="text-xs font-medium text-alizen-subtle flex-1">Preview</span>

        {/* Device switcher */}
        <div className="flex items-center gap-px bg-white/[0.02] rounded-md p-px border border-white/[0.04]">
          <DeviceBtn active={device === 'desktop'} onClick={() => setDevice('desktop')} title="Desktop">
            <Monitor size={12} strokeWidth={1.5} />
          </DeviceBtn>
          <DeviceBtn active={device === 'tablet'} onClick={() => setDevice('tablet')} title="Tablet">
            <Tablet size={12} strokeWidth={1.5} />
          </DeviceBtn>
          <DeviceBtn active={device === 'mobile'} onClick={() => setDevice('mobile')} title="Mobile">
            <Smartphone size={12} strokeWidth={1.5} />
          </DeviceBtn>
        </div>

        <button
          onClick={() => {
            setRefreshKey((k) => k + 1);
            setPreviewError(null);
          }}
          className="btn-ghost h-6 w-6 p-0"
          title="Reload preview"
        >
          <RefreshCw size={12} strokeWidth={1.5} />
        </button>
        <button
          onClick={openInNewTab}
          className="btn-ghost h-6 w-6 p-0"
          title="Open in new tab"
        >
          <ExternalLink size={12} strokeWidth={1.5} />
        </button>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto p-3 flex items-start justify-center bg-[#08080a]">
        <div
          className="relative bg-white rounded-lg overflow-hidden transition-all duration-300 ease-out"
          style={{
            width: DEVICE_WIDTHS[device],
            height: device === 'desktop' ? '100%' : '720px',
            maxWidth: '100%',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 8px 40px -8px rgba(0,0,0,0.6)',
          }}
        >
          {/* Device frame — notch */}
          {device !== 'desktop' && (
            <div className="absolute top-0 left-0 right-0 h-7 bg-[#1a1a1e] flex items-center justify-center z-10">
              <div className="w-14 h-1 bg-[#333] rounded-full" />
            </div>
          )}
          <iframe
            key={refreshKey}
            ref={iframeRef}
            title="preview"
            srcDoc={html}
            sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
            className={cn('preview-frame', device !== 'desktop' && 'mt-7')}
            style={{ height: device === 'desktop' ? '100%' : 'calc(100% - 28px)' }}
          />
        </div>
      </div>

      {/* Error bar */}
      {previewError && (
        <div className="flex-shrink-0 bg-red-500/[0.06] border-t border-red-500/20 text-red-400 px-3 py-1.5 text-xs font-mono">
          <strong className="font-semibold">Error:</strong> {previewError}
        </div>
      )}
    </div>
  );
}

function DeviceBtn({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'p-1 rounded-[4px] transition-all duration-100',
        active
          ? 'bg-white/[0.1] text-alizen-text shadow-sm'
          : 'text-alizen-muted/50 hover:text-alizen-muted'
      )}
    >
      {children}
    </button>
  );
}
