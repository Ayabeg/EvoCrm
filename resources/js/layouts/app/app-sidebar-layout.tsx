import { usePage } from '@inertiajs/react';
import { AppShell } from '@/components/app-shell';
import { EvoShell } from '@/components/shell/evo-shell';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({ children }: AppLayoutProps) {
    const page = usePage();
    const path = (page.url.split('?')[0] ?? '/').split('#')[0] ?? '/';
    const agentsActive = path === '/agents' || path.startsWith('/agents/');

    return (
        <AppShell variant="sidebar">
            <EvoShell>
                {/*
                  AGENT 06 MOUNT POINT — WorkspaceFrame
                  Replace the wrapper below with:
                    <WorkspaceFrame>{children}</WorkspaceFrame>
                  Shell owns this file except that one line. Do not implement
                  WorkspaceHeader or header slots here.
                */}
                <div
                    className={`aurora-page-shell min-h-0 min-w-0 overflow-x-clip flex-1 overflow-y-auto !bg-[var(--aurora-shell-bg)] font-sans${agentsActive ? ' agents-route-page-shell' : ''}`}
                    data-shell-scroll="document"
                >
                    {children}
                </div>
            </EvoShell>
        </AppShell>
    );
}
