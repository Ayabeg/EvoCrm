/**
 * Test-only P24 Ask Evo proofs. Never import from an Inertia page.
 */
import {
    ASK_EVO_PAGES,
    askEvoErrorMessage,
    askEvoScopeKey,
    contextIndicatorLabel,
    isAskEvoPage,
    parseAskEvoIdentityFromUrl,
    shouldResetAskEvoScope,
} from '../../resources/js/lib/ask-evo';

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

expectTrue(isAskEvoPage('contact'), 'contact is a supported page');
expectTrue(!isAskEvoPage('lead'), 'lead is not a first-class Ask Evo page');
expectTrue(ASK_EVO_PAGES.includes('qrd'), 'qrd is a page identity, not a kind dump');

expectEqual(
    parseAskEvoIdentityFromUrl('/crm/contacts/12'),
    { page: 'contact', entityType: 'contact', entityId: 12 },
    'contact show identity',
);
expectEqual(
    parseAskEvoIdentityFromUrl('/crm/companies/3'),
    { page: 'company', entityType: 'company', entityId: 3 },
    'company show identity',
);
expectEqual(
    parseAskEvoIdentityFromUrl('/crm/deals/9'),
    { page: 'deal', entityType: 'deal', entityId: 9 },
    'deal show identity',
);
expectEqual(
    parseAskEvoIdentityFromUrl('/crm/quotes/4'),
    { page: 'quote', entityType: 'quote', entityId: 4 },
    'quote show identity',
);
expectEqual(parseAskEvoIdentityFromUrl('/dashboard'), { page: 'dashboard' }, 'home is dashboard');
expectEqual(
    parseAskEvoIdentityFromUrl('/inbox?thread=88'),
    { page: 'inbox', entityType: 'inbox_conversation', entityId: 88 },
    'native inbox thread',
);
expectEqual(parseAskEvoIdentityFromUrl('/inbox'), { page: 'inbox' }, 'inbox embed has no thread');
expectEqual(
    parseAskEvoIdentityFromUrl('/crm/activities?activity=5'),
    { page: 'activity', entityType: 'activity', entityId: 5 },
    'activity identity',
);
expectEqual(parseAskEvoIdentityFromUrl('/crm/activities'), { page: 'activity' }, 'activity index');
expectEqual(
    parseAskEvoIdentityFromUrl('/crm/workflows?workflow=7'),
    { page: 'automation', entityType: 'automation', entityId: 7 },
    'workflow identity',
);
expectEqual(parseAskEvoIdentityFromUrl('/settings'), { page: 'workspace' }, 'unknown page is workspace');

expectEqual(
    parseAskEvoIdentityFromUrl('/crm/leads/1', { type: 'contact', id: 44 }),
    { page: 'qrd', entityType: 'contact', entityId: 44 },
    'QRD contact wins over the URL',
);
expectEqual(
    parseAskEvoIdentityFromUrl('/crm/contacts?qrd=1', { type: 'lead', id: 1 }),
    { page: 'workspace' },
    'QRD lead is not a supported record — no silent lead blend',
);
expectEqual(
    parseAskEvoIdentityFromUrl('/crm/deals/2', { type: 'quote', id: 6 }),
    { page: 'qrd', entityType: 'quote', entityId: 6 },
    'open QRD quote is compatible with the quote record',
);

expectEqual(askEvoScopeKey({ page: 'contact', entityType: 'contact', entityId: 12 }), 'contact:12', 'record scope key');
expectEqual(askEvoScopeKey({ page: 'dashboard' }), 'dashboard', 'page scope key');
expectTrue(shouldResetAskEvoScope('contact:1', 'contact:2'), 'scope change resets');
expectTrue(!shouldResetAskEvoScope(null, 'contact:1'), 'first paint does not reset');
expectTrue(!shouldResetAskEvoScope('deal:9', 'deal:9'), 'same scope keeps the thread');

expectEqual(askEvoErrorMessage({ code: 'stale', message: '' }), 'Context changed. Ask again on the current record.', 'stale copy');
expectEqual(askEvoErrorMessage({ code: 'unauthorized', message: '' }), 'This context is not available.', 'unauthorized copy');
expectEqual(askEvoErrorMessage({ code: 'timeout', message: '' }), 'Ask Evo timed out. Try again.', 'timeout copy');
expectEqual(
    contextIndicatorLabel({ kind: 'contact', label: 'Amine Clinic', scope_key: 'contact:1', suggestions: [], actions: [] }),
    'Amine Clinic',
    'indicator uses the server label',
);
