/**
 * Test-only P14 inbox CRM context proofs. Never import from an Inertia page.
 */
import {
    delayedContextIsStale,
    focusedDealAttention,
    inboxCrmContextMatchesRequest,
    pickPrimaryDealFromList,
    resolveAuthoritativePrimaryDealId,
    resolveInspectedDealId,
    shouldRenderInboxCrmContext,
    sortInboxContextDeals,
} from '../../resources/js/lib/inbox-crm-context';
import type { InboxCrmContextPayload } from '../../resources/js/lib/inbox-crm-context';

function expectEqual<T>(actual: T, expected: T, label: string): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

expectEqual(
    resolveAuthoritativePrimaryDealId({ conversationDealId: null, visibleDealIds: [9, 2, 5] }),
    null,
    'no conversation deal is not first/latest/highest',
);
expectEqual(
    pickPrimaryDealFromList([{ id: 9, amount_cents: 9_000_000 }, { id: 2, amount_cents: 100 }]),
    null,
    'list never invents a primary deal',
);
expectEqual(
    resolveAuthoritativePrimaryDealId({ conversationDealId: 2, visibleDealIds: [9, 2, 5] }),
    2,
    'ticket deal is primary when visible',
);
expectEqual(
    resolveAuthoritativePrimaryDealId({ conversationDealId: 7, visibleDealIds: [9, 2, 5] }),
    null,
    'unvisible conversation deal is not primary',
);

expectEqual(
    resolveInspectedDealId({ primaryDealId: null, inspectedDealId: 5, visibleDealIds: [9, 2, 5] }),
    5,
    'local inspect does not persist a fake primary',
);
expectEqual(
    resolveInspectedDealId({ primaryDealId: 2, inspectedDealId: null, visibleDealIds: [9, 2, 5] }),
    2,
    'authoritative primary is used when inspect is empty',
);
expectEqual(
    resolveInspectedDealId({ primaryDealId: 2, inspectedDealId: 88, visibleDealIds: [9, 2, 5] }),
    2,
    'stale inspect id is ignored',
);

const sorted = sortInboxContextDeals([
    { id: 4, is_open: false },
    { id: 1, is_open: true },
    { id: 8, is_open: false },
    { id: 3, is_open: true },
]);
expectEqual(
    sorted.map((deal) => deal.id),
    [1, 3, 4, 8],
    'open deals before closed, then id — not amount',
);

expectEqual(inboxCrmContextMatchesRequest(3, 3), true, 'matching context thread');
expectEqual(inboxCrmContextMatchesRequest(1, 3), false, 'stale context thread');
expectEqual(delayedContextIsStale(3, 1), true, 'delayed A is stale under C');
expectEqual(delayedContextIsStale(3, 3), false, 'live C is current');

expectEqual(
    shouldRenderInboxCrmContext({ contextThreadId: 1, requestedThreadId: 3, selectedId: 3 }),
    false,
    'rapid A→B→C drops delayed A context',
);
expectEqual(
    shouldRenderInboxCrmContext({ contextThreadId: 2, requestedThreadId: 3, selectedId: 1 }),
    false,
    'B context cannot render while C is requested and A is still selected',
);
expectEqual(
    shouldRenderInboxCrmContext({ contextThreadId: 3, requestedThreadId: 3, selectedId: 3 }),
    true,
    'C context renders only for thread C',
);

const payload = {
    thread_id: 3,
    empty: null,
    contact: null,
    company: null,
    primary_deal_id: null,
    deals: [
        {
            id: 9,
            title: 'Alpha',
            attention: { primary: { type: 'no_next_action', severity: 'warning', label: 'No next action' } },
        },
        {
            id: 2,
            title: 'Beta',
            attention: { primary: { type: 'overdue_activity', severity: 'critical', label: 'Overdue activity' } },
        },
    ],
    attention: null,
} as unknown as InboxCrmContextPayload;

expectEqual(
    focusedDealAttention(payload, null)?.primary?.label ?? null,
    null,
    'no fake primary attention from the first deal',
);
expectEqual(
    focusedDealAttention(payload, 2)?.primary?.type ?? null,
    'overdue_activity',
    'inspect uses that deal attention without recomputing',
);

if (shouldRenderInboxCrmContext({ contextThreadId: 1, requestedThreadId: 3, selectedId: 3 })) {
    throw new Error('MERGE BLOCKER: stale A context rendered under C');
}
