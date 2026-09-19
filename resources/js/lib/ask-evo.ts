export const ASK_EVO_OPEN_EVENT = 'open-ask-evo';

export const ASK_EVO_PAGES = [
    'workspace',
    'dashboard',
    'activation',
    'contact',
    'company',
    'deal',
    'quote',
    'inbox',
    'activity',
    'automation',
    'qrd',
] as const;

export type AskEvoPage = (typeof ASK_EVO_PAGES)[number];

export type AskEvoIdentity = {
    page: AskEvoPage;
    entityType?: string | null;
    entityId?: number | null;
};

export type AskEvoSuggestion = {
    id: string;
    label: string;
    question: string;
};

export type AskEvoAction = {
    id: string;
    label: string;
    href: string;
};

export type AskEvoContextPayload = {
    kind: string;
    label: string;
    scope_key: string;
    entity_type?: string | null;
    entity_id?: number | null;
    suggestions: AskEvoSuggestion[];
    actions: AskEvoAction[];
    grounding_note?: string;
    unavailable_code?: string | null;
    note?: string | null;
};

export type AskEvoErrorCode =
    | 'unavailable'
    | 'timeout'
    | 'rate_limit'
    | 'unauthorized'
    | 'stale'
    | 'empty'
    | 'forbidden';

export type AskEvoError = {
    code: AskEvoErrorCode | string;
    message: string;
};

export type AskEvoAskResponse = {
    ok: boolean;
    answer?: string | null;
    source?: string;
    context?: AskEvoContextPayload;
    error?: AskEvoError | null;
};

export function isAskEvoPage(value: string): value is AskEvoPage {
    return (ASK_EVO_PAGES as readonly string[]).includes(value);
}

export function askEvoScopeKey(identity: AskEvoIdentity): string {
    if (identity.entityType && identity.entityId) {
        return `${identity.entityType}:${identity.entityId}`;
    }

    return identity.page;
}

export function shouldResetAskEvoScope(previous: string | null, next: string): boolean {
    return previous !== null && previous !== next;
}

export function askEvoErrorMessage(error: AskEvoError | null | undefined): string {
    if (!error) {
        return 'Ask Evo is unavailable.';
    }

    if (error.message) {
        return error.message;
    }

    switch (error.code) {
        case 'timeout':
            return 'Ask Evo timed out. Try again.';
        case 'rate_limit':
            return 'Ask Evo is rate limited. Try again in a minute.';
        case 'unauthorized':
        case 'forbidden':
            return 'This context is not available.';
        case 'stale':
            return 'Context changed. Ask again on the current record.';
        case 'empty':
            return 'Nothing is available to answer from.';
        default:
            return 'Ask Evo is unavailable.';
    }
}

export function parseAskEvoIdentityFromUrl(
    url: string,
    qrd?: { type: string; id: number } | null,
): AskEvoIdentity {
    if (qrd && ['contact', 'company', 'deal', 'quote'].includes(qrd.type)) {
        return {
            page: 'qrd',
            entityType: qrd.type,
            entityId: qrd.id,
        };
    }

    const parsed = new URL(url, 'https://evocrm.local');
    const path = parsed.pathname;
    const thread = Number(parsed.searchParams.get('thread') ?? '');
    const workflow = Number(parsed.searchParams.get('workflow') ?? parsed.searchParams.get('history_workflow_id') ?? '');
    const activity = Number(parsed.searchParams.get('activity') ?? '');

    const record = path.match(/^\/crm\/(contacts|companies|deals|quotes)\/(\d+)/);

    if (record) {
        const map: Record<string, AskEvoPage> = {
            contacts: 'contact',
            companies: 'company',
            deals: 'deal',
            quotes: 'quote',
        };
        const page = map[record[1]];

        return {
            page,
            entityType: page,
            entityId: Number(record[2]),
        };
    }

    if (path === '/dashboard') {
        return { page: 'dashboard' };
    }

    if (path === '/inbox' || path === '/conversations') {
        return thread > 0
            ? { page: 'inbox', entityType: 'inbox_conversation', entityId: thread }
            : { page: 'inbox' };
    }

    if (path.startsWith('/crm/activities')) {
        return activity > 0
            ? { page: 'activity', entityType: 'activity', entityId: activity }
            : { page: 'activity' };
    }

    if (path.startsWith('/crm/workflows') || path === '/automation') {
        return workflow > 0
            ? { page: 'automation', entityType: 'automation', entityId: workflow }
            : { page: 'automation' };
    }

    return { page: 'workspace' };
}

export function csrfToken(): string {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

export function askEvoHeaders(): HeadersInit {
    return {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': csrfToken(),
    };
}

export function openAskEvo(identity?: AskEvoIdentity): void {
    window.dispatchEvent(new CustomEvent(ASK_EVO_OPEN_EVENT, { detail: identity ?? null }));
}

export function contextIndicatorLabel(context: AskEvoContextPayload | null | undefined, fallback = 'Workspace'): string {
    if (context?.label) {
        return context.label;
    }

    return fallback;
}
