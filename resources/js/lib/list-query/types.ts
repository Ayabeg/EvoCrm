import type { ListViewFilters } from '@/lib/list-view-config';

/**
 * Objects whose list chrome can own a shareable query.
 * Leads have no list query today — adapter is a no-op.
 */
export type ListQueryObject =
    | 'contact'
    | 'company'
    | 'deal'
    | 'quote'
    | 'lead'
    | 'ticket';

/**
 * Shared search concept. Domain adapters serialize this to the
 * existing request param (`q` for every live object).
 */
export type ListQuerySearch = string | null;

export type ListQueryPage = number | null;

export type ListQueryView = string | null;

export type ListQuerySavedViewId = number | null;

/**
 * Quick-filter bag that the live FilterBar / chips actually write.
 * Association / behavior filters that only live inside `filter_groups`
 * stay on `filterGroups` — do not invent a second filter engine.
 */
export type ListQueryFilters = {
    owner: string | null;
    created: string | null;
    last_activity: string | null;
    status: string | null;
    stage: string | null;
    city: string | null;
    wilaya: string | null;
    unanswered: boolean | null;
    unassigned: boolean | null;
    priority: string | null;
    channel: string | null;
};

export type ListQuerySort = {
    field: string;
    direction: 'asc' | 'desc';
};

/**
 * Domain extras that survive chrome updates.
 * Deals: `pipeline`. No other live extra is URL-owned today.
 */
export type ListQueryExtras = {
    pipeline: number | null;
};

/**
 * Canonical list query. URL / Inertia `activeFilters` + extras is the
 * durable source of truth. This is not a React mirror.
 */
export type CanonicalListQuery = {
    search: ListQuerySearch;
    page: ListQueryPage;
    view: ListQueryView;
    savedViewId: ListQuerySavedViewId;
    filters: ListQueryFilters;
    filterGroups: ListViewFilters | null;
    sort: ListQuerySort | null;
    extras: ListQueryExtras;
};

export type ListQueryFilterKey = keyof ListQueryFilters;

export type ListQueryPatch = {
    search?: ListQuerySearch;
    page?: ListQueryPage;
    view?: ListQueryView;
    savedViewId?: ListQuerySavedViewId;
    filters?: Partial<ListQueryFilters>;
    filterGroups?: ListViewFilters | null;
    sort?: ListQuerySort | null;
    extras?: Partial<ListQueryExtras>;
};

/**
 * Backend / URL param bag after domain serialization.
 * Explicit keys only — not an untyped string bag.
 */
export type DomainListParams = {
    q?: string;
    view?: string;
    filter_id?: number;
    page?: number;
    owner?: string;
    created?: string;
    last_activity?: string;
    status?: string;
    stage?: string;
    city?: string;
    wilaya?: string;
    unanswered?: true;
    unassigned?: true;
    priority?: string;
    channel?: string;
    filter_groups?: ListViewFilters;
    pipeline?: number;
};

export type DomainListQueryAdapter = {
    object: ListQueryObject;
    /** Shared concept `search` → existing request param. Live objects all use `q`. */
    searchParam: 'q';
    filterKeys: readonly ListQueryFilterKey[];
    extras: readonly (keyof ListQueryExtras)[];
    supportsQuery: boolean;
};
