'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { ChatPanel } from '@/components/ChatPanel';
import { CodePanel } from '@/components/CodePanel';
import { PreviewPanel } from '@/components/PreviewPanel';
import { SettingsModal } from '@/components/SettingsModal';
import { MobileTabs } from '@/components/MobileTabs';
import { useAppStore } from '@/store';
import { SplitPane } from '@/components/SplitPane';

export default function HomePage() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const mobileView = useAppStore((s) => s.mobileView);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-alizen-bg">
      <TopBar onOpenSettings={() => setSettingsOpen(true)} />

      <div className="flex-1 flex min-h-0">
        {/* Sidebar — desktop */}
        <div className="hidden md:block h-full border-r border-alizen-border">
          <Sidebar onOpenSettings={() => setSettingsOpen(true)} />
        </div>

        {/* Mobile: single panel */}
        <div className="flex-1 flex flex-col min-w-0 md:hidden">
          <div className="flex-1 min-h-0">
            {mobileView === 'chat' && <ChatPanel onOpenSettings={() => setSettingsOpen(true)} />}
            {mobileView === 'code' && <CodePanel />}
            {mobileView === 'preview' && <PreviewPanel />}
          </div>
          <MobileTabs />
        </div>

        {/* Desktop: 3-pane split */}
        <div className="hidden md:flex flex-1 min-w-0">
          <SplitPane
            direction="horizontal"
            sizes={[28, 72]}
            minSizes={[280, 400]}
          >
            {/* Chat */}
            <div className="h-full min-w-0">
              <ChatPanel onOpenSettings={() => setSettingsOpen(true)} />
            </div>
            {/* Right side: code + preview vertical split */}
            <SplitPane
              direction="vertical"
              sizes={[55, 45]}
              minSizes={[200, 160]}
            >
              <div className="w-full min-h-0">
                <CodePanel />
              </div>
              <div className="w-full min-h-0">
                <PreviewPanel />
              </div>
            </SplitPane>
          </SplitPane>
        </div>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
