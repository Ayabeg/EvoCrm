import { Link, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import {
    SETTINGS_NAV,
    activeNavId,
    visibleSections,
} from '@/components/shell/product-nav';
import type { NavItem } from '@/components/shell/product-nav';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/evo/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useQuickRecord } from '@/ds/workspace/quick-record';
import { CaretDown, CaretLeft, CaretRight } from '@/evo/icons';
import { ShellModeSwitch } from '@/evo/shell/mode-switch';
import type { ShellMode } from '@/evo/shell/mode-switch';
import { useInitials } from '@/hooks/use-initials';
import { useSimpleMode } from '@/hooks/use-simple-mode';
import { openAskEvo } from '@/lib/ask-evo';
import {
    buildCommandCatalog,
    COMMAND_SEARCH_DEBOUNCE_MS,
    commandNeedle,
    composeCommandResults,
    filterValidRecents,
    isStaleCommandSearch,
    loadCommandRecents,
    nextCommandSearchRequestId,
    persistCommandRecents,
    rememberCommandRecent,
    visibleCommandRemoteHits,
} from '@/lib/command-os';
import type {
    CommandRecent,
    CommandResult,
    CommandSearchHit,
} from '@/lib/command-os';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { User } from '@/types/auth';

export type RailMode = ShellMode;

const rowClass =
    'evo-nav-link flex h-9 w-full items-center gap-2.5 rounded-lg px-2 text-left text-[13px] text-shell-ink-2 transition-colors duration-[var(--evo-duration-micro)] hover:bg-[var(--evo-hover)] motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evo-focus)]';

export function EvoRail({
    activeHotkeys = true,
    mode: modeProp,
    onModeChange,
    onNavigate,
    onToggleCollapsed,
    agentsContent,
}: {
    activeHotkeys?: boolean;
    mode?: RailMode;
    onModeChange?: (mode: RailMode) => void;
    onNavigate?: () => void;
    onToggleCollapsed?: () => void;
    agentsContent?: ReactNode;
}) {
    const page = usePage();
    const path = (page.url.split('?')[0] ?? '/').split('#')[0] ?? '/';
    const { simpleMode, nav, features } = useSimpleMode();
    const { openRecord } = useQuickRecord();
    const initials = useInitials();
    const user = page.props.auth?.user as User | undefined;
    const workspace = page.props.workspace as { name?: string } | null;
    const workspaceName = workspace?.name?.trim() || 'EvoCRM';
    const rawCapabilities = page.props.auth?.capabilities;
    const capabilities = useMemo(
        () =>
            Array.isArray(rawCapabilities) ? (rawCapabilities as string[]) : [],
        [rawCapabilities],
    );
    const [uncontrolledMode, setUncontrolledMode] = useState<RailMode>('menu');
    const mode = modeProp ?? uncontrolledMode;

    const setMode = useCallback(
        (next: RailMode) => {
            onModeChange?.(next);

            if (modeProp === undefined) {
                setUncontrolledMode(next);
            }
        },
        [modeProp, onModeChange],
    );
    const [query, setQuery] = useState('');
    const [remoteHits, setRemoteHits] = useState<CommandSearchHit[]>([]);
    const [hitsForQuery, setHitsForQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [cursor, setCursor] = useState(0);
    const [recents, setRecents] = useState<CommandRecent[]>(() =>
        loadCommandRecents(),
    );
    const searchRef = useRef<HTMLInputElement>(null);
    const railRef = useRef<HTMLDivElement>(null);
    const requestIdRef = useRef(0);
    const abortRef = useRef<AbortController | null>(null);
    const searchId = useId();

    const allowed = simpleMode ? new Set(nav.map((item) => item.id)) : null;
    const sections = visibleSections(simpleMode, allowed, features);
    const activeId = activeNavId(path, sections);
    const settingsActive =
        path === '/settings' || path.startsWith('/settings/');

    const catalog = useMemo(
        () => buildCommandCatalog({ capabilities, features }),
        [capabilities, features],
    );
    const availableIds = useMemo(
        () =>
            [
                ...catalog.navigate,
                ...catalog.create,
                ...catalog.act,
                ...catalog.ask,
            ].map((item) => item.id),
        [catalog],
    );
    const results = useMemo(
        () =>
            composeCommandResults({
                query,
                catalog,
                recents: filterValidRecents(recents, availableIds),
                remoteHits: visibleCommandRemoteHits({
                    query,
                    hitsForQuery,
                    remoteHits,
                }),
            }),
        [availableIds, catalog, hitsForQuery, query, recents, remoteHits],
    );

    useEffect(() => {
        if (mode === 'search' && activeHotkeys) {
            searchRef.current?.focus();
        }
    }, [activeHotkeys, mode]);

    useEffect(() => {
        if (mode !== 'search') {
            abortRef.current?.abort();

            return;
        }

        const needle = query.trim();
        abortRef.current?.abort();
        const requestId = nextCommandSearchRequestId(requestIdRef.current);
        requestIdRef.current = requestId;

        if (needle === '') {
            return;
        }

        const controller = new AbortController();
        abortRef.current = controller;
        const timer = window.setTimeout(() => {
            setSearching(true);

            void fetch(`/crm/command/search?q=${encodeURIComponent(needle)}`, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                signal: controller.signal,
            })
                .then(async (response) => {
                    if (!response.ok) {
                        throw new Error('search-failed');
                    }

                    return (await response.json()) as {
                        hits?: CommandSearchHit[];
                    };
                })
                .then((payload) => {
                    if (isStaleCommandSearch(requestIdRef.current, requestId)) {
                        return;
                    }

                    setRemoteHits(
                        Array.isArray(payload.hits) ? payload.hits : [],
                    );
                    setHitsForQuery(commandNeedle(needle));
                    setSearching(false);
                })
                .catch((error: unknown) => {
                    if (
                        error instanceof DOMException &&
                        error.name === 'AbortError'
                    ) {
                        return;
                    }

                    if (isStaleCommandSearch(requestIdRef.current, requestId)) {
                        return;
                    }

                    setRemoteHits([]);
                    setHitsForQuery(commandNeedle(needle));
                    setSearching(false);
                });
        }, COMMAND_SEARCH_DEBOUNCE_MS);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [mode, query]);

    const cursorIndex =
        results.length === 0 ? 0 : Math.min(cursor, results.length - 1);

    function selectMode(next: RailMode) {
        setMode(next);

        if (next === 'agents') {
            onNavigate?.();

            if (path !== '/agents') {
                router.visit('/agents');
            }
        }
    }

    function selectResult(result: CommandResult) {
        if (result.kind !== 'search') {
            const next = persistCommandRecents(
                rememberCommandRecent(recents, {
                    id: result.id,
                    kind: result.kind,
                }),
            );
            setRecents(next);
        }

        onNavigate?.();

        if (result.kind === 'ask') {
            openAskEvo();

            return;
        }

        if (result.recordRef) {
            openRecord(result.recordRef);

            return;
        }

        if (result.href) {
            router.visit(result.href);
        }
    }

    return (
        <div
            ref={railRef}
            className="relative flex h-full min-h-0 w-full min-w-0 flex-col bg-shell-paper"
        >
            <div className="shrink-0 px-3 pt-3">
                <ShellModeSwitch mode={mode} onModeChange={selectMode} />
            </div>

            <div className="relative min-h-0 flex-1">
                <div
                    inert={mode !== 'menu'}
                    role="tabpanel"
                    id="shell-panel-menu"
                    aria-labelledby="shell-tab-menu"
                    data-shell-mode="menu"
                    className={cn(
                        'evo-mode absolute inset-0 flex min-h-0 flex-col',
                        mode === 'menu'
                            ? 'evo-mode-on'
                            : mode === 'agents'
                              ? 'evo-mode-exit-left'
                              : 'evo-mode-off',
                    )}
                >
                    <div className="evo-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-2">
                        <div className="mt-3 flex h-10 items-center gap-2">
                            <AppLogoIcon className="size-8 shrink-0" />
                            <span className="min-w-0 flex-1 leading-tight">
                                <span className="block truncate text-[14px] font-semibold text-shell-ink">
                                    {workspaceName}
                                </span>
                                <span className="block truncate text-[12px] text-shell-muted">
                                    EvoCRM
                                </span>
                            </span>
                            {onToggleCollapsed ? (
                                <button
                                    type="button"
                                    className="grid size-8 shrink-0 place-items-center rounded-lg text-shell-muted hover:bg-[var(--evo-hover)] hover:text-shell-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evo-focus)]"
                                    aria-label="Fermer le menu"
                                    onClick={onToggleCollapsed}
                                >
                                    <CaretLeft
                                        className="size-4"
                                        weight="regular"
                                    />
                                </button>
                            ) : null}
                        </div>

                        <div className="mt-3 flex flex-col">
                            {sections.map((section) => (
                                <section
                                    key={section.id}
                                    className={
                                        section.label ? 'mt-3' : undefined
                                    }
                                >
                                    {section.label ? (
                                        <h2 className="evo-nav-section-label mb-1 border-t border-shell-hairline px-2 pt-3 text-[10px] font-semibold tracking-[0.08em] text-shell-muted uppercase">
                                            {section.label}
                                        </h2>
                                    ) : null}
                                    <ul className="flex flex-col gap-0.5">
                                        {section.items.map((item) => (
                                            <li key={item.id}>
                                                <NavGroup
                                                    item={item}
                                                    activeId={
                                                        settingsActive
                                                            ? undefined
                                                            : activeId
                                                    }
                                                    onNavigate={onNavigate}
                                                />
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            ))}
                        </div>
                    </div>
                    <footer className="shrink-0 border-t border-shell-hairline px-2 py-2">
                        <NavRow
                            item={SETTINGS_NAV}
                            active={settingsActive}
                            onNavigate={onNavigate}
                        />
                        {user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="mt-1 flex h-9 w-full items-center gap-2.5 rounded-lg px-2 text-left hover:bg-[var(--evo-hover)]"
                                        title={user.name}
                                        aria-label={t(':name account menu', {
                                            name: user.name,
                                        })}
                                    >
                                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-shell-teal text-[12px] font-semibold text-shell-pill">
                                            {initials(user.name)}
                                        </span>
                                        <span className="min-w-0 leading-tight">
                                            <span className="block truncate text-[13px] font-medium text-shell-ink">
                                                {user.name}
                                            </span>
                                            <span className="block truncate text-[12px] text-shell-muted">
                                                {user.role}
                                            </span>
                                        </span>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="start"
                                    className="w-64"
                                >
                                    <UserMenuContent user={user} />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : null}
                    </footer>
                </div>

                <div
                    inert={mode !== 'agents'}
                    role="tabpanel"
                    id="shell-panel-agents"
                    aria-labelledby="shell-tab-agents"
                    data-shell-mode="agents"
                    className={cn(
                        'evo-mode absolute inset-0 flex min-h-0 flex-col',
                        mode === 'agents' ? 'evo-mode-on' : 'evo-mode-off',
                    )}
                >
                    {agentsContent}
                </div>

                <div
                    inert={mode !== 'search'}
                    role="tabpanel"
                    id="shell-panel-search"
                    aria-labelledby="shell-tab-search"
                    data-shell-mode="search"
                    className={cn(
                        'evo-mode absolute inset-0 flex min-h-0 flex-col',
                        mode === 'search' ? 'evo-mode-on' : 'evo-mode-off',
                    )}
                >
                    <div className="evo-search-in flex min-h-0 flex-1 flex-col px-3 py-3">
                        <label className="sr-only" htmlFor={searchId}>
                            {t('Search EvoCRM…')}
                        </label>
                        <input
                            ref={searchRef}
                            id={searchId}
                            value={query}
                            data-chrome="search"
                            data-command-trigger="search"
                            aria-label={t('Search EvoCRM…')}
                            onChange={(event) => {
                                setQuery(event.target.value);
                                setCursor(0);
                            }}
                            onKeyDown={(event) => {
                                if (event.key === 'ArrowDown') {
                                    event.preventDefault();
                                    setCursor((current) =>
                                        Math.min(
                                            current + 1,
                                            Math.max(results.length - 1, 0),
                                        ),
                                    );
                                }

                                if (event.key === 'ArrowUp') {
                                    event.preventDefault();
                                    setCursor((current) =>
                                        Math.max(current - 1, 0),
                                    );
                                }

                                if (
                                    event.key === 'Enter' &&
                                    results[cursorIndex]
                                ) {
                                    event.preventDefault();
                                    selectResult(results[cursorIndex]);
                                }
                            }}
                            placeholder={t('Search EvoCRM…')}
                            className="app-search-trigger h-10 w-full rounded-lg border border-shell-hairline bg-shell-pill px-2.5 text-[14px] text-shell-ink outline-none placeholder:text-shell-faint focus:border-[var(--evo-teal-line)]"
                            type="search"
                        />
                        <span className="sr-only">⌘K</span>
                        <ul className="evo-scroll mt-2 min-h-0 flex-1 overflow-y-auto">
                            {searching && commandNeedle(query) !== '' ? (
                                <li className="py-2 text-[14px] text-shell-muted">
                                    {t('Searching…')}
                                </li>
                            ) : null}
                            {results.length === 0 && !searching ? (
                                <li className="py-2 text-[14px] text-shell-muted">
                                    {t('Nothing.')}
                                </li>
                            ) : (
                                results.map((result, index) => (
                                    <li key={result.id}>
                                        <button
                                            type="button"
                                            className={cn(
                                                'w-full rounded-lg px-1 py-2 text-left',
                                                index === cursorIndex &&
                                                    'bg-[var(--evo-teal-soft)]',
                                            )}
                                            onMouseEnter={() =>
                                                setCursor(index)
                                            }
                                            onClick={() => selectResult(result)}
                                        >
                                            <span className="block text-[11px] font-semibold tracking-[0.06em] text-shell-muted uppercase">
                                                {t(result.kind)}
                                            </span>
                                            <span className="block truncate text-[14px] font-medium text-shell-ink">
                                                {t(result.label)}
                                            </span>
                                            {result.description ? (
                                                <span className="block truncate text-[12px] text-shell-muted">
                                                    {t(result.description)}
                                                </span>
                                            ) : null}
                                        </button>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

function NavRow({
    item,
    active,
    onNavigate,
}: {
    item: NavItem;
    active: boolean;
    onNavigate?: () => void;
}) {
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            prefetch
            aria-current={active ? 'page' : undefined}
            aria-label={item.label}
            className={cn(rowClass, active && 'font-medium')}
            onClick={onNavigate}
        >
            <Icon className="size-5 shrink-0" weight="regular" />
            <span
                className="evo-nav-label min-w-0 flex-1 truncate"
                data-active={active ? 'true' : 'false'}
            >
                {item.label}
            </span>
        </Link>
    );
}

function NavGroup({
    item,
    activeId,
    onNavigate,
}: {
    item: NavItem;
    activeId?: string;
    onNavigate?: () => void;
}) {
    const childActive =
        item.children?.some((child) => child.id === activeId) ?? false;
    const [opened, setOpened] = useState(false);
    const open = opened || childActive;

    if (!item.children?.length) {
        return (
            <NavRow
                item={item}
                active={activeId === item.id}
                onNavigate={onNavigate}
            />
        );
    }

    return (
        <div>
            <div className="flex items-center">
                <NavRow
                    item={item}
                    active={activeId === item.id}
                    onNavigate={onNavigate}
                />
                <button
                    type="button"
                    className="grid size-7 shrink-0 place-items-center rounded-lg text-shell-muted hover:bg-[var(--evo-hover)] hover:text-shell-ink"
                    aria-expanded={open}
                    aria-label={
                        open ? `Replier ${item.label}` : `Ouvrir ${item.label}`
                    }
                    onClick={() => setOpened((current) => !current)}
                >
                    {open ? (
                        <CaretDown className="size-3.5" />
                    ) : (
                        <CaretRight className="size-3.5" />
                    )}
                </button>
            </div>
            {open ? (
                <ul className="mt-0.5 flex flex-col gap-0.5">
                    {item.children.map((child) => (
                        <li key={child.id}>
                            <Link
                                href={child.href}
                                prefetch
                                aria-current={
                                    activeId === child.id ? 'page' : undefined
                                }
                                className={cn(
                                    'evo-nav-link flex h-8 items-center rounded-lg pr-2 pl-9 text-left text-[12px] text-shell-ink-2 hover:bg-[var(--evo-hover)]',
                                    activeId === child.id && 'font-medium',
                                )}
                                onClick={onNavigate}
                            >
                                <span className="truncate">{child.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    );
}
