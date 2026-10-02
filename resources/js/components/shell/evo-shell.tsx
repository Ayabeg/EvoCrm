import { usePage } from '@inertiajs/react';
import { useCallback, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { AgentsSidebar } from '@/components/desk/agents-sidebar';
import { EvoRail } from '@/components/shell/evo-rail';
import type { RailMode } from '@/components/shell/evo-rail';
import { Sidebar, useSidebar } from '@/components/ui/sidebar';
import { List } from '@/evo/icons';
import {
    CommandPalette,
    useCommandPaletteShortcut,
} from '@/evo/patterns/command-palette';
import { useIsMobile } from '@/hooks/use-mobile';
import { t } from '@/lib/i18n';

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
    const [modeState, setModeState] = useState<{
        agentsActive: boolean;
        mode: RailMode;
    } | null>(null);
    const [collapsedState, setCollapsedState] = useState<{
        agentsActive: boolean;
        collapsed: boolean;
    } | null>(null);
    const [paletteOpen, setPaletteOpen] = useState(false);
    const path = (page.url.split('?')[0] ?? '/').split('#')[0] ?? '/';
    const agentsActive = path === '/agents' || path.startsWith('/agents/');
    const mode =
        modeState?.agentsActive === agentsActive
            ? modeState.mode
            : agentsActive
              ? 'agents'
              : 'menu';
    const collapsed =
        collapsedState?.agentsActive === agentsActive
            ? collapsedState.collapsed
            : false;

    function setMode(next: RailMode) {
        setModeState({ agentsActive, mode: next });

        if (next !== 'menu') {
            setCollapsedState({ agentsActive, collapsed: false });
        }
    }

    const togglePalette = useCallback(() => {
        if (isMobile) {
            return;
        }

        setPaletteOpen((current) => !current);
    }, [isMobile]);

    useCommandPaletteShortcut(togglePalette);

    function renderAgentsContent(onNavigate?: () => void) {
        return <AgentsSidebar onNavigate={onNavigate} />;
    }

    return (
        <div
            className="evo-shell flex h-dvh w-full min-w-0 overflow-hidden"
            data-collapsed={collapsed ? 'true' : 'false'}
        >
            <aside
                data-shell="production"
                className="evo-rail-slot evo-cabinet hidden h-dvh shrink-0 overflow-hidden border-e border-shell-hairline md:block"
            >
                <div className="evo-rail-panel h-full">
                    <EvoRail
                        activeHotkeys={!isMobile}
                        mode={mode}
                        onModeChange={setMode}
                        onToggleCollapsed={() =>
                            setCollapsedState({ agentsActive, collapsed: true })
                        }
                        agentsContent={renderAgentsContent()}
                    />
                </div>
            </aside>
            {showMobileSheet ? (
                <Sidebar collapsible="offcanvas">
                    <div className="evo-cabinet flex h-full min-h-0 flex-col">
                        <EvoRail
                            activeHotkeys
                            mode={mode}
                            onModeChange={setMode}
                            onNavigate={() => setOpenMobile(false)}
                            agentsContent={renderAgentsContent(() =>
                                setOpenMobile(false),
                            )}
                        />
                    </div>
                </Sidebar>
            ) : null}
            <div className="evo-workspace relative flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <button
                    type="button"
                    className="evo-rail-reopen absolute top-3 start-3 z-30 hidden size-8 place-items-center rounded-lg bg-[var(--evo-surface)] text-[var(--evo-ink)] hover:bg-[var(--evo-surface-raised)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evo-focus)] md:grid"
                    aria-label={t('Open menu')}
                    title={t('Open menu')}
                    tabIndex={collapsed ? 0 : -1}
                    aria-hidden={collapsed ? undefined : true}
                    onClick={() =>
                        setCollapsedState({ agentsActive, collapsed: false })
                    }
                >
                    <List className="size-4" weight="regular" />
                </button>
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                    {children}
                </div>
            </div>
            <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
        </div>
    );
}
