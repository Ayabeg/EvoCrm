/**
 * CommandPalette — one product command surface (cmdk).
 *
 * Source: shadcn/ui command (cmdk). License: MIT.
 * Files: resources/js/evo/patterns/command-palette/index.tsx
 * Does not import Aurora Dialog or `components/aurora/command-palette`.
 */
import { router, usePage } from '@inertiajs/react';
import { Command } from 'cmdk';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import { useQuickRecord } from '@/ds/workspace/quick-record';
import {
    AddressBook,
    Buildings,
    CalendarBlank,
    ChatCircle,
    CheckSquare,
    FileText,
    FlowArrow,
    GearSix,
    Handshake,
    House,
    Path,
    Plus,
    Sparkle,
    SquaresFour,
    Tray,
    WarningCircle,
} from '@/evo/icons';
import { useSimpleMode } from '@/hooks/use-simple-mode';
import { restoreFocus, trapTabKey } from '@/lib/a11y';
import { openAskEvo } from '@/lib/ask-evo';
import {
    COMMAND_SEARCH_DEBOUNCE_MS,
    buildCommandCatalog,
    commandNeedle,
    composeCommandResults,
    filterValidRecents,
    handleCommandEscapeKey,
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

const SECTION_LABELS: Record<string, string> = {
    recent: 'Recent',
    search: 'Search',
    create: 'Create',
    act: 'Act',
    ask: 'Ask Evo',
    navigate: 'Navigate',
};

const SECTION_ORDER = [
    'recent',
    'search',
    'create',
    'act',
    'ask',
    'navigate',
] as const;

const ICONS: Record<string, ReactNode> = {
    'nav-home': <House className="size-3.5" weight="regular" aria-hidden />,
    'nav-contacts': (
        <AddressBook className="size-3.5" weight="regular" aria-hidden />
    ),
    'nav-companies': (
        <Buildings className="size-3.5" weight="regular" aria-hidden />
    ),
    'nav-leads': <Path className="size-3.5" weight="regular" aria-hidden />,
    'nav-deals': <Handshake className="size-3.5" weight="regular" aria-hidden />,
    'nav-pipeline': (
        <SquaresFour className="size-3.5" weight="regular" aria-hidden />
    ),
    'nav-inbox': <Tray className="size-3.5" weight="regular" aria-hidden />,
    'nav-activities': (
        <CheckSquare className="size-3.5" weight="regular" aria-hidden />
    ),
    'nav-quotes': <FileText className="size-3.5" weight="regular" aria-hidden />,
    'nav-automation': (
        <FlowArrow className="size-3.5" weight="regular" aria-hidden />
    ),
    'nav-settings': (
        <GearSix className="size-3.5" weight="regular" aria-hidden />
    ),
    'act-overdue': (
        <WarningCircle className="size-3.5" weight="regular" aria-hidden />
    ),
    'act-today': (
        <CalendarBlank className="size-3.5" weight="regular" aria-hidden />
    ),
    'act-upcoming': (
        <CalendarBlank className="size-3.5" weight="regular" aria-hidden />
    ),
    'act-completed': (
        <CheckSquare className="size-3.5" weight="regular" aria-hidden />
    ),
    'ask-evo': <Sparkle className="size-3.5" weight="regular" aria-hidden />,
};

function resultIcon(result: CommandResult): ReactNode {
    if (ICONS[result.id]) {
        return ICONS[result.id];
    }

    if (result.kind === 'create') {
        return <Plus className="size-3.5" weight="regular" aria-hidden />;
    }

    if (result.kind === 'search') {
        if (
            result.recordRef?.type === 'company' ||
            result.description === 'company'
        ) {
            return (
                <Buildings className="size-3.5" weight="regular" aria-hidden />
            );
        }

        if (
            result.recordRef?.type === 'deal' ||
            result.description === 'deal'
        ) {
            return (
                <Handshake className="size-3.5" weight="regular" aria-hidden />
            );
        }

        if (
            result.recordRef?.type === 'lead' ||
            result.description === 'lead'
        ) {
            return <Path className="size-3.5" weight="regular" aria-hidden />;
        }

        if (
            result.recordRef?.type === 'quote' ||
            result.description === 'quote'
        ) {
            return (
                <FileText className="size-3.5" weight="regular" aria-hidden />
            );
        }

        if (result.description === 'activity') {
            return (
                <CheckSquare
                    className="size-3.5"
                    weight="regular"
                    aria-hidden
                />
            );
        }

        return (
            <AddressBook className="size-3.5" weight="regular" aria-hidden />
        );
    }

    if (result.kind === 'ask') {
        return <Sparkle className="size-3.5" weight="regular" aria-hidden />;
    }

    return <ChatCircle className="size-3.5" weight="regular" aria-hidden />;
}

export function CommandPalette({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const page = usePage();
    const { openRecord } = useQuickRecord();
    const { features, simpleMode, nav } = useSimpleMode();
    const rawCapabilities = page.props.auth?.capabilities;
    const openerRef = useRef<HTMLElement | null>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    const requestIdRef = useRef(0);
    const abortRef = useRef<AbortController | null>(null);
    const [query, setQuery] = useState('');
    const [remoteHits, setRemoteHits] = useState<CommandSearchHit[]>([]);
    const [hitsForQuery, setHitsForQuery] = useState('');
    const [searchFailed, setSearchFailed] = useState(false);
    const [searching, setSearching] = useState(false);
    const [recents, setRecents] = useState<CommandRecent[]>(() =>
        loadCommandRecents(),
    );

    const catalog = useMemo(
        () =>
            buildCommandCatalog({
                capabilities: (Array.isArray(rawCapabilities)
                    ? rawCapabilities
                    : []) as string[],
                features,
                simpleMode,
                allowedHrefs: simpleMode
                    ? nav.map((item) => item.href)
                    : undefined,
            }),
        [features, rawCapabilities, simpleMode, nav],
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
        if (open) {
            openerRef.current =
                document.activeElement instanceof HTMLElement
                    ? document.activeElement
                    : null;

            return;
        }

        abortRef.current?.abort();
        restoreFocus(openerRef.current);
        openerRef.current = null;
    }, [open]);

    useEffect(() => {
        if (!open) {
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
                    setSearchFailed(false);
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
                    setSearchFailed(true);
                    setSearching(false);
                });
        }, COMMAND_SEARCH_DEBOUNCE_MS);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [open, query]);

    const handleOpenChange = useCallback(
        (next: boolean) => {
            if (!next) {
                setQuery('');
                setRemoteHits([]);
                setHitsForQuery('');
                setSearchFailed(false);
                setSearching(false);
                abortRef.current?.abort();
            }

            onOpenChange(next);
        },
        [onOpenChange],
    );

    useEffect(() => {
        if (!open) {
            return;
        }

        function onWindowKeyDown(event: KeyboardEvent) {
            if (handleCommandEscapeKey(event)) {
                handleOpenChange(false);
            }
        }

        window.addEventListener('keydown', onWindowKeyDown, true);

        return () => {
            window.removeEventListener('keydown', onWindowKeyDown, true);
        };
    }, [handleOpenChange, open]);

    const handleSelect = (result: CommandResult) => {
        if (result.kind !== 'search') {
            const next = persistCommandRecents(
                rememberCommandRecent(recents, {
                    id: result.id,
                    kind: result.kind,
                }),
            );
            setRecents(next);
        }

        handleOpenChange(false);

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
    };

    const needle = commandNeedle(query);
    const hitsMatchCurrent = commandNeedle(hitsForQuery) === needle;
    const statusText =
        needle === ''
            ? undefined
            : searchFailed && hitsMatchCurrent
              ? t('Search unavailable — navigation, create, and actions stay available')
              : searching
                ? t('Searching…')
                : undefined;

    const grouped = SECTION_ORDER.map((section) => ({
        id: section,
        label: t(SECTION_LABELS[section] ?? section),
        items: results.filter((result) => result.section === section),
    })).filter((group) => group.items.length > 0);

    function onDialogKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
        if (handleCommandEscapeKey(event)) {
            handleOpenChange(false);

            return;
        }

        if (dialogRef.current) {
            trapTabKey(event, dialogRef.current);
        }
    }

    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[var(--evo-z-command)]">
            <button
                type="button"
                data-command="backdrop"
                className="absolute inset-0 bg-[color-mix(in_srgb,var(--evo-ink)_45%,transparent)]"
                aria-label={t('Close the command palette')}
                onClick={() => handleOpenChange(false)}
            />
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label={t('Command palette')}
                data-command="os"
                data-a11y="focus-trap"
                className="absolute inset-inline-0 top-[18vh] mx-auto w-[min(640px,calc(100vw-2rem))] overflow-hidden rounded-[12px] border border-[var(--evo-hairline)] bg-[var(--evo-surface)] text-[var(--evo-ink)] shadow-[var(--evo-shadow-modal)]"
                onKeyDown={onDialogKeyDown}
            >
                <Command
                    label={t('Command palette')}
                    shouldFilter={false}
                    className="flex max-h-[min(28rem,60vh)] flex-col"
                    loop
                >
                    <Command.Input
                        value={query}
                        onValueChange={(next) => {
                            requestIdRef.current =
                                nextCommandSearchRequestId(
                                    requestIdRef.current,
                                );
                            abortRef.current?.abort();
                            setQuery(next);
                            setRemoteHits([]);
                            setHitsForQuery('');
                        }}
                        placeholder={t('Search, navigate, create or act')}
                        aria-label={t('Search commands')}
                        className="h-11 w-full border-b border-[var(--evo-hairline)] bg-transparent px-4 text-[14px] text-[var(--evo-ink)] outline-none placeholder:text-[var(--evo-ink-muted)]"
                    />
                    {statusText ? (
                        <p
                            className="border-b border-[var(--evo-hairline)] px-4 py-2 text-[12px] text-[var(--evo-ink-muted)]"
                            aria-live="polite"
                        >
                            {statusText}
                        </p>
                    ) : null}
                    <Command.List className="evo-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-1.5">
                        <Command.Empty className="px-3 py-6 text-[13px] text-[var(--evo-ink-muted)]">
                            {t('No commands.')}
                        </Command.Empty>
                        {grouped.map((group) => (
                            <Command.Group
                                key={group.id}
                                heading={group.label}
                                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-[0.06em] [&_[cmdk-group-heading]]:text-[var(--evo-ink-muted)] [&_[cmdk-group-heading]]:uppercase"
                            >
                                {group.items.map((result) => (
                                    <Command.Item
                                        key={result.id}
                                        value={result.id}
                                        onSelect={() => handleSelect(result)}
                                        className={cn(
                                            'flex cursor-pointer items-center gap-2 rounded-[8px] px-2 py-2 text-[13px]',
                                            'data-[selected=true]:bg-[var(--evo-teal-soft)] data-[selected=true]:text-[var(--evo-ink)]',
                                            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evo-focus)]',
                                        )}
                                    >
                                        <span className="text-[var(--evo-ink-muted)]">
                                            {resultIcon(result)}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate font-medium">
                                                {result.label}
                                            </span>
                                            {result.description ? (
                                                <span className="block truncate text-[12px] text-[var(--evo-ink-muted)]">
                                                    {result.description}
                                                </span>
                                            ) : null}
                                        </span>
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        ))}
                    </Command.List>
                </Command>
            </div>
        </div>
    );
}

export function useCommandPaletteShortcut(onToggle: () => void) {
    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            if (event.isComposing || event.keyCode === 229) {
                return;
            }

            if (
                (event.metaKey || event.ctrlKey) &&
                event.key.toLowerCase() === 'k'
            ) {
                event.preventDefault();
                onToggle();
            }
        };
        window.addEventListener('keydown', handler);

        return () => window.removeEventListener('keydown', handler);
    }, [onToggle]);
}
