import { usePage } from '@inertiajs/react';
import { List } from '@phosphor-icons/react';
import { useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { AgentsSidebar } from '@/components/desk/agents-sidebar';
import { AgentsRoom } from '@/components/shell/agents-room';
import { EvoRail } from '@/components/shell/evo-rail';
import type { RailMode } from '@/components/shell/evo-rail';
import { Sidebar, useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

let shellHydrated = false;

function subscribeShellHydration(onStoreChange: () => void) {
    if (shellHydrated) {
        return () => {};
    }

    const timer = window.setTimeout(() => {
        shellHydrated = true;
        onStoreChange();
    }, 0);

    return () => window.clearTimeout(timer);
}

function useShellHydrated(): boolean {
    return useSyncExternalStore(
        subscribeShellHydration,
        () => shellHydrated,
        () => false,
    );
}

export function EvoShell({ children }: { children: ReactNode }) {
    const page = usePage();
    const isMobile = useIsMobile();
    const { setOpenMobile } = useSidebar();
    const showMobileSheet = useShellHydrated() && isMobile;
    const [mode, setMode] = useState<RailMode>('menu');
    const [collapsed, setCollapsed] = useState(false);
    const path = (page.url.split('?')[0] ?? '/').split('#')[0] ?? '/';
    const agentsActive = path === '/agents' || path.startsWith('/agents/');
    const showLegacyAgentsRoom = mode === 'agents' && !agentsActive;

    return (
        <div
            className="evo-shell flex h-dvh w-full min-w-0 overflow-hidden"
            data-collapsed={collapsed ? 'true' : 'false'}
        >
            <aside
                data-shell="production"
                className="evo-rail-slot evo-cabinet hidden h-dvh shrink-0 overflow-hidden border-r border-shell-hairline md:block"
            >
                <div className="evo-rail-panel h-full">
                    <EvoRail
                        activeHotkeys={!isMobile}
                        mode={mode}
                        onModeChange={(next) => {
                            setMode(next);

                            if (next !== 'menu') {
                                setCollapsed(false);
                            }
                        }}
                        onToggleCollapsed={() => setCollapsed(true)}
                    />
                </div>
            </aside>
            {showMobileSheet ? (
                <Sidebar collapsible="offcanvas">
                    <div className="evo-cabinet flex h-full min-h-0 flex-col">
                        {agentsActive ? (
                            <AgentsSidebar
                                onNavigate={() => setOpenMobile(false)}
                            />
                        ) : (
                            <EvoRail
                                activeHotkeys
                                mode={mode}
                                onModeChange={setMode}
                                onNavigate={() => setOpenMobile(false)}
                            />
                        )}
                    </div>
                </Sidebar>
            ) : null}
            <div className="evo-workspace relative flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <button
                    type="button"
                    className="evo-rail-reopen absolute top-3 left-3 z-30 hidden size-8 place-items-center rounded-lg bg-[#171717] text-[#f5f5f5] hover:bg-[#2a2a2a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F4C5C] md:grid"
                    aria-label="Ouvrir le menu"
                    title="Ouvrir le menu"
                    tabIndex={collapsed ? 0 : -1}
                    aria-hidden={collapsed ? undefined : true}
                    onClick={() => setCollapsed(false)}
                >
                    <List className="size-4" weight="regular" />
                </button>
                <div className="flex min-h-0 min-w-0 flex-1">
                    {agentsActive ? (
                        <div className="hidden h-full shrink-0 md:flex">
                            <AgentsSidebar />
                        </div>
                    ) : null}
                    <div
                        className={cn(
                            'flex min-h-0 min-w-0 flex-1 flex-col',
                            showLegacyAgentsRoom && 'hidden',
                        )}
                    >
                        {children}
                    </div>
                </div>
                {showLegacyAgentsRoom ? (
                    <div className="absolute inset-0 z-10 flex min-h-0">
                        <AgentsRoom />
                    </div>
                ) : null}
            </div>
        </div>
    );
}
