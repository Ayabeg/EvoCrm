import { listQueryAdapter } from '@/lib/list-query/adapters';
import { emptyCanonicalListQuery } from '@/lib/list-query/empty';
import {
    classifyListQueryKey,
    UNRELATED_PRESERVED_KEYS,
    UNSAFE_QUERY_KEYS,
} from '@/lib/list-query/keys';
import {
    applyBuiltInView,
    applyPipeline,
    applySavedFilter,
    applyStageFilter,
    clearQuickFilters,
    patchListQuery,
} from '@/lib/list-query/patch';
import type { ActiveFilterBag } from '@/lib/list-query/serialize';
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
    query({
        search: 'clinic',
        page: 2,
        filters: { ...emptyCanonicalListQuery().filters, status: 'new', created: '7d' },
    }),
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

const REGRESSION_WORKSPACE = query({
    search: 'acme',
    page: 3,
    view: 'my',
    filters: {
        ...emptyCanonicalListQuery().filters,
        owner: '7',
        stage: 'new',
        created: '7d',
    },
    sort: { field: 'amount', direction: 'desc' },
    extras: { pipeline: 4 },
});

export const P03C_STAGE_PRESERVES = applyStageFilter(REGRESSION_WORKSPACE, 'qualified');
export const P03C_PIPELINE_PRESERVES = applyPipeline(REGRESSION_WORKSPACE, 9);
export const P03C_STAGE_HREF = listQueryHref('/crm/deals', P03C_STAGE_PRESERVES, 'deal');
export const P03C_PIPELINE_HREF = listQueryHref('/crm/deals', P03C_PIPELINE_PRESERVES, 'deal');
export const P03C_OWNER_PRESERVES_SORT = patchListQuery(REGRESSION_WORKSPACE, {
    filters: { owner: '12' },
});
export const P03C_OWNER_CLEAR = patchListQuery(REGRESSION_WORKSPACE, {
    filters: { owner: null },
});
export const P03C_EMPTY_REMOVAL_HREF = listQueryHref('/crm/deals', P03C_OWNER_CLEAR, 'deal');
export const P03C_BOARD_PIPELINE_HREF = listQueryHref(
    '/crm/deals/board',
    applyPipeline(
        { ...emptyCanonicalListQuery(), view: null, extras: { pipeline: 4 } },
        9,
    ),
    'deal',
);

function bagFromHref(href: string): ActiveFilterBag {
    const url = new URL(href, 'https://crm.test');
    const bag: ActiveFilterBag = {};

    url.searchParams.forEach((value, key) => {
        if (key === 'page' || key === 'filter_id' || key === 'pipeline') {
            (bag as Record<string, unknown>)[key] = Number(value);

            return;
        }

        (bag as Record<string, unknown>)[key] = value;
    });

    return bag;
}

const HISTORY_SEARCH = patchListQuery(query({ extras: { pipeline: 4 } }), { search: 'acme' });
const HISTORY_FILTER = patchListQuery(HISTORY_SEARCH, { filters: { owner: '7' } });
const HISTORY_PAGE = patchListQuery(HISTORY_FILTER, { page: 2 });
const HISTORY_HREFS = [HISTORY_SEARCH, HISTORY_FILTER, HISTORY_PAGE].map((item) =>
    listQueryHref('/crm/deals', item, 'deal'),
);
const HISTORY_RECONSTRUCTED = HISTORY_HREFS.map((href) => fromActiveFilters(bagFromHref(href)));

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
    assert(
        P03C_LEAD_KEYS.includes('q') &&
            P03C_LEAD_KEYS.includes('status') &&
            P03C_LEAD_KEYS.includes('created') &&
            !P03C_LEAD_KEYS.includes('owner') &&
            !P03C_LEAD_KEYS.includes('pipeline'),
        'leads request shape',
    );
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
    assert(
        P03C_STAGE_PRESERVES.filters.stage === 'qualified' &&
            P03C_STAGE_PRESERVES.search === 'acme' &&
            P03C_STAGE_PRESERVES.filters.owner === '7' &&
            P03C_STAGE_PRESERVES.filters.created === '7d' &&
            P03C_STAGE_PRESERVES.sort?.field === 'amount' &&
            P03C_STAGE_PRESERVES.sort.direction === 'desc' &&
            P03C_STAGE_PRESERVES.view === 'my' &&
            P03C_STAGE_PRESERVES.extras.pipeline === 4 &&
            P03C_STAGE_PRESERVES.page === null,
        'stage preserves search/filters/sort/view/pipeline and resets page',
    );
    assert(
        P03C_STAGE_HREF.includes('q=acme') &&
            P03C_STAGE_HREF.includes('owner=7') &&
            P03C_STAGE_HREF.includes('sort=amount') &&
            P03C_STAGE_HREF.includes('direction=desc') &&
            P03C_STAGE_HREF.includes('view=my') &&
            P03C_STAGE_HREF.includes('pipeline=4') &&
            P03C_STAGE_HREF.includes('stage=qualified') &&
            !P03C_STAGE_HREF.includes('page=') &&
            P03C_STAGE_HREF !== '/crm/deals?stage=qualified',
        'stage href is not only ?stage=',
    );
    assert(
        P03C_PIPELINE_PRESERVES.extras.pipeline === 9 &&
            P03C_PIPELINE_PRESERVES.filters.stage === null &&
            P03C_PIPELINE_PRESERVES.search === 'acme' &&
            P03C_PIPELINE_PRESERVES.filters.owner === '7' &&
            P03C_PIPELINE_PRESERVES.sort?.field === 'amount' &&
            P03C_PIPELINE_PRESERVES.view === 'my' &&
            P03C_PIPELINE_PRESERVES.page === null,
        'pipeline preserves search/filters/sort/view and drops stage',
    );
    assert(
        P03C_PIPELINE_HREF.includes('q=acme') &&
            P03C_PIPELINE_HREF.includes('owner=7') &&
            P03C_PIPELINE_HREF.includes('sort=amount') &&
            P03C_PIPELINE_HREF.includes('pipeline=9') &&
            !P03C_PIPELINE_HREF.includes('stage=') &&
            !P03C_PIPELINE_HREF.includes('page=') &&
            P03C_PIPELINE_HREF !== '/crm/deals?pipeline=9',
        'pipeline href is not only ?pipeline=',
    );
    assert(
        P03C_OWNER_PRESERVES_SORT.filters.owner === '12' &&
            P03C_OWNER_PRESERVES_SORT.search === 'acme' &&
            P03C_OWNER_PRESERVES_SORT.sort?.field === 'amount' &&
            P03C_OWNER_PRESERVES_SORT.sort.direction === 'desc' &&
            P03C_OWNER_PRESERVES_SORT.view === 'my' &&
            P03C_OWNER_PRESERVES_SORT.extras.pipeline === 4 &&
            P03C_OWNER_PRESERVES_SORT.page === null,
        'filter sibling preservation keeps q/sort/direction/view',
    );
    assert(
        P03C_OWNER_CLEAR.filters.owner === null &&
            P03C_OWNER_CLEAR.search === 'acme' &&
            P03C_OWNER_CLEAR.sort?.field === 'amount' &&
            !P03C_EMPTY_REMOVAL_HREF.includes('owner=') &&
            P03C_EMPTY_REMOVAL_HREF.includes('q=acme') &&
            !P03C_EMPTY_REMOVAL_HREF.includes('undefined') &&
            !P03C_EMPTY_REMOVAL_HREF.includes('null'),
        'empty removal deletes only that param',
    );
    assert(
        P03C_BOARD_PIPELINE_HREF === '/crm/deals/board?pipeline=9',
        'board pipeline does not leak list keys',
    );
    assert(
        HISTORY_RECONSTRUCTED[0].search === 'acme' &&
            HISTORY_RECONSTRUCTED[0].filters.owner === null &&
            HISTORY_RECONSTRUCTED[0].page === null &&
            HISTORY_RECONSTRUCTED[1].search === 'acme' &&
            HISTORY_RECONSTRUCTED[1].filters.owner === '7' &&
            HISTORY_RECONSTRUCTED[1].page === null &&
            HISTORY_RECONSTRUCTED[2].search === 'acme' &&
            HISTORY_RECONSTRUCTED[2].filters.owner === '7' &&
            HISTORY_RECONSTRUCTED[2].page === 2,
        'back/forward reconstruction from query hrefs',
    );
    assert(
        classifyListQueryKey('sort') === 'unrelated-preserved' &&
            classifyListQueryKey('pipeline') === 'unrelated-preserved' &&
            classifyListQueryKey('owner') === 'chrome-filter' &&
            classifyListQueryKey('q') === 'canonical-workspace' &&
            classifyListQueryKey('owner_id') === 'unsafe' &&
            classifyListQueryKey('deal_stage') === 'backend-association' &&
            UNRELATED_PRESERVED_KEYS.includes('direction') &&
            UNSAFE_QUERY_KEYS.includes('columns') &&
            UNSAFE_QUERY_KEYS.includes('peek'),
        'explicit key classes — filterFields is not the workspace bag',
    );
    assert(
        fromActiveFilters({
            q: 'acme',
            owner: '7',
            sort: 'amount',
            direction: 'desc',
            page: 3,
        }).sort?.field === 'amount' &&
            fromActiveFilters({ sort: { field: 'created_at', direction: 'desc' } }).sort === null &&
            fromActiveFilters({
                url_sort: 'name',
                url_direction: 'asc',
                sort: { field: 'created_at', direction: 'desc' },
                page: 2,
            }).sort?.field === 'name' &&
            fromActiveFilters({
                url_sort: 'name',
                url_direction: 'asc',
                sort: { field: 'created_at', direction: 'desc' },
                page: 2,
            }).sort?.direction === 'asc',
        'URL sort/direction reconstructed; saved-view sort object is not URL-owned',
    );
    const urlSortPageHref = listQueryHref(
        '/crm/contacts',
        patchListQuery(
            fromActiveFilters({
                q: 'amel',
                url_sort: 'name',
                url_direction: 'asc',
                sort: { field: 'created_at', direction: 'desc' },
            }),
            { page: 2 },
        ),
        'contact',
    );
    assert(
        urlSortPageHref.includes('sort=name') &&
            urlSortPageHref.includes('direction=asc') &&
            urlSortPageHref.includes('page=2') &&
            urlSortPageHref.includes('q=amel') &&
            !urlSortPageHref.includes('created_at'),
        'page nav from url_sort props keeps URL sort and drops saved-view sort object',
    );
}

runP03CQueryProofs();
