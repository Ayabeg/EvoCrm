import type { DealAttention } from '@/lib/deal-attention';

export type InboxCrmEmpty = 'no_thread' | 'no_contact' | 'restricted' | 'error' | null;

export type InboxCrmOwner = {
    id: number;
    name: string;
    label: 'Contact owner' | 'Deal owner' | string;
};

export type InboxCrmActivitySummary = {
    id: number | null;
    type: string;
    subject: string;
    at?: string | null;
    deal_id?: number | null;
    done?: boolean;
};

export type InboxCrmDeal = {
    id: number;
    title: string;
    amount_cents: number;
    currency: string;
    stage: {
        id: number | null;
        name: string | null;
        slug: string | null;
        is_won: boolean;
        is_lost: boolean;
    };
    owner: InboxCrmOwner | null;
    associations: Array<{ type: string; id: number; label: string }>;
    is_open: boolean;
    is_won: boolean;
    is_lost: boolean;
    next_activity: InboxCrmActivitySummary | null;
    attention: DealAttention | null;
    href: string;
};

export type InboxCrmContextPayload = {
    thread_id: number | null;
    empty: InboxCrmEmpty;
    contact: {
        id: number;
        name: string;
        email?: string | null;
        phone?: string | null;
        owner: InboxCrmOwner | null;
        href: string;
    } | null;
    company: { id: number; name: string; href: string } | null;
    primary_deal_id: number | null;
    deals: InboxCrmDeal[];
    attention: DealAttention | null;
    last_activity: InboxCrmActivitySummary | null;
    next_activity: InboxCrmActivitySummary | null;
    tasks: InboxCrmActivitySummary[];
    notes: InboxCrmActivitySummary[];
    capabilities: {
        can_create_activity: boolean;
        can_peek: boolean;
        can_open_contact: boolean;
    };
};

export function inboxCrmContextMatchesRequest(
    contextThreadId: number | null | undefined,
    requestedThreadId: number | null | undefined,
): boolean {
    return (
        contextThreadId != null &&
        requestedThreadId != null &&
        contextThreadId === requestedThreadId
    );
}

export function shouldRenderInboxCrmContext(input: {
    contextThreadId?: number | null;
    requestedThreadId?: number | null;
    selectedId?: number | null;
}): boolean {
    return (
        inboxCrmContextMatchesRequest(input.contextThreadId, input.requestedThreadId) &&
        inboxCrmContextMatchesRequest(input.contextThreadId, input.selectedId)
    );
}

export function delayedContextIsStale(
    liveThreadId: number,
    incomingThreadId: number,
): boolean {
    return liveThreadId !== incomingThreadId;
}

export function resolveAuthoritativePrimaryDealId(input: {
    conversationDealId?: number | null;
    visibleDealIds: number[];
}): number | null {
    const id = input.conversationDealId ?? null;

    if (id == null) {
        return null;
    }

    return input.visibleDealIds.includes(id) ? id : null;
}

export function pickPrimaryDealFromList(
    deals: Array<{ id: number; amount_cents?: number }>,
): null {
    void deals;

    return null;
}

export function resolveInspectedDealId(input: {
    primaryDealId: number | null;
    inspectedDealId: number | null;
    visibleDealIds: number[];
}): number | null {
    if (
        input.inspectedDealId != null &&
        input.visibleDealIds.includes(input.inspectedDealId)
    ) {
        return input.inspectedDealId;
    }

    if (
        input.primaryDealId != null &&
        input.visibleDealIds.includes(input.primaryDealId)
    ) {
        return input.primaryDealId;
    }

    return null;
}

export function sortInboxContextDeals<T extends { id: number; is_open: boolean }>(
    deals: T[],
): T[] {
    return [...deals].sort((left, right) => {
        if (left.is_open !== right.is_open) {
            return left.is_open ? -1 : 1;
        }

        return left.id - right.id;
    });
}

export function focusedDealAttention(
    context: InboxCrmContextPayload,
    focusedDealId: number | null,
): DealAttention | null {
    if (focusedDealId == null) {
        return context.attention;
    }

    return context.deals.find((deal) => deal.id === focusedDealId)?.attention ?? null;
}

export function focusedDealNextActivity(
    context: InboxCrmContextPayload,
    focusedDealId: number | null,
): InboxCrmActivitySummary | null {
    if (focusedDealId == null) {
        return context.next_activity;
    }

    return (
        context.deals.find((deal) => deal.id === focusedDealId)?.next_activity ??
        null
    );
}
