import { listQueryAdapter } from '@/lib/list-query/adapters';
import {
    emptyToNull,
    isEmptyFilterGroups,
    isListQuerySort,
    normalizePage,
    toOptionalBoolean,
    toOptionalNumber,
} from '@/lib/list-query/empty';
import { writeListHref } from '@/lib/list-query/href';
import type {
    CanonicalListQuery,
    DomainListParams,
    DomainListQueryAdapter,
    ListQueryExtras,
    ListQueryFilterKey,
    ListQueryObject,
} from '@/lib/list-query/types';
import type { ListViewFilters } from '@/lib/list-view-config';

export type ActiveFilterBag = {
    q?: unknown;
    view?: unknown;
    filter_id?: unknown;
    page?: unknown;
    owner?: unknown;
    created?: unknown;
    last_activity?: unknown;
    status?: unknown;
    stage?: unknown;
    city?: unknown;
    wilaya?: unknown;
    unanswered?: unknown;
    unassigned?: unknown;
    priority?: unknown;
    channel?: unknown;
    filter_groups?: unknown;
    sort?: unknown;
};

export type ListQueryExtraInput = {
    pipeline?: string | number | null | undefined;
};

function parseFilterGroups(value: unknown): ListViewFilters | null {
    if (!value || typeof value !== 'object') {
        return null;
    }

    const groups = value as ListViewFilters;

    return isEmptyFilterGroups(groups) ? null : groups;
}

export function extrasFromInput(extra?: ListQueryExtraInput): ListQueryExtras {
    return {
        pipeline: toOptionalNumber(extra?.pipeline),
    };
}

/**
 * Derive the canonical query from Inertia `activeFilters` + extras.
 * URL / props are the source of truth — no React copy.
 */
export function fromActiveFilters(
    filters: ActiveFilterBag,
    extra?: ListQueryExtraInput,
    page?: number | null,
): CanonicalListQuery {
    return {
        search: emptyToNull(filters.q),
        page: normalizePage(page ?? toOptionalNumber(filters.page)),
        view: emptyToNull(filters.view) ?? 'all',
        savedViewId: toOptionalNumber(filters.filter_id),
        filters: {
            owner: emptyToNull(filters.owner),
            created: emptyToNull(filters.created),
            last_activity: emptyToNull(filters.last_activity),
            status: emptyToNull(filters.status),
            stage: emptyToNull(filters.stage),
            city: emptyToNull(filters.city),
            wilaya: emptyToNull(filters.wilaya),
            unanswered: toOptionalBoolean(filters.unanswered),
            unassigned: toOptionalBoolean(filters.unassigned),
            priority: emptyToNull(filters.priority),
            channel: emptyToNull(filters.channel),
        },
        filterGroups: parseFilterGroups(filters.filter_groups),
        sort: isListQuerySort(filters.sort) ? filters.sort : null,
        extras: extrasFromInput(extra),
    };
}

function assignFilter(
    params: DomainListParams,
    key: ListQueryFilterKey,
    value: CanonicalListQuery['filters'][ListQueryFilterKey],
): void {
    if (value === null || value === undefined || value === '') {
        return;
    }

    if (key === 'unanswered' || key === 'unassigned') {
        if (value === true) {
            params[key] = true;
        }

        return;
    }

    params[key] = String(value);
}

/**
 * Canonical query → existing backend param bag via the domain adapter.
 */
export function toDomainParams(
    query: CanonicalListQuery,
    adapter: DomainListQueryAdapter,
): DomainListParams {
    if (!adapter.supportsQuery) {
        return {};
    }

    const params: DomainListParams = {};

    if (query.search) {
        params[adapter.searchParam] = query.search;
    }

    if (query.view) {
        params.view = query.view;
    }

    if (query.savedViewId !== null) {
        params.filter_id = query.savedViewId;
    }

    if (query.page !== null && query.page > 1) {
        params.page = query.page;
    }

    for (const key of adapter.filterKeys) {
        assignFilter(params, key, query.filters[key]);
    }

    if (query.filterGroups && !isEmptyFilterGroups(query.filterGroups)) {
        params.filter_groups = query.filterGroups;
    }

    if (adapter.extras.includes('pipeline') && query.extras.pipeline !== null) {
        params.pipeline = query.extras.pipeline;
    }

    return params;
}

export function domainParamsToBag(params: DomainListParams): Record<string, unknown> {
    const bag: Record<string, unknown> = {};

    if (params.q !== undefined) {
        bag.q = params.q;
    }

    if (params.view !== undefined) {
        bag.view = params.view;
    }

    if (params.filter_id !== undefined) {
        bag.filter_id = params.filter_id;
    }

    if (params.page !== undefined) {
        bag.page = params.page;
    }

    if (params.owner !== undefined) {
        bag.owner = params.owner;
    }

    if (params.created !== undefined) {
        bag.created = params.created;
    }

    if (params.last_activity !== undefined) {
        bag.last_activity = params.last_activity;
    }

    if (params.status !== undefined) {
        bag.status = params.status;
    }

    if (params.stage !== undefined) {
        bag.stage = params.stage;
    }

    if (params.city !== undefined) {
        bag.city = params.city;
    }

    if (params.wilaya !== undefined) {
        bag.wilaya = params.wilaya;
    }

    if (params.unanswered === true) {
        bag.unanswered = true;
    }

    if (params.unassigned === true) {
        bag.unassigned = true;
    }

    if (params.priority !== undefined) {
        bag.priority = params.priority;
    }

    if (params.channel !== undefined) {
        bag.channel = params.channel;
    }

    if (params.filter_groups !== undefined) {
        bag.filter_groups = params.filter_groups;
    }

    if (params.pipeline !== undefined) {
        bag.pipeline = params.pipeline;
    }

    return bag;
}

export function listQueryHref(
    basePath: string,
    query: CanonicalListQuery,
    object: ListQueryObject,
): string {
    return writeListHref(
        basePath,
        domainParamsToBag(toDomainParams(query, listQueryAdapter(object))),
    );
}

export function domainParamKeys(params: DomainListParams): string[] {
    return Object.keys(domainParamsToBag(params));
}
