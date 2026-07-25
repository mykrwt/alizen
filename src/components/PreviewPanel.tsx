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
    // refreshKey forces re-render when user clicks reload
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

  // Open preview in new tab
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
      <div className="h-12 flex-shrink-0 flex items-center px-3 border-b border-alizen-border bg-alizen-panel gap-2">
        <Eye size={14} className="text-alizen-accent" />
        <span className="text-xs font-semibold flex-1">Live Preview</span>
        <div className="flex items-center gap-1 bg-alizen-surface rounded-md p-0.5 border border-alizen-border">
          <DeviceBtn active={device === 'desktop'} onClick={() => setDevice('desktop')} title="Desktop">
            <Monitor size={13} />
          </DeviceBtn>
          <DeviceBtn active={device === 'tablet'} onClick={() => setDevice('tablet')} title="Tablet">
            <Tablet size={13} />
          </DeviceBtn>
          <DeviceBtn active={device === 'mobile'} onClick={() => setDevice('mobile')} title="Mobile">
            <Smartphone size={13} />
          </DeviceBtn>
        </div>
        <button
          onClick={() => {
            setRefreshKey((k) => k + 1);
            setPreviewError(null);
          }}
          className="btn-ghost text-xs h-8 px-2"
          title="Reload preview"
        >
          <RefreshCw size={13} />
        </button>
        <button
          onClick={openInNewTab}
          className="btn-ghost text-xs h-8 px-2"
          title="Open in new tab"
        >
          <ExternalLink size={13} />
        </button>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto bg-[#07070c] p-4 flex items-start justify-center">
        <div
          className="relative bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300"
          style={{
            width: DEVICE_WIDTHS[device],
            height: device === 'desktop' ? '100%' : '720px',
            maxWidth: '100%',
          }}
        >
          {device !== 'desktop' && (
            <div className="absolute top-0 left-0 right-0 h-6 bg-black/90 flex items-center justify-center z-10">
              <div className="w-16 h-1.5 bg-gray-700 rounded-full" />
            </div>
          )}
          <iframe
            key={refreshKey}
            ref={iframeRef}
            title="preview"
            srcDoc={html}
            sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
            className={cn('preview-frame', device !== 'desktop' && 'mt-6')}
            style={{ height: device === 'desktop' ? '100%' : 'calc(100% - 24px)' }}
          />
        </div>
      </div>

      {previewError && (
        <div className="flex-shrink-0 bg-alizen-error/10 border-t border-alizen-error/30 text-alizen-error px-4 py-2 text-xs font-mono">
          <strong>Preview error:</strong> {previewError}
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
        'p-1.5 rounded transition-colors',
        active ? 'bg-alizen-accent text-white' : 'text-alizen-muted hover:text-alizen-text'
      )}
    >
      {children}
    </button>
  );
}
