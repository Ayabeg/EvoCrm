/**
 * P10 list-integration proofs. Export-only — never import from an Inertia page.
 * Run via tests/js/p10-quick-record-drawer-integration.ts or assertP10ListProofs().
 */
import { fullRecordHref } from '@/ds/workspace/quick-record/ref';
import { recordRefFromRow, resolveRowActivation } from '@/ds/workspace/quick-record/row-peek';
import { PEEK_QUERY_KEY, writePeekSearch } from '@/ds/workspace/quick-record/url';
import { fromActiveFilters, listQueryHref } from '@/lib/list-query';

export const P10_LIST_PROOFS: Record<string, boolean> = {
    'recordRefFromRow contact': (() => {
        const ref = recordRefFromRow('contact', { id: 11 });

        return ref?.type === 'contact' && ref.id === 11;
    })(),
    'recordRefFromRow company': recordRefFromRow('company', { id: 4 })?.type === 'company',
    'recordRefFromRow lead': recordRefFromRow('lead', { id: 8 })?.type === 'lead',
    'recordRefFromRow deal': recordRefFromRow('deal', { id: 3 })?.type === 'deal',
    'recordRefFromRow quote': recordRefFromRow('quote', { id: 9 })?.type === 'quote',
    'recordRefFromRow rejects ticket': recordRefFromRow('ticket', { id: 1 }) === null,
    'recordRefFromRow rejects zero': recordRefFromRow('contact', { id: 0 }) === null,
    'row background with peek opens drawer':
        resolveRowActivation({
            peekEnabled: true,
            nestedInteractive: false,
            metaOrCtrl: false,
            shiftOrAlt: false,
            middle: false,
        }) === 'peek',
    'nested interactive never peeks':
        resolveRowActivation({
            peekEnabled: true,
            nestedInteractive: true,
            metaOrCtrl: false,
            shiftOrAlt: false,
            middle: false,
        }) === 'ignore',
    'cmd/ctrl click is new-tab on real href':
        resolveRowActivation({
            peekEnabled: true,
            nestedInteractive: false,
            metaOrCtrl: true,
            shiftOrAlt: false,
            middle: false,
        }) === 'new-tab',
    'middle click is new-tab on real href':
        resolveRowActivation({
            peekEnabled: true,
            nestedInteractive: false,
            metaOrCtrl: false,
            shiftOrAlt: false,
            middle: true,
        }) === 'new-tab',
    'shift/alt click visits full record':
        resolveRowActivation({
            peekEnabled: true,
            nestedInteractive: false,
            metaOrCtrl: false,
            shiftOrAlt: true,
            middle: false,
        }) === 'visit',
    'without peek seam row visits full record':
        resolveRowActivation({
            peekEnabled: false,
            nestedInteractive: false,
            metaOrCtrl: false,
            shiftOrAlt: false,
            middle: false,
        }) === 'visit',
    'rowHref continuity contact': fullRecordHref({ type: 'contact', id: 11 }) === '/crm/contacts/11',
    'rowHref continuity company': fullRecordHref({ type: 'company', id: 4 }) === '/crm/companies/4',
    'rowHref continuity lead': fullRecordHref({ type: 'lead', id: 8 }) === '/crm/leads/8',
    'rowHref continuity deal': fullRecordHref({ type: 'deal', id: 3 }) === '/crm/deals/3',
    'rowHref continuity quote': fullRecordHref({ type: 'quote', id: 9 }) === '/crm/quotes/9',
    'listQueryHref does not write peek': !listQueryHref(
        '/crm/contacts',
        fromActiveFilters({ q: 'amel', view: 'my', page: 2 }),
        'contact',
    ).includes('peek='),
    'writePeekSearch is additive helper only': (() => {
        const next = writePeekSearch('?q=amel&page=2&view=my', { type: 'contact', id: 11 });

        return (
            next.includes('q=amel') &&
            next.includes('page=2') &&
            next.includes('view=my') &&
            next.includes(`${PEEK_QUERY_KEY}=contact:11`)
        );
    })(),
};

export function assertP10ListProofs(): void {
    for (const [label, ok] of Object.entries(P10_LIST_PROOFS)) {
        if (!ok) {
            throw new Error(`P10 list proof failed: ${label}`);
        }
    }
}
