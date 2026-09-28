import { AppShell } from '@/components/app-shell';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { EvoShell } from '@/components/shell/evo-shell';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({ children }: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <EvoShell>
                <AppSidebarHeader />
                <div className="aurora-page-shell min-h-0 min-w-0 overflow-x-clip flex-1 overflow-y-auto !bg-[var(--aurora-shell-bg)] font-sans">
                    {children}
                </div>
            </EvoShell>
        </AppShell>
    );
}
