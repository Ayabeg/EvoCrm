import { AppShell } from '@/components/app-shell';
import { EvoShell } from '@/components/shell/evo-shell';
import { WorkspaceFrame } from '@/evo/workspace/WorkspaceFrame';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({ children }: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <EvoShell>
                {/*
                  AGENT 06 MOUNT POINT — WorkspaceFrame
                  Frame owns scroll on the 10 acceptance routes and keeps
                  data-shell-scroll="document" for unmigrated routes.
                */}
                <WorkspaceFrame>{children}</WorkspaceFrame>
            </EvoShell>
        </AppShell>
    );
}
