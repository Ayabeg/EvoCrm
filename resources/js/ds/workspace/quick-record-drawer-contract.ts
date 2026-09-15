/**
 * P09 drawer proofs. Export-only — never import from an Inertia page.
 * Import-time asserts blank `#app` if a proof fails (Contabo harness, 2026-09-15).
 * Run via tests/js/p09-quick-record-drawer-contract.ts or assertP09DrawerProofs().
 */
import {
    initialQuickRecordState,
    reduceQuickRecord,
} from '@/ds/workspace/quick-record/controller';
import { fullRecordHref, parseRecordRef, parsePeekToken, serializePeekRef } from '@/ds/workspace/quick-record/ref';
import { isStaleHydration, nextRequestId } from '@/ds/workspace/quick-record/stale';
import type { QuickRecordPeekPayload, RecordCapabilities } from '@/ds/workspace/quick-record/types';
import { PEEK_QUERY_KEY, peekTokenFromSearch, writePeekSearch } from '@/ds/workspace/quick-record/url';
import { adaptCompany } from '@/ds/workspace/record-adapters/company';
import { adaptContact } from '@/ds/workspace/record-adapters/contact';
import { adaptDeal } from '@/ds/workspace/record-adapters/deal';
import { adaptLead } from '@/ds/workspace/record-adapters/lead';
import { adaptQuote } from '@/ds/workspace/record-adapters/quote';
import { formatDzd } from '@/lib/money';

const capabilities = (partial: Partial<RecordCapabilities>): RecordCapabilities => ({
    overview: true,
    activity: false,
    notes: false,
    tasks: false,
    associations: true,
    actions: true,
    ...partial,
});

const permissions = { can_view: true, can_update: true };

const contactPayload: QuickRecordPeekPayload = {
    type: 'contact',
    id: 11,
    record: {
        first_name: 'Amel',
        last_name: 'Hadj',
        display_name: 'Amel Hadj',
        email: 'amel@clinic.test',
        phone_e164: '+213555000000',
        company_name: 'Clinic Atlas',
        owner_name: 'Owner',
        owner_id: 1,
        lead_status: 'new',
    },
    associations: [{ type: 'company', id: 4, label: 'Clinic Atlas' }],
    activity: [],
    notes: [],
    tasks: [],
    capabilities: capabilities({ activity: true, notes: true, tasks: true }),
    permissions,
};

const companyPayload: QuickRecordPeekPayload = {
    type: 'company',
    id: 4,
    record: { name: 'Clinic Atlas', domain: 'clinic.test', contacts_count: 1, deals_count: 1 },
    associations: [{ type: 'contact', id: 11, label: 'Amel Hadj' }],
    activity: [],
    notes: [],
    tasks: [],
    capabilities: capabilities({ activity: true, notes: true, tasks: true }),
    permissions,
};

const leadPayload: QuickRecordPeekPayload = {
    type: 'lead',
    id: 8,
    record: { title: 'Clinic Atlas inbound', status: 'new', source: 'manual', score: 12 },
    associations: [{ type: 'contact', id: 11, label: 'Amel Hadj' }],
    activity: [],
    notes: [],
    tasks: [],
    capabilities: capabilities({ activity: false, notes: false, tasks: false }),
    permissions,
};

const dealPayload: QuickRecordPeekPayload = {
    type: 'deal',
    id: 22,
    record: {
        title: 'Clinic landing page',
        amount_cents: 500000,
        currency: 'DZD',
        stage_name: 'New',
        company_name: 'Clinic Atlas',
    },
    associations: [
        { type: 'company', id: 4, label: 'Clinic Atlas' },
        { type: 'quote', id: 9, label: 'Quote #9' },
    ],
    activity: [],
    notes: [],
    tasks: [],
    capabilities: capabilities({ activity: true, notes: true, tasks: true }),
    permissions,
};

const quotePayload: QuickRecordPeekPayload = {
    type: 'quote',
    id: 9,
    record: {
        title: 'Clinic landing page',
        deal_title: 'Clinic landing page',
        status: 'draft',
        total_cents: 500000,
        currency: 'DZD',
        expires_at: '2026-10-01T00:00:00.000000Z',
    },
    associations: [{ type: 'deal', id: 22, label: 'Clinic landing page' }],
    activity: [],
    notes: [],
    tasks: [],
    capabilities: capabilities({ activity: false, notes: false, tasks: false }),
    permissions,
};

export function assertP09DrawerProofs(): void {
    for (const [label, ok] of Object.entries(P09_DRAWER_PROOFS)) {
        if (!ok) {
            throw new Error(`P09 contract failed: ${label}`);
        }
    }
}

export const P09_DRAWER_PROOFS = {
    'canonical RecordType is contact|company|lead|deal|quote':
        parseRecordRef('contact', 1)?.type === 'contact' &&
        parseRecordRef('ticket', 1) === null,
    'RecordRef parse rejects malformed ids': parseRecordRef('contact', 'abc') === null,
    'fullRecordHref uses existing show routes':
        fullRecordHref({ type: 'contact', id: 11 }) === '/crm/contacts/11' &&
        fullRecordHref({ type: 'company', id: 4 }) === '/crm/companies/4' &&
        fullRecordHref({ type: 'lead', id: 8 }) === '/crm/leads/8' &&
        fullRecordHref({ type: 'deal', id: 22 }) === '/crm/deals/22' &&
        fullRecordHref({ type: 'quote', id: 9 }) === '/crm/quotes/9',
    'peek token is type:id':
        serializePeekRef({ type: 'deal', id: 22 }) === 'deal:22' &&
        parsePeekToken('quote:9')?.type === 'quote',
    'reserved peek key is peek': PEEK_QUERY_KEY === 'peek',
    'writePeekSearch preserves list filters': (() => {
        const next = writePeekSearch('?q=amel&page=2', { type: 'contact', id: 11 });

        return (
            next.includes('q=amel') &&
            next.includes('page=2') &&
            peekTokenFromSearch(next)?.type === 'contact' &&
            peekTokenFromSearch(next)?.id === 11
        );
    })(),
    'peekTokenFromSearch reads reserved key':
        peekTokenFromSearch('?q=amel&peek=company:4')?.type === 'company',
    'contact adapter identity': adaptContact(contactPayload).title === 'Amel Hadj',
    'contact adapter full href': adaptContact(contactPayload).fullRecordHref === '/crm/contacts/11',
    'company adapter identity': adaptCompany(companyPayload).title === 'Clinic Atlas',
    'lead adapter uses qualification not stage':
        adaptLead(leadPayload).status?.label === 'New' &&
        !adaptLead(leadPayload).keyProperties.some((property) => property.id === 'stage'),
    'deal adapter uses stage not qualification':
        adaptDeal(dealPayload).status?.label === 'New' &&
        adaptDeal(dealPayload).keyProperties.some((property) => property.id === 'stage'),
    'quote adapter deal title + total + draft/sent/accepted + expires': (() => {
        const quote = adaptQuote(quotePayload);

        return (
            quote.title === 'Clinic landing page' &&
            quote.status?.label === 'Draft' &&
            quote.keyProperties.some((property) => property.id === 'expires_at')
        );
    })(),
    'quote total uses formatDzd DA display not literal DZD substring': (() => {
        const total = adaptQuote(quotePayload).keyProperties.find((property) => property.id === 'total')?.value ?? '';
        const formatted = formatDzd(500_000);

        return total === formatted && total.length > 0 && /5[\s\u00a0\u202f]?000/.test(total);
    })(),
    'quote associations are deal only':
        adaptQuote(quotePayload).associations.length === 1 &&
        adaptQuote(quotePayload).associations[0]?.ref.type === 'deal',
    'lead omits activity notes tasks':
        adaptLead(leadPayload).capabilities.activity === false &&
        adaptLead(leadPayload).capabilities.notes === false &&
        adaptLead(leadPayload).capabilities.tasks === false,
    'A then C cannot render A over C':
        isStaleHydration(3, 1) === true && isStaleHydration(3, 3) === false,
    'request identity increments': nextRequestId(2) === 3,
    'open then replace then back is deterministic': (() => {
        let state = initialQuickRecordState();
        state = reduceQuickRecord(state, { type: 'open', ref: { type: 'contact', id: 11 } });
        const firstRequest = state.requestId;
        state = reduceQuickRecord(state, { type: 'replace', ref: { type: 'company', id: 4 } });
        state = reduceQuickRecord(state, { type: 'replace', ref: { type: 'deal', id: 22 } });
        const thirdRequest = state.requestId;
        const lateA = reduceQuickRecord(state, {
            type: 'hydrate-success',
            requestId: firstRequest,
            payload: contactPayload,
        });
        const applyC = reduceQuickRecord(state, {
            type: 'hydrate-success',
            requestId: thirdRequest,
            payload: dealPayload,
        });
        state = reduceQuickRecord(applyC, { type: 'back' });

        return (
            lateA.descriptor === null &&
            applyC.descriptor?.ref.type === 'deal' &&
            state.current?.type === 'company' &&
            state.history.length === 1
        );
    })(),
    'close restores empty controller':
        reduceQuickRecord(
            reduceQuickRecord(initialQuickRecordState(), { type: 'open', ref: { type: 'contact', id: 11 } }),
            { type: 'close' },
        ).open === false,
};
