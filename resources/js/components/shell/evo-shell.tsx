import { router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { EvoRail } from '@/components/shell/evo-rail';
import { GlobalHeader } from '@/components/shell/global-header';
import {
    RAIL_EXPAND_MIN,
    readSidebarCookie,
    writeSidebarCookie,
} from '@/components/shell/rail-state';
import { Sidebar, useSidebar } from '@/components/ui/sidebar';
import {
    CommandPalette,
    useCommandPaletteShortcut,
} from '@/evo/patterns/command-palette';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSimpleMode } from '@/hooks/use-simple-mode';
import { openAskEvo } from '@/lib/ask-evo';
import { t } from '@/lib/i18n';

function subscribeViewportWidth(onStoreChange: () => void) {
    window.addEventListener('resize', onStoreChange);

    return () => window.removeEventListener('resize', onStoreChange);
}

function getViewportWidth(): number {
    return window.innerWidth;
}

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

function isTypingTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    const tag = target.tagName;

    return (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target.isContentEditable
    );
}

const GO_TO: Record<string, string> = {
    a: '/dashboard',
    c: '/crm/contacts',
    d: '/crm/deals',
    i: '/inbox',
    v: '/crm/quotes',
    p: '/settings/profile',
};

export function EvoShell({ children }: { children: ReactNode }) {
    const page = usePage();
    const isMobile = useIsMobile();
    const { setOpenMobile, openMobile } = useSidebar();
    const { features, simpleMode } = useSimpleMode();
    const hydrated = useShellHydrated();
    const showMobileSheet = hydrated && isMobile;
    const sidebarOpen = Boolean(page.props.sidebarOpen);
    // document.cookie is missing during SSR. Inertia sidebarOpen is the
    // server-read sidebar_state — seed first paint from that so a stored
    // collapse does not snap 224→56 after hydrate.
    const cookie = hydrated ? readSidebarCookie() : null;
    const viewportWidth = useSyncExternalStore(
        subscribeViewportWidth,
        getViewportWidth,
        () => 0,
    );
    const [pinnedCollapsed, setPinnedCollapsed] = useState(() => !sidebarOpen);
    const [railMode, setRailMode] = useState<'auto' | 'pinned'>(() =>
        sidebarOpen ? 'auto' : 'pinned',
    );
    const collapsed = !hydrated
        ? !sidebarOpen
        : railMode === 'pinned'
          ? pinnedCollapsed
          : cookie !== null
            ? !cookie
            : viewportWidth < RAIL_EXPAND_MIN;
    const resolvedRailMode =
        !hydrated
            ? sidebarOpen
                ? 'auto'
                : 'pinned'
            : cookie !== null || railMode === 'pinned'
              ? 'pinned'
              : 'auto';
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [shortcutsOpen, setShortcutsOpen] = useState(false);
    const path = (page.url.split('?')[0] ?? '/').split('#')[0] ?? '/';
    const inboxActive = path === '/inbox' || path.startsWith('/inbox/');

    const setRailCollapsed = useCallback((next: boolean) => {
        setRailMode('pinned');
        setPinnedCollapsed(next);
        writeSidebarCookie(!next);
    }, []);

    const togglePalette = useCallback(() => {
        if (isMobile) {
            return;
        }

        setPaletteOpen((current) => !current);
    }, [isMobile]);

    useCommandPaletteShortcut(togglePalette);

    useEffect(() => {
        const openShortcuts = () => setShortcutsOpen(true);
        window.addEventListener('openEvoShortcuts', openShortcuts);

        return () => window.removeEventListener('openEvoShortcuts', openShortcuts);
    }, []);

    useEffect(() => {
        if (!isMobile || !openMobile) {
            return;
        }

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setOpenMobile(false);
            }
        }

        window.addEventListener('keydown', onKeyDown);

        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isMobile, openMobile, setOpenMobile]);

    useEffect(() => {
        let pendingGo = false;
        let goTimer = 0;

        function onKeyDown(event: KeyboardEvent) {
            if (isTypingTarget(event.target)) {
                return;
            }

            if (event.key === 'Escape' && shortcutsOpen) {
                event.preventDefault();
                setShortcutsOpen(false);

                return;
            }

            if (
                (event.key === '\\' || event.code === 'Backslash') &&
                (event.metaKey || event.ctrlKey)
            ) {
                event.preventDefault();

                if (!isMobile) {
                    setRailCollapsed(!collapsed);
                }

                return;
            }

            if (
                (event.key === 'j' || event.key === 'J') &&
                (event.metaKey || event.ctrlKey)
            ) {
                if (!features.ask_evo || simpleMode) {
                    return;
                }

                event.preventDefault();
                openAskEvo();

                return;
            }

            if (event.key === '?' && !event.metaKey && !event.ctrlKey && !event.altKey) {
                event.preventDefault();
                setShortcutsOpen(true);

                return;
            }

            if (
                (event.key === 'c' || event.key === 'C') &&
                !event.metaKey &&
                !event.ctrlKey &&
                !event.altKey
            ) {
                event.preventDefault();
                window.dispatchEvent(new Event('openEvoCreate'));

                return;
            }

            if (pendingGo) {
                pendingGo = false;
                window.clearTimeout(goTimer);
                const key = event.key.toLowerCase();

                if (key === 'n') {
                    event.preventDefault();
                    window.dispatchEvent(new Event('openEvoTasks'));

                    return;
                }

                if (key === 'g' && !simpleMode) {
                    event.preventDefault();
                    router.visit('/agents');

                    return;
                }

                const href = GO_TO[key];

                if (href) {
                    event.preventDefault();
                    router.visit(href);
                }

                return;
            }

            if (
                (event.key === 'g' || event.key === 'G') &&
                !event.metaKey &&
                !event.ctrlKey &&
                !event.altKey
            ) {
                pendingGo = true;
                goTimer = window.setTimeout(() => {
                    pendingGo = false;
                }, 800);
            }
        }

        window.addEventListener('keydown', onKeyDown);

        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.clearTimeout(goTimer);
        };
    }, [
        collapsed,
        features.ask_evo,
        isMobile,
        setRailCollapsed,
        shortcutsOpen,
        simpleMode,
    ]);

    return (
        <div
            className="evo-shell flex h-dvh w-full min-w-0 overflow-hidden"
            data-collapsed={collapsed ? 'true' : 'false'}
            data-rail={resolvedRailMode}
            data-inbox-rail={inboxActive ? 'hook' : undefined}
        >
            <aside
                data-shell="production"
                data-slot="sidebar"
                data-sidebar="sidebar"
                className="evo-rail-slot hidden h-dvh shrink-0 overflow-hidden min-[769px]:block"
            >
                <div className="evo-rail-panel h-full">
                    <EvoRail
                        collapsed={collapsed}
                        onToggleCollapsed={() => setRailCollapsed(!collapsed)}
                        onOpenPalette={() => setPaletteOpen(true)}
                    />
                </div>
            </aside>
            {showMobileSheet ? (
                <Sidebar
                    collapsible="offcanvas"
                    className="evo-mobile-drawer"
                >
                    <div className="flex h-full min-h-0 flex-col">
                        <EvoRail
                            onOpenPalette={() => {
                                setOpenMobile(false);
                                setPaletteOpen(true);
                            }}
                            onNavigate={() => setOpenMobile(false)}
                        />
                    </div>
                </Sidebar>
            ) : null}
            <div className="evo-workspace relative flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <GlobalHeader />
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                    {children}
                </div>
            </div>
            <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
            {shortcutsOpen ? (
                <div className="fixed inset-0 z-[var(--evo-z-modal)]">
                    <button
                        type="button"
                        className="absolute inset-0 bg-[color-mix(in_srgb,var(--evo-ink)_45%,transparent)]"
                        aria-label={t('Close')}
                        onClick={() => setShortcutsOpen(false)}
                    />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label={t('Shortcuts')}
                        className="absolute inset-inline-0 top-[18vh] mx-auto w-[min(400px,calc(100vw-2rem))] rounded-[var(--evo-radius-floating)] border border-[var(--evo-hairline)] bg-[var(--evo-surface)] p-4 text-[13px] text-[var(--evo-ink)] shadow-[var(--evo-shadow-modal)]"
                    >
                        <h2 className="mb-3 text-[14px] font-medium">
                            {t('Shortcuts')}
                        </h2>
                        <ul className="grid gap-1.5 text-[var(--evo-ink-secondary)]">
                            <li>⌘K — {t('Search')}</li>
                            <li>C — {t('Create')}</li>
                            <li>⌘\ — {t('Collapse sidebar')}</li>
                            <li>G then A — {t('nav.home')}</li>
                            <li>G then C — {t('nav.crm.contacts')}</li>
                            <li>G then D — {t('nav.deals.title')}</li>
                            <li>G then I — {t('nav.inbox')}</li>
                            <li>G then V — {t('nav.quotes.title')}</li>
                            <li>G then P — {t('Profile')}</li>
                            <li>G then N — {t('Tasks')}</li>
                            {!simpleMode ? (
                                <li>G then G — {t('nav.agents')}</li>
                            ) : null}
                            {features.ask_evo && !simpleMode ? (
                                <li>⌘J — {t('Ask Evo')}</li>
                            ) : null}
                        </ul>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
