/**
 * Test-only P16 Command OS proofs. Never import from an Inertia page.
 */
import { activityQueueHref, parseActivityQueueSearch } from '../../resources/js/lib/activity-work-queue';
import {
    buildCommandCatalog,
    commandActivityQueueHref,
    commandNeedle,
    commandResultKind,
    commandSearchHitsToResults,
    composeCommandResults,
    filterValidRecents,
    handleCommandEscapeKey,
    isCommandCommitKey,
    isStaleCommandSearch,
    matchesCommandQuery,
    nextCommandSearchRequestId,
    parseStoredRecents,
    rememberCommandRecent,
    scoreCommandResult,
    shouldOpenCommandFromSearchFocus,
    visibleCommandRemoteHits,
} from '../../resources/js/lib/command-os';

function expectEqual<T>(actual: T, expected: T, label: string): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

function expectTrue(value: boolean, label: string): void {
    if (!value) {
        throw new Error(label);
    }
}

const catalog = buildCommandCatalog({
    capabilities: ['crm.view', 'crm.edit'],
    features: {
        tickets: true,
        ask_evo: true,
        ads: true,
        report_builder: true,
    },
});

expectEqual(commandNeedle('  Acme  '), 'acme', 'needle trims and lowercases');

expectTrue(
    catalog.navigate.some((item) => item.href === '/dashboard' && item.label === 'Home'),
    'Home navigates to /dashboard',
);
expectTrue(
    catalog.navigate.every((item) => item.href !== '/home'),
    'no /home navigate href',
);
expectTrue(
    ['/crm/contacts', '/crm/companies', '/crm/leads', '/crm/deals', '/crm/deals/board', '/inbox', '/crm/activities', '/crm/quotes', '/crm/workflows', '/settings']
        .every((href) => catalog.navigate.some((item) => item.href === href)),
    'required navigate routes are present',
);

expectEqual(
    catalog.create.map((item) => item.href),
    [
        '/crm/contacts?create=1',
        '/crm/companies?create=1',
        '/crm/deals?create=1',
        '/crm/quotes?create=1',
        '/crm/activities?create=1',
    ],
    'create reuses existing entry URLs',
);

expectEqual(
    commandActivityQueueHref('overdue'),
    activityQueueHref(parseActivityQueueSearch({ group: 'overdue' })),
    'Overdue uses the P15 query contract',
);
expectEqual(
    commandActivityQueueHref('today'),
    '/crm/activities?group=today',
    'Today is a P15 group URL',
);
expectEqual(
    commandActivityQueueHref('upcoming'),
    '/crm/activities?group=upcoming',
    'Upcoming is a P15 group URL',
);
expectEqual(
    commandActivityQueueHref('completed'),
    '/crm/activities?group=completed',
    'Completed is a P15 group URL',
);

expectTrue(
    catalog.act.every((item) => item.href?.startsWith('/crm/activities')),
    'Act items only navigate to the P15 queue',
);

const viewOnly = buildCommandCatalog({
    capabilities: ['crm.view'],
    features: { ask_evo: true },
});
expectEqual(viewOnly.create.length, 0, 'create is hidden without crm.edit');

const simpleAsk = buildCommandCatalog({
    capabilities: ['crm.edit'],
    features: { ask_evo: false, tickets: false, ads: false, report_builder: false },
});
expectEqual(simpleAsk.ask.length, 0, 'Ask Evo is gated');
expectTrue(
    simpleAsk.navigate.every((item) => !['/crm/tickets', '/ads', '/crm/report-builder'].includes(item.href)),
    'feature-gated navigate items stay hidden',
);

const empty = composeCommandResults({
    query: '',
    catalog,
    recents: [],
});
expectTrue(empty.length > 0, 'empty query is not a white box');
expectTrue(
    empty.some((item) => item.kind === 'navigate') &&
        empty.some((item) => item.kind === 'create') &&
        empty.some((item) => item.kind === 'act'),
    'empty query shows quick actions and navigate',
);
expectTrue(
    empty.every((item) => item.kind !== 'search'),
    'empty query does not invent record hits',
);

const recents = rememberCommandRecent(
    rememberCommandRecent([], { id: 'nav-contacts', kind: 'navigate' }),
    { id: 'create-deal', kind: 'create' },
);
expectEqual(
    recents.map((recent) => recent.id),
    ['create-deal', 'nav-contacts'],
    'recents are identifiers only and newest first',
);
expectEqual(
    rememberCommandRecent(recents, { id: 'search:contact:1', kind: 'search' }),
    recents,
    'record payloads are not stored as recents',
);
expectEqual(
    filterValidRecents(
        [{ id: 'nav-contacts', kind: 'navigate' }, { id: 'gone', kind: 'navigate' }],
        ['nav-contacts'],
    ).map((recent) => recent.id),
    ['nav-contacts'],
    'revoked recents drop',
);
expectEqual(
    parseStoredRecents([
        { id: 'nav-home', kind: 'navigate', email: 'amine@acme.test', amount: 99 },
        { id: 'leak', kind: 'search' },
        { label: 'Amine', email: 'amine@acme.test' },
    ]),
    [{ id: 'nav-home', kind: 'navigate' }],
    'stored recents keep identifiers and drop record payloads',
);

const composedRecents = composeCommandResults({
    query: '',
    catalog,
    recents: [{ id: 'nav-contacts', kind: 'navigate' }],
});
expectEqual(composedRecents[0]?.id, 'nav-contacts', 'truthful recent leads the empty list');
expectEqual(composedRecents[0]?.section, 'recent', 'recent section is a display seam');

const race = nextCommandSearchRequestId(1);
expectEqual(race, 2, 'search request ids increment');
expectEqual(isStaleCommandSearch(3, 2), true, 'a→am→ami is stale once acme is current');
expectEqual(isStaleCommandSearch(3, 3), false, 'final acme request wins');

const amineHits = [
    {
        type: 'contact',
        id: 11,
        label: 'Amine Benali',
        href: '/crm/contacts/11',
        recordRef: { type: 'contact' as const, id: 11 },
    },
];
const acmeHits = [
    {
        type: 'company',
        id: 4,
        label: 'Acme',
        href: '/crm/companies/4',
        recordRef: { type: 'company' as const, id: 4 },
    },
];
expectEqual(
    visibleCommandRemoteHits({
        query: 'acme',
        hitsForQuery: 'ami',
        remoteHits: amineHits,
    }),
    [],
    'amine hits are ignored once the needle is already acme',
);
expectEqual(
    visibleCommandRemoteHits({
        query: 'acme',
        hitsForQuery: 'acme',
        remoteHits: acmeHits,
    }).map((hit) => hit.label),
    ['Acme'],
    'acme hits render only for the matching needle',
);
expectEqual(
    visibleCommandRemoteHits({
        query: '',
        hitsForQuery: 'ami',
        remoteHits: amineHits,
    }),
    [],
    'empty query never shows stale records',
);

const staleDisplayed = composeCommandResults({
    query: 'acme',
    catalog,
    remoteHits: visibleCommandRemoteHits({
        query: 'acme',
        hitsForQuery: 'ami',
        remoteHits: amineHits,
    }),
});
expectTrue(
    staleDisplayed.every((item) => item.kind !== 'search'),
    'display logic does not keep prior hits for a newer needle',
);

expectEqual(
    shouldOpenCommandFromSearchFocus(true),
    false,
    'search focus is suppressed after programmatic close',
);
expectEqual(
    shouldOpenCommandFromSearchFocus(false),
    true,
    'search focus opens Command once the suppress window ends',
);

let escapePrevented = false;
let escapeStopped = false;
expectEqual(
    handleCommandEscapeKey({
        key: 'Escape',
        preventDefault: () => {
            escapePrevented = true;
        },
        stopPropagation: () => {
            escapeStopped = true;
        },
    }),
    true,
    'Escape is handled',
);
expectTrue(escapePrevented && escapeStopped, 'Escape preventDefault + stopPropagation');
expectEqual(
    handleCommandEscapeKey({
        key: 'k',
        preventDefault: () => undefined,
        stopPropagation: () => undefined,
    }),
    false,
    'other keys pass through Escape handling',
);

const hits = commandSearchHitsToResults([
    {
        type: 'contact',
        id: 11,
        label: 'Amine Benali',
        href: '/crm/contacts/11',
        recordRef: { type: 'contact', id: 11 },
    },
    {
        type: 'company',
        id: 4,
        label: 'Acme',
        href: '/crm/companies/4',
        recordRef: { type: 'company', id: 4 },
    },
    {
        type: 'deal',
        id: 7,
        label: 'Enterprise Upgrade',
        href: '/crm/deals/7',
        recordRef: { type: 'deal', id: 7 },
    },
]);
expectEqual(hits[0]?.kind, 'search', 'record hits are typed search results');
expectTrue(
    hits.every((item) => item.kind !== 'ask' && !JSON.stringify(item).includes('@') && !JSON.stringify(item).includes('amount')),
    'search hits do not mix Ask answers or leak email/amount',
);

const queried = composeCommandResults({
    query: 'deal',
    catalog,
    remoteHits: [
        {
            type: 'company',
            id: 4,
            label: 'Acme',
            href: '/crm/companies/4',
            recordRef: { type: 'company', id: 4 },
        },
    ],
});
expectEqual(queried[0]?.kind, 'search', 'typed query leads with remote records');
expectTrue(
    queried.some((item) => item.id === 'create-deal'),
    'remote failure or success still keeps matching Create',
);
expectTrue(
    queried.some((item) => item.id === 'nav-deals'),
    'Navigate still matches while records load',
);
expectEqual(
    commandResultKind(queried.find((item) => item.id === 'create-deal')!),
    'create',
    'Create is kind-typed, not label.startsWith',
);

expectTrue(matchesCommandQuery('pipe', catalog.navigate.find((item) => item.id === 'nav-pipeline')!), 'pipeline keywords match');
expectEqual(scoreCommandResult('home', catalog.navigate.find((item) => item.id === 'nav-home')!), 3, 'exact label ranks first');

expectEqual(isCommandCommitKey({ key: 'Enter' }), true, 'Enter commits');
expectEqual(isCommandCommitKey({ key: 'Enter', isComposing: true }), false, 'IME composition does not commit');
expectEqual(isCommandCommitKey({ key: 'Enter', keyCode: 229 }), false, 'keyCode 229 does not commit');
expectEqual(isCommandCommitKey({ key: 'ArrowDown' }), false, 'arrows are not commit');

const failedLocal = composeCommandResults({
    query: 'overdue',
    catalog,
    remoteHits: [],
});
expectTrue(
    failedLocal.some((item) => item.id === 'act-overdue'),
    'remote failure still surfaces P15 Overdue',
);

console.log('p16-command-os proofs passed');
