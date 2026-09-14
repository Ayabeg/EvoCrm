import { listQueryAdapter } from '@/lib/list-query/adapters';
import { emptyCanonicalListQuery } from '@/lib/list-query/empty';
import {
    applyBuiltInView,
    applySavedFilter,
    clearQuickFilters,
    patchListQuery,
} from '@/lib/list-query/patch';
import {
    domainParamKeys,
    fromActiveFilters,
    listQueryHref,
    toDomainParams,
} from '@/lib/list-query/serialize';
import type { CanonicalListQuery } from '@/lib/list-query/types';

/**
 * Compile + value lock for P03C query ownership.
 * URL / Inertia query is the durable source of truth.
 */

function query(partial: Partial<CanonicalListQuery> = {}): CanonicalListQuery {
    const base = emptyCanonicalListQuery();

    return {
        ...base,
        ...partial,
        filters: { ...base.filters, ...partial.filters },
        extras: { ...base.extras, ...partial.extras },
    };
}

const PAGE_TWO_WITH_WORKSPACE = query({
    search: 'amel',
    page: 2,
    view: 'my',
    savedViewId: null,
    filters: {
        ...emptyCanonicalListQuery().filters,
        owner: '9',
        created: '7d',
        status: 'new',
    },
    sort: { field: 'created_at', direction: 'desc' },
    extras: { pipeline: 4 },
});

/** 1 — search preserves unrelated filters / view / extras / sort */
export const P03C_SEARCH_PRESERVES = patchListQuery(PAGE_TWO_WITH_WORKSPACE, {
    search: 'hadj',
});

/** 2 — search clear */
export const P03C_SEARCH_CLEAR = patchListQuery(PAGE_TWO_WITH_WORKSPACE, {
    search: '',
});

/** 3 — filter preserves search / view / extras */
export const P03C_FILTER_PRESERVES = patchListQuery(PAGE_TWO_WITH_WORKSPACE, {
    filters: { city: 'Algiers' },
});

/** 4 — filter clear (quick + groups only) */
export const P03C_FILTER_CLEAR = clearQuickFilters(PAGE_TWO_WITH_WORKSPACE);

/** 5 — meaningful change resets page */
export const P03C_SEARCH_RESETS_PAGE = P03C_SEARCH_PRESERVES.page;
export const P03C_FILTER_RESETS_PAGE = P03C_FILTER_PRESERVES.page;

/** 6–9 — page nav preserves search / filters / sort / view */
export const P03C_PAGE_PRESERVES = patchListQuery(
    query({
        search: 'amel',
        view: 'my',
        filters: { ...emptyCanonicalListQuery().filters, owner: '9', created: '7d' },
        sort: { field: 'created_at', direction: 'desc' },
        extras: { pipeline: 4 },
    }),
    { page: 3 },
);

/** 10 — sort preserves filters / search */
export const P03C_SORT_PRESERVES = patchListQuery(PAGE_TWO_WITH_WORKSPACE, {
    sort: { field: 'name', direction: 'asc' },
});

/** 11 — saved-view change replaces chrome filters, keeps extras */
export const P03C_SAVED_VIEW = applySavedFilter(PAGE_TWO_WITH_WORKSPACE, 12);
export const P03C_BUILTIN_VIEW = applyBuiltInView(PAGE_TWO_WITH_WORKSPACE, 'my', 9);

/** 12 — unrelated permitted extras survive chrome patches */
export const P03C_EXTRAS_SURVIVE = P03C_SEARCH_PRESERVES.extras.pipeline;

const CONTACT_SHAPE = toDomainParams(
    query({
        search: 'amel',
        page: 2,
        view: 'all',
        filters: { ...emptyCanonicalListQuery().filters, owner: '9', created: '7d' },
        extras: { pipeline: 4 },
    }),
    listQueryAdapter('contact'),
);

const COMPANY_SHAPE = toDomainParams(
    query({
        search: 'acme',
        view: 'all',
        filters: { ...emptyCanonicalListQuery().filters, city: 'Oran' },
    }),
    listQueryAdapter('company'),
);

const DEAL_SHAPE = toDomainParams(
    query({
        search: 'clinic',
        view: 'all',
        filters: { ...emptyCanonicalListQuery().filters, stage: 'new', status: 'open' },
        extras: { pipeline: 4 },
    }),
    listQueryAdapter('deal'),
);

const QUOTE_SHAPE = toDomainParams(
    query({
        search: '12',
        view: 'all',
        filters: {
            ...emptyCanonicalListQuery().filters,
            status: 'draft',
            owner: '9',
            created: '30d',
            stage: 'new',
        },
        extras: { pipeline: 4 },
    }),
    listQueryAdapter('quote'),
);

const LEAD_SHAPE = toDomainParams(
    query({ search: 'should-not-emit', page: 2 }),
    listQueryAdapter('lead'),
);

export const P03C_CONTACT_KEYS = domainParamKeys(CONTACT_SHAPE);
export const P03C_COMPANY_KEYS = domainParamKeys(COMPANY_SHAPE);
export const P03C_DEAL_KEYS = domainParamKeys(DEAL_SHAPE);
export const P03C_QUOTE_KEYS = domainParamKeys(QUOTE_SHAPE);
export const P03C_LEAD_KEYS = domainParamKeys(LEAD_SHAPE);

export const P03C_CONTACT_HREF = listQueryHref(
    '/crm/contacts',
    query({
        search: 'amel',
        page: 2,
        view: 'all',
        filters: { ...emptyCanonicalListQuery().filters, owner: '9' },
    }),
    'contact',
);

export const P03C_FROM_PROPS = fromActiveFilters(
    { q: 'amel', view: 'all', owner: '9', page: 2 },
    { pipeline: 4 },
);

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(message);
    }
}

export function runP03CQueryProofs(): void {
    assert(
        P03C_SEARCH_PRESERVES.search === 'hadj' &&
            P03C_SEARCH_PRESERVES.filters.owner === '9' &&
            P03C_SEARCH_PRESERVES.filters.created === '7d' &&
            P03C_SEARCH_PRESERVES.view === 'my' &&
            P03C_SEARCH_PRESERVES.sort?.field === 'created_at' &&
            P03C_SEARCH_PRESERVES.extras.pipeline === 4,
        'search preserves unrelated',
    );
    assert(P03C_SEARCH_CLEAR.search === null, 'search clear');
    assert(
        P03C_FILTER_PRESERVES.filters.city === 'Algiers' &&
            P03C_FILTER_PRESERVES.search === 'amel' &&
            P03C_FILTER_PRESERVES.filters.owner === '9' &&
            P03C_FILTER_PRESERVES.view === 'my',
        'filter preserves',
    );
    assert(
        P03C_FILTER_CLEAR.filters.owner === null &&
            P03C_FILTER_CLEAR.filters.created === null &&
            P03C_FILTER_CLEAR.search === 'amel' &&
            P03C_FILTER_CLEAR.view === 'my' &&
            P03C_FILTER_CLEAR.savedViewId === null,
        'filter clear',
    );
    assert(P03C_SEARCH_RESETS_PAGE === null && P03C_FILTER_RESETS_PAGE === null, 'meaningful change resets page');
    assert(
        P03C_PAGE_PRESERVES.page === 3 &&
            P03C_PAGE_PRESERVES.search === 'amel' &&
            P03C_PAGE_PRESERVES.filters.owner === '9' &&
            P03C_PAGE_PRESERVES.filters.created === '7d' &&
            P03C_PAGE_PRESERVES.sort?.field === 'created_at' &&
            P03C_PAGE_PRESERVES.view === 'my',
        'page nav preserves search/filters/sort/view',
    );
    assert(
        P03C_SORT_PRESERVES.sort?.field === 'name' &&
            P03C_SORT_PRESERVES.search === 'amel' &&
            P03C_SORT_PRESERVES.filters.owner === '9',
        'sort preserves filters/search',
    );
    assert(
        P03C_SAVED_VIEW.savedViewId === 12 &&
            P03C_SAVED_VIEW.search === null &&
            P03C_SAVED_VIEW.filters.owner === null &&
            P03C_SAVED_VIEW.extras.pipeline === 4,
        'saved-view change',
    );
    assert(
        P03C_BUILTIN_VIEW.view === 'my' &&
            P03C_BUILTIN_VIEW.savedViewId === null &&
            P03C_BUILTIN_VIEW.filters.owner === '9' &&
            P03C_BUILTIN_VIEW.search === 'amel',
        'built-in view keeps chrome filters',
    );
    assert(P03C_EXTRAS_SURVIVE === 4, 'unrelated permitted keys not destroyed');
    assert(P03C_CONTACT_KEYS.includes('q') && P03C_CONTACT_KEYS.includes('owner') && !P03C_CONTACT_KEYS.includes('pipeline'), 'contacts request shape');
    assert(P03C_COMPANY_KEYS.includes('q') && P03C_COMPANY_KEYS.includes('city') && !P03C_COMPANY_KEYS.includes('pipeline'), 'companies request shape');
    assert(P03C_DEAL_KEYS.includes('q') && P03C_DEAL_KEYS.includes('stage') && P03C_DEAL_KEYS.includes('pipeline'), 'deals request shape');
    assert(
        P03C_QUOTE_KEYS.includes('q') &&
            P03C_QUOTE_KEYS.includes('status') &&
            !P03C_QUOTE_KEYS.includes('stage') &&
            !P03C_QUOTE_KEYS.includes('pipeline'),
        'quotes request shape',
    );
    assert(P03C_LEAD_KEYS.length === 0, 'leads emit no list query');
    assert(
        P03C_CONTACT_HREF === '/crm/contacts?q=amel&view=all&page=2&owner=9',
        'contact href uses existing q/view/page/owner params',
    );
    assert(
        P03C_FROM_PROPS.search === 'amel' &&
            P03C_FROM_PROPS.filters.owner === '9' &&
            P03C_FROM_PROPS.page === 2 &&
            P03C_FROM_PROPS.extras.pipeline === 4,
        'derive from Inertia props',
    );
    assert(
        toDomainParams(P03C_SEARCH_PRESERVES, listQueryAdapter('contact')).page === undefined,
        'page 1/null omitted from domain bag after reset',
    );
}

runP03CQueryProofs();
