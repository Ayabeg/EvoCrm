import { router, usePage } from '@inertiajs/react';
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
} from '@phosphor-icons/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
    CommandPalette as AuroraCommandPalette,
} from '@/components/aurora/command-palette';
import type { CommandItem } from '@/components/aurora/command-palette';
import { useQuickRecord } from '@/ds/workspace/quick-record';
import { useSimpleMode } from '@/hooks/use-simple-mode';
import {
    COMMAND_SEARCH_DEBOUNCE_MS,
    buildCommandCatalog,
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
import type { CommandRecent, CommandResult, CommandSearchHit } from '@/lib/command-os';

const SECTIONS = [
    { id: 'recent', label: 'Recent' },
    { id: 'search', label: 'Search' },
    { id: 'create', label: 'Create' },
    { id: 'act', label: 'Act' },
    { id: 'ask', label: 'Ask Evo' },
    { id: 'navigate', label: 'Navigate' },
];

const ICONS: Record<string, ReactNode> = {
    'nav-home': <House className="size-3.5" weight="regular" aria-hidden />,
    'nav-contacts': <AddressBook className="size-3.5" weight="regular" aria-hidden />,
    'nav-companies': <Buildings className="size-3.5" weight="regular" aria-hidden />,
    'nav-leads': <Path className="size-3.5" weight="regular" aria-hidden />,
    'nav-deals': <Handshake className="size-3.5" weight="regular" aria-hidden />,
    'nav-pipeline': <SquaresFour className="size-3.5" weight="regular" aria-hidden />,
    'nav-inbox': <Tray className="size-3.5" weight="regular" aria-hidden />,
    'nav-activities': <CheckSquare className="size-3.5" weight="regular" aria-hidden />,
    'nav-quotes': <FileText className="size-3.5" weight="regular" aria-hidden />,
    'nav-automation': <FlowArrow className="size-3.5" weight="regular" aria-hidden />,
    'nav-settings': <GearSix className="size-3.5" weight="regular" aria-hidden />,
    'act-overdue': <WarningCircle className="size-3.5" weight="regular" aria-hidden />,
    'act-today': <CalendarBlank className="size-3.5" weight="regular" aria-hidden />,
    'act-upcoming': <CalendarBlank className="size-3.5" weight="regular" aria-hidden />,
    'act-completed': <CheckSquare className="size-3.5" weight="regular" aria-hidden />,
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
        if (result.recordRef?.type === 'company' || result.description === 'company') {
            return <Buildings className="size-3.5" weight="regular" aria-hidden />;
        }

        if (result.recordRef?.type === 'deal' || result.description === 'deal') {
            return <Handshake className="size-3.5" weight="regular" aria-hidden />;
        }

        if (result.recordRef?.type === 'lead' || result.description === 'lead') {
            return <Path className="size-3.5" weight="regular" aria-hidden />;
        }

        if (result.recordRef?.type === 'quote' || result.description === 'quote') {
            return <FileText className="size-3.5" weight="regular" aria-hidden />;
        }

        if (result.description === 'activity') {
            return <CheckSquare className="size-3.5" weight="regular" aria-hidden />;
        }

        return <AddressBook className="size-3.5" weight="regular" aria-hidden />;
    }

    if (result.kind === 'ask') {
        return <Sparkle className="size-3.5" weight="regular" aria-hidden />;
    }

    return <ChatCircle className="size-3.5" weight="regular" aria-hidden />;
}

function toCommandItem(result: CommandResult): CommandItem {
    return {
        id: result.id,
        label: result.label,
        description: result.description,
        section: result.section,
        icon: resultIcon(result),
        onSelect: () => {
            // Selection is handled by the wrapper so kind stays authoritative.
        },
    };
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
    const { features } = useSimpleMode();
    const rawCapabilities = page.props.auth?.capabilities;
    const openerRef = useRef<HTMLElement | null>(null);
    const requestIdRef = useRef(0);
    const abortRef = useRef<AbortController | null>(null);
    const [query, setQuery] = useState('');
    const [remoteHits, setRemoteHits] = useState<CommandSearchHit[]>([]);
    const [hitsForQuery, setHitsForQuery] = useState('');
    const [searchFailed, setSearchFailed] = useState(false);
    const [searching, setSearching] = useState(false);
    const [recents, setRecents] = useState<CommandRecent[]>(() => loadCommandRecents());

    const catalog = useMemo(
        () =>
            buildCommandCatalog({
                capabilities: (Array.isArray(rawCapabilities) ? rawCapabilities : []) as string[],
                features,
            }),
        [features, rawCapabilities],
    );

    const availableIds = useMemo(
        () => [
            ...catalog.navigate,
            ...catalog.create,
            ...catalog.act,
            ...catalog.ask,
        ].map((item) => item.id),
        [catalog],
    );

    const results = useMemo(() => {
        return composeCommandResults({
            query,
            catalog,
            recents: filterValidRecents(recents, availableIds),
            remoteHits: visibleCommandRemoteHits({
                query,
                hitsForQuery,
                remoteHits,
            }),
        });
    }, [availableIds, catalog, hitsForQuery, query, recents, remoteHits]);

    useEffect(() => {
        if (open) {
            openerRef.current =
                document.activeElement instanceof HTMLElement
                    ? document.activeElement
                    : null;

            return;
        }

        abortRef.current?.abort();

        const opener = openerRef.current;
        openerRef.current = null;

        if (
            opener &&
            opener.dataset.commandTrigger !== 'search' &&
            typeof opener.focus === 'function'
        ) {
            window.setTimeout(() => opener.focus(), 0);
        }
    }, [open]);

    useEffect(() => {
        if (!open) {
            abortRef.current?.abort();

            return;
        }

        const needle = query.trim();
        abortRef.current?.abort();
        setRemoteHits([]);
        setHitsForQuery('');
        setSearchFailed(false);

        if (needle === '') {
            requestIdRef.current = nextCommandSearchRequestId(requestIdRef.current);
            setSearching(false);

            return;
        }

        const requestId = nextCommandSearchRequestId(requestIdRef.current);
        requestIdRef.current = requestId;
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

                    return (await response.json()) as { hits?: CommandSearchHit[] };
                })
                .then((payload) => {
                    if (isStaleCommandSearch(requestIdRef.current, requestId)) {
                        return;
                    }

                    setRemoteHits(Array.isArray(payload.hits) ? payload.hits : []);
                    setHitsForQuery(commandNeedle(needle));
                    setSearchFailed(false);
                    setSearching(false);
                })
                .catch((error: unknown) => {
                    if (error instanceof DOMException && error.name === 'AbortError') {
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

    const items = useMemo(() => results.map(toCommandItem), [results]);

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            setQuery('');
            setRemoteHits([]);
            setHitsForQuery('');
            setSearchFailed(false);
            setSearching(false);
            abortRef.current?.abort();
        }

        onOpenChange(next);
    };

    const handleSelect = (item: CommandItem) => {
        const result = results.find((entry) => entry.id === item.id);

        if (!result) {
            return;
        }

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

        if (result.recordRef) {
            openRecord(result.recordRef);

            return;
        }

        if (result.href) {
            router.visit(result.href);
        }
    };

    const statusText = searching
        ? 'Searching…'
        : searchFailed
          ? 'Search unavailable — navigate, create, and actions still work'
          : undefined;

    return (
        <AuroraCommandPalette
            open={open}
            onOpenChange={handleOpenChange}
            items={items}
            sections={SECTIONS}
            query={query}
            onQueryChange={setQuery}
            placeholder="Search, navigate, create, or act"
            statusText={statusText}
            filter={() => 1}
            onSelect={handleSelect}
        />
    );
}

export function useCommandPaletteShortcut(onToggle: () => void) {
    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            if (event.isComposing || event.keyCode === 229) {
                return;
            }

            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                onToggle();
            }
        };
        window.addEventListener('keydown', handler);

        return () => window.removeEventListener('keydown', handler);
    }, [onToggle]);
}
