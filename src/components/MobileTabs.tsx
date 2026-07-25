'use client';

import { MessageSquare, Code2, Eye } from 'lucide-react';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';

export function MobileTabs() {
  const view = useAppStore((s) => s.mobileView);
  const setView = useAppStore((s) => s.setMobileView);

  const tabs = [
    { id: 'chat' as const, icon: MessageSquare, label: 'Chat' },
    { id: 'code' as const, icon: Code2, label: 'Code' },
    { id: 'preview' as const, icon: Eye, label: 'Preview' },
  ];

  return (
    <div className="md:hidden flex-shrink-0 flex border-t border-alizen-border bg-alizen-panel/80 backdrop-blur-sm">
      {tabs.map((t) => {
        const active = view === t.id;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-2xs transition-colors relative',
              active ? 'text-alizen-text' : 'text-alizen-muted/50'
            )}
          >
            {active && (
              <div className="absolute top-0 left-1/4 right-1/4 h-px bg-alizen-accent" />
            )}
            <Icon size={16} strokeWidth={1.5} />
            <span className="font-medium">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
