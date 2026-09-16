export const ACTIVITY_QUEUE_PATH = '/crm/activities';

export const ACTIVITY_QUEUE_SCOPES = ['mine', 'all'] as const;

export const ACTIVITY_QUEUE_GROUPS = [
    'overdue',
    'today',
    'upcoming',
    'unscheduled',
    'completed',
] as const;

export const ACTIVITY_QUEUE_TYPES = [
    'note',
    'task',
    'call',
    'meeting',
    'email',
] as const;

export type ActivityQueueScope = (typeof ACTIVITY_QUEUE_SCOPES)[number];
export type ActivityQueueGroup = (typeof ACTIVITY_QUEUE_GROUPS)[number];
export type ActivityQueueType = (typeof ACTIVITY_QUEUE_TYPES)[number];

export type ActivityQueueRelated = {
    type: 'deal' | 'contact' | 'company' | string;
    id: number;
    label: string;
};

export type ActivityQueueItem = {
    id: number;
    type: string;
    subject: string;
    due_at?: string | null;
    completed_at?: string | null;
    done: boolean;
    group: ActivityQueueGroup | string;
    owner?: { id: number; name: string } | null;
    related: ActivityQueueRelated[];
    meta?: { attendance?: string | null } | null;
    can_complete: boolean;
};

export type ActivityQueueSection = {
    key: ActivityQueueGroup | string;
    label: string;
    count: number;
    items: ActivityQueueItem[];
    has_more: boolean;
};

export type ActivityQueueFilters = {
    scope: ActivityQueueScope | string;
    group: ActivityQueueGroup | string | null;
    type: ActivityQueueType | string | null;
    owner_id: number | null;
    page: number;
    create: boolean;
};

export type ActivityQueuePayload = {
    groups: Record<string, ActivityQueueSection>;
    counts: {
        overdue: number;
        today: number;
        upcoming: number;
        unscheduled: number;
        completed: number;
        open: number;
        total: number;
    };
    paginator: {
        page: number;
        last_page: number;
        per_page: number;
        has_more: boolean;
    };
};

export type ActivityQueueSearch = {
    scope: ActivityQueueScope;
    group: ActivityQueueGroup | null;
    type: ActivityQueueType | null;
    owner_id: number | null;
    page: number;
    create: boolean;
};

export function normalizeActivityQueueScope(value: unknown): ActivityQueueScope {
    return value === 'all' ? 'all' : 'mine';
}

export function normalizeActivityQueueGroup(value: unknown): ActivityQueueGroup | null {
    return typeof value === 'string' &&
        (ACTIVITY_QUEUE_GROUPS as readonly string[]).includes(value)
        ? (value as ActivityQueueGroup)
        : null;
}

export function normalizeActivityQueueType(value: unknown): ActivityQueueType | null {
    return typeof value === 'string' &&
        (ACTIVITY_QUEUE_TYPES as readonly string[]).includes(value)
        ? (value as ActivityQueueType)
        : null;
}

export function parseActivityQueueSearch(
    input: Record<string, unknown> | URLSearchParams | string,
): ActivityQueueSearch {
    const params =
        typeof input === 'string'
            ? new URLSearchParams(input.startsWith('?') ? input.slice(1) : input)
            : input instanceof URLSearchParams
              ? input
              : new URLSearchParams(
                    Object.entries(input).flatMap(([key, value]) => {
                        if (value === null || value === undefined || value === '') {
                            return [];
                        }

                        return [[key, String(value)]];
                    }),
                );

    const date = params.get('date');
    const group =
        normalizeActivityQueueGroup(params.get('group')) ??
        (date === 'overdue' || date === 'today' ? date : null);

    const ownerRaw = params.get('owner_id');
    const ownerId = ownerRaw ? Number(ownerRaw) : null;
    const pageRaw = params.get('page');
    const page = pageRaw ? Number(pageRaw) : 1;

    return {
        scope: normalizeActivityQueueScope(params.get('scope')),
        group,
        type: normalizeActivityQueueType(params.get('type')),
        owner_id: Number.isFinite(ownerId) && ownerId ? ownerId : null,
        page: Number.isFinite(page) && page > 1 ? page : 1,
        create: params.get('create') === '1',
    };
}

export function activityQueueSearchParams(search: ActivityQueueSearch): Record<string, string> {
    const params: Record<string, string> = {};

    if (search.scope !== 'mine') {
        params.scope = search.scope;
    }

    if (search.group) {
        params.group = search.group;
    }

    if (search.type) {
        params.type = search.type;
    }

    if (search.scope === 'all' && search.owner_id) {
        params.owner_id = String(search.owner_id);
    }

    if (search.page > 1) {
        params.page = String(search.page);
    }

    if (search.create) {
        params.create = '1';
    }

    return params;
}

export function activityQueueHref(search: ActivityQueueSearch): string {
    const params = new URLSearchParams(activityQueueSearchParams(search));
    const query = params.toString();

    return query === '' ? ACTIVITY_QUEUE_PATH : `${ACTIVITY_QUEUE_PATH}?${query}`;
}

export function patchActivityQueueSearch(
    current: ActivityQueueSearch,
    patch: Partial<ActivityQueueSearch>,
): ActivityQueueSearch {
    const next: ActivityQueueSearch = {
        ...current,
        ...patch,
        page: patch.page ?? 1,
    };

    if (next.scope === 'mine') {
        next.owner_id = null;
    }

    return next;
}

export function requestedActivityQueueGroup(url: string): ActivityQueueGroup | null {
    const query = url.includes('?') ? url.slice(url.indexOf('?') + 1) : '';

    return parseActivityQueueSearch(query).group;
}

export function activityQueueMatchesRequest(
    payloadGroup: string | null | undefined,
    requestedGroup: string | null | undefined,
): boolean {
    const payload = payloadGroup ?? null;
    const requested = requestedGroup ?? null;

    return payload === requested;
}

export function isStaleActivityQueueVisit(current: number, requestId: number): boolean {
    return requestId !== current;
}

export function shouldRenderActivityQueue(input: {
    payloadGroup: string | null | undefined;
    requestedGroup: string | null | undefined;
    pending: boolean;
}): boolean {
    if (input.pending) {
        return false;
    }

    return activityQueueMatchesRequest(input.payloadGroup, input.requestedGroup);
}
