import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { resolveWorkspaceRoute } from '@/evo/workspace/routes';
import './workspace-frame.css';

export function WorkspaceFrame({ children }: { children: ReactNode }) {
    const page = usePage();
    const resolution = resolveWorkspaceRoute(page.url);
    const agentsActive =
        resolution.path === '/agents' || resolution.path.startsWith('/agents/');
    const ownsScroll = resolution.shellScroll === 'frame';

    return (
        <div
            className={`workspace-frame aurora-page-shell min-h-0 min-w-0 overflow-x-clip flex-1 !bg-[var(--aurora-shell-bg)] font-sans${
                agentsActive ? ' agents-route-page-shell' : ''
            }`}
            data-workspace-frame=""
            data-archetype={resolution.archetype}
            data-scroll-owner={resolution.scrollOwner}
            data-shell-scroll={ownsScroll ? 'frame' : 'document'}
            data-workspace-migrated={resolution.migrated ? 'true' : 'false'}
        >
            {children}
        </div>
    );
}
