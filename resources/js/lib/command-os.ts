import type { RecordType } from '@/ds/workspace/quick-record/types';
import {
    activityQueueHref,
    parseActivityQueueSearch,
} from '@/lib/activity-work-queue';

export const COMMAND_SEARCH_DEBOUNCE_MS = 180;
export const COMMAND_SEARCH_PER_TYPE = 6;
export const COMMAND_SEARCH_MAX_TOTAL = 30;
export const COMMAND_RECENTS_LIMIT = 5;
export const COMMAND_RECENTS_STORAGE_KEY = 'evo:command-os:recents';

export const COMMAND_KINDS = ['search', 'navigate', 'create', 'act', 'ask'] as const;

export type CommandKind = (typeof COMMAND_KINDS)[number];

export type CommandRecordRef = {
    type: RecordType;
    id: number;
};

export type CommandResult = {
    id: string;
    kind: CommandKind;
    label: string;
    section: string;
    href?: string;
    recordRef?: CommandRecordRef;
    action?: string;
    description?: string;
    keywords?: string;
};

export type CommandSearchHit = {
    type: string;
    id: number;
    label: string;
    href: string;
    recordRef?: CommandRecordRef | null;
};

export type CommandRecent = {
    id: string;
    kind: Exclude<CommandKind, 'search'>;
};

export type CommandCatalog = {
    navigate: CommandResult[];
    create: CommandResult[];
    act: CommandResult[];
    ask: CommandResult[];
};

export type CommandFeatures = {
    tickets?: boolean;
    ask_evo?: boolean;
    ads?: boolean;
    report_builder?: boolean;
    warmup?: boolean;
};

const RECORD_TYPES: readonly RecordType[] = [
    'contact',
    'company',
    'lead',
    'deal',
    'quote',
];

export function isCommandKind(value: unknown): value is CommandKind {
    return typeof value === 'string' && (COMMAND_KINDS as readonly string[]).includes(value);
}

export function isCommandRecordType(value: unknown): value is RecordType {
    return typeof value === 'string' && (RECORD_TYPES as readonly string[]).includes(value);
}

export function commandNeedle(query: string): string {
    return query.trim().toLowerCase();
}

export function matchesCommandQuery(query: string, result: CommandResult): boolean {
    const needle = commandNeedle(query);

    if (needle === '') {
        return true;
    }

    const hay = [result.label, result.description ?? '', result.keywords ?? '']
        .join(' ')
        .toLowerCase();

    return hay.includes(needle);
}

export function scoreCommandResult(query: string, result: CommandResult): number {
    const needle = commandNeedle(query);

    if (needle === '') {
        return 1;
    }

    const label = result.label.toLowerCase();

    if (label === needle) {
        return 3;
    }

    if (label.startsWith(needle)) {
        return 2;
    }

    return matchesCommandQuery(query, result) ? 1 : 0;
}

export function nextCommandSearchRequestId(current: number): number {
    return current + 1;
}

export function isStaleCommandSearch(current: number, requestId: number): boolean {
    return requestId !== current;
}

export const COMMAND_FOCUS_OPEN_SUPPRESS_MS = 400;

export function visibleCommandRemoteHits(input: {
    query: string;
    hitsForQuery?: string | null;
    remoteHits?: CommandSearchHit[];
}): CommandSearchHit[] {
    const needle = commandNeedle(input.query);

    if (needle === '') {
        return [];
    }

    if (commandNeedle(input.hitsForQuery ?? '') !== needle) {
        return [];
    }

    return input.remoteHits ?? [];
}

export const COMMAND_OS_ROOT_SELECTOR = '[data-command="os"]';

export function isCommandOsOpen(
    root: { querySelector?: (selector: string) => unknown } | null | undefined,
): boolean {
    return typeof root?.querySelector === 'function' && root.querySelector(COMMAND_OS_ROOT_SELECTOR) != null;
}

export function handleQuickRecordEscapeKeyDown(
    event: { preventDefault: () => void },
    root: { querySelector?: (selector: string) => unknown } | null | undefined,
): boolean {
    if (!isCommandOsOpen(root)) {
        return false;
    }

    event.preventDefault();

    return true;
}

export function shouldOpenCommandFromSearchFocus(suppressFocusOpen: boolean): boolean {
    return !suppressFocusOpen;
}

export function handleCommandEscapeKey(event: {
    key: string;
    preventDefault: () => void;
    stopPropagation: () => void;
}): boolean {
    if (event.key !== 'Escape') {
        return false;
    }

    event.preventDefault();
    event.stopPropagation();

    return true;
}

export function isCommandCommitKey(event: {
    key: string;
    isComposing?: boolean;
    nativeEvent?: { isComposing?: boolean };
    keyCode?: number;
}): boolean {
    if (event.key !== 'Enter') {
        return false;
    }

    if (event.isComposing || event.nativeEvent?.isComposing) {
        return false;
    }

    return event.keyCode !== 229;
}

export function commandActivityQueueHref(
    group: 'overdue' | 'today' | 'upcoming' | 'completed',
): string {
    return activityQueueHref(
        parseActivityQueueSearch({
            group,
        }),
    );
}

export function canCreateCrm(capabilities: readonly string[]): boolean {
    return capabilities.includes('crm.edit');
}

export function isAskEvoEnabled(features: CommandFeatures | null | undefined): boolean {
    return features?.ask_evo !== false;
}

export function commandSearchHitsToResults(hits: CommandSearchHit[]): CommandResult[] {
    return hits.map((hit) => {
        const recordRef =
            hit.recordRef && isCommandRecordType(hit.recordRef.type)
                ? { type: hit.recordRef.type, id: hit.recordRef.id }
                : undefined;

        return {
            id: `search:${hit.type}:${hit.id}`,
            kind: 'search',
            label: hit.label,
            section: 'search',
            href: hit.href,
            recordRef,
            description: hit.type,
        };
    });
}

export function rememberCommandRecent(
    recents: CommandRecent[],
    entry: { id: string; kind: CommandKind },
    limit = COMMAND_RECENTS_LIMIT,
): CommandRecent[] {
    if (entry.kind === 'search') {
        return recents;
    }

    const recent: CommandRecent = {
        id: entry.id,
        kind: entry.kind,
    };

    return [recent, ...recents.filter((item) => item.id !== recent.id)].slice(0, limit);
}

export function filterValidRecents(
    recents: CommandRecent[],
    availableIds: Iterable<string>,
): CommandRecent[] {
    const allowed = new Set(availableIds);

    return recents.filter((recent) => allowed.has(recent.id));
}

export function parseStoredRecents(value: unknown): CommandRecent[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.flatMap((entry) => {
        if (!entry || typeof entry !== 'object') {
            return [];
        }

        const id = 'id' in entry ? entry.id : null;
        const kind = 'kind' in entry ? entry.kind : null;

        if (typeof id !== 'string' || !isCommandKind(kind) || kind === 'search') {
            return [];
        }

        return [{ id, kind }];
    });
}

export function loadCommandRecents(): CommandRecent[] {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const raw = window.localStorage.getItem(COMMAND_RECENTS_STORAGE_KEY);

        return parseStoredRecents(raw ? JSON.parse(raw) : []);
    } catch {
        return [];
    }
}

export function persistCommandRecents(recents: CommandRecent[]): CommandRecent[] {
    if (typeof window === 'undefined') {
        return recents;
    }

    try {
        window.localStorage.setItem(
            COMMAND_RECENTS_STORAGE_KEY,
            JSON.stringify(recents.map(({ id, kind }) => ({ id, kind }))),
        );
    } catch {
        // Private mode or quota — recents stay in-memory only.
    }

    return recents;
}

type NavigateDef = {
    id: string;
    label: string;
    href: string;
    keywords: string;
    feature?: keyof CommandFeatures;
};

const REQUIRED_NAVIGATE: NavigateDef[] = [
    {
        id: 'nav-home',
        label: 'Home',
        href: '/dashboard',
        keywords: 'dashboard command center',
    },
    {
        id: 'nav-contacts',
        label: 'Contacts',
        href: '/crm/contacts',
        keywords: 'crm people',
    },
    {
        id: 'nav-companies',
        label: 'Companies',
        href: '/crm/companies',
        keywords: 'accounts organizations',
    },
    {
        id: 'nav-leads',
        label: 'Leads',
        href: '/crm/leads',
        keywords: 'pipeline prospects',
    },
    {
        id: 'nav-deals',
        label: 'Deals',
        href: '/crm/deals',
        keywords: 'pipeline opportunities',
    },
    {
        id: 'nav-pipeline',
        label: 'Pipeline',
        href: '/crm/deals/board',
        keywords: 'kanban board stages',
    },
    {
        id: 'nav-inbox',
        label: 'Inbox',
        href: '/inbox',
        keywords: 'desk conversations evodesk',
    },
    {
        id: 'nav-activities',
        label: 'Activities',
        href: '/crm/activities',
        keywords: 'tasks calls meetings queue',
    },
    {
        id: 'nav-quotes',
        label: 'Quotes',
        href: '/crm/quotes',
        keywords: 'proposals pricing',
    },
    {
        id: 'nav-automation',
        label: 'Automation',
        href: '/crm/workflows',
        keywords: 'workflows triggers',
    },
    {
        id: 'nav-settings',
        label: 'Settings',
        href: '/settings',
        keywords: 'workspace preferences',
    },
];

const OPERATOR_NAVIGATE: NavigateDef[] = [
    {
        id: 'nav-tickets',
        label: 'Tickets',
        href: '/crm/tickets',
        keywords: 'help desk support cases',
        feature: 'tickets',
    },
    {
        id: 'nav-captures',
        label: 'Captures',
        href: '/crm/leads/captures',
        keywords: 'inbox capture csv meta maps url',
    },
    {
        id: 'nav-segments',
        label: 'Segments',
        href: '/crm/segments',
        keywords: 'saved views audiences filters',
    },
    {
        id: 'nav-conversations',
        label: 'Conversations',
        href: '/conversations',
        keywords: 'history threads',
    },
    {
        id: 'nav-outbound',
        label: 'Outbound',
        href: '/outbound',
        keywords: 'email sequences campaigns',
    },
    {
        id: 'nav-ads',
        label: 'Ads',
        href: '/ads',
        keywords: 'meta facebook instagram',
        feature: 'ads',
    },
    {
        id: 'nav-reports',
        label: 'Reports',
        href: '/reports',
        keywords: 'analytics overview',
    },
    {
        id: 'nav-report-builder',
        label: 'Report builder',
        href: '/crm/report-builder',
        keywords: 'custom reports saved',
        feature: 'report_builder',
    },
];

function toNavigateResult(item: NavigateDef): CommandResult {
    return {
        id: item.id,
        kind: 'navigate',
        label: item.label,
        section: 'navigate',
        href: item.href,
        keywords: item.keywords,
        description: 'Navigate',
    };
}

export function commandNavigateItems(features: CommandFeatures | null | undefined): CommandResult[] {
    const extras = OPERATOR_NAVIGATE.filter((item) => {
        if (!item.feature) {
            return true;
        }

        return features?.[item.feature] !== false;
    });

    return [...REQUIRED_NAVIGATE, ...extras].map(toNavigateResult);
}

export function commandCreateItems(capabilities: readonly string[]): CommandResult[] {
    if (!canCreateCrm(capabilities)) {
        return [];
    }

    return [
        {
            id: 'create-contact',
            kind: 'create',
            label: 'Create contact',
            section: 'create',
            href: '/crm/contacts?create=1',
            action: 'create-contact',
            keywords: 'new person',
            description: 'Existing create drawer',
        },
        {
            id: 'create-company',
            kind: 'create',
            label: 'Create company',
            section: 'create',
            href: '/crm/companies?create=1',
            action: 'create-company',
            keywords: 'new account organization',
            description: 'Existing create drawer',
        },
        {
            id: 'create-deal',
            kind: 'create',
            label: 'Create deal',
            section: 'create',
            href: '/crm/deals?create=1',
            action: 'create-deal',
            keywords: 'new opportunity',
            description: 'Existing create drawer',
        },
        {
            id: 'create-quote',
            kind: 'create',
            label: 'Create quote',
            section: 'create',
            href: '/crm/quotes?create=1',
            action: 'create-quote',
            keywords: 'new proposal',
            description: 'Existing create drawer',
        },
        {
            id: 'create-activity',
            kind: 'create',
            label: 'Log activity',
            section: 'create',
            href: activityQueueHref(
                parseActivityQueueSearch({
                    create: '1',
                }),
            ),
            action: 'create-activity',
            keywords: 'new task call meeting note',
            description: 'P15 composer',
        },
    ];
}

export function commandActItems(): CommandResult[] {
    return (
        [
            ['overdue', 'Overdue activities', 'p15 overdue queue'],
            ['today', "Today's activities", 'p15 today queue'],
            ['upcoming', 'Upcoming activities', 'p15 upcoming queue'],
            ['completed', 'Completed activities', 'p15 completed queue'],
        ] as const
    ).map(([group, label, keywords]) => ({
        id: `act-${group}`,
        kind: 'act' as const,
        label,
        section: 'act',
        href: commandActivityQueueHref(group),
        action: `p15-${group}`,
        keywords,
        description: 'P15 work queue',
    }));
}

export function commandAskItems(features: CommandFeatures | null | undefined): CommandResult[] {
    if (!isAskEvoEnabled(features)) {
        return [];
    }

    return [
        {
            id: 'ask-evo',
            kind: 'ask',
            label: 'Ask Evo',
            section: 'ask',
            action: 'ask-evo-seam',
            keywords: 'ai sparkle assistant',
            description: 'Open from a record — no answer here',
        },
    ];
}

export function buildCommandCatalog(input: {
    capabilities: readonly string[];
    features?: CommandFeatures | null;
}): CommandCatalog {
    return {
        navigate: commandNavigateItems(input.features),
        create: commandCreateItems(input.capabilities),
        act: commandActItems(),
        ask: commandAskItems(input.features),
    };
}

export function catalogById(catalog: CommandCatalog): Map<string, CommandResult> {
    return new Map(
        [...catalog.navigate, ...catalog.create, ...catalog.act, ...catalog.ask].map((item) => [
            item.id,
            item,
        ]),
    );
}

export function composeCommandResults(input: {
    query: string;
    catalog: CommandCatalog;
    recents?: CommandRecent[];
    remoteHits?: CommandSearchHit[];
}): CommandResult[] {
    const needle = commandNeedle(input.query);
    const index = catalogById(input.catalog);
    const search = commandSearchHitsToResults(input.remoteHits ?? []);

    if (needle === '') {
        const recents = filterValidRecents(input.recents ?? [], index.keys()).flatMap((recent) => {
            const item = index.get(recent.id);

            return item ? [{ ...item, section: 'recent' }] : [];
        });

        return [
            ...recents,
            ...input.catalog.create,
            ...input.catalog.act,
            ...input.catalog.ask,
            ...input.catalog.navigate,
        ];
    }

    const local = [
        ...input.catalog.create,
        ...input.catalog.act,
        ...input.catalog.ask,
        ...input.catalog.navigate,
    ]
        .map((item) => ({ item, score: scoreCommandResult(input.query, item) }))
        .filter((entry) => entry.score > 0)
        .sort((left, right) => right.score - left.score)
        .map((entry) => entry.item);

    return [...search, ...local];
}

export function commandResultKind(result: CommandResult): CommandKind {
    return result.kind;
}
