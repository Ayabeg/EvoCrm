import {
    emptyCanonicalListQuery,
    emptyListQueryFilters,
    emptyToNull,
    isEmptyFilterGroups,
    normalizePage,
} from '@/lib/list-query/empty';
import type {
    CanonicalListQuery,
    ListQueryExtras,
    ListQueryFilters,
    ListQueryPatch,
} from '@/lib/list-query/types';

const MEANING_KEYS: readonly (keyof ListQueryPatch)[] = [
    'search',
    'filters',
    'filterGroups',
    'view',
    'savedViewId',
    'sort',
];

function compactFilters(filters: ListQueryFilters): ListQueryFilters {
    return {
        owner: emptyToNull(filters.owner),
        created: emptyToNull(filters.created),
        last_activity: emptyToNull(filters.last_activity),
        status: emptyToNull(filters.status),
        stage: emptyToNull(filters.stage),
        city: emptyToNull(filters.city),
        wilaya: emptyToNull(filters.wilaya),
        unanswered: filters.unanswered ? true : null,
        unassigned: filters.unassigned ? true : null,
        priority: emptyToNull(filters.priority),
        channel: emptyToNull(filters.channel),
    };
}

function meaningChanged(patch: ListQueryPatch): boolean {
    return MEANING_KEYS.some((key) => patch[key] !== undefined);
}

/**
 * Patch one concern. Preserve unrelated state.
 * Meaningful changes reset page (current FilterBar / list-query semantics:
 * `page` is not in the chrome whitelist, so search/filter/view drop it).
 * Page-only patches keep search, filters, view, extras, and sort.
 */
export function patchListQuery(
    current: CanonicalListQuery,
    patch: ListQueryPatch,
): CanonicalListQuery {
    const next: CanonicalListQuery = {
        search: current.search,
        page: current.page,
        view: current.view,
        savedViewId: current.savedViewId,
        filters: { ...current.filters },
        filterGroups: current.filterGroups,
        sort: current.sort,
        extras: { ...current.extras },
    };

    if (patch.search !== undefined) {
        next.search = emptyToNull(patch.search);
    }

    if (patch.view !== undefined) {
        next.view = emptyToNull(patch.view);
    }

    if (patch.savedViewId !== undefined) {
        next.savedViewId = patch.savedViewId;
    }

    if (patch.filters !== undefined) {
        next.filters = compactFilters({
            ...next.filters,
            ...patch.filters,
        });
    }

    if (patch.filterGroups !== undefined) {
        next.filterGroups = isEmptyFilterGroups(patch.filterGroups)
            ? null
            : patch.filterGroups;
    }

    if (patch.sort !== undefined) {
        next.sort = patch.sort;
    }

    if (patch.extras !== undefined) {
        next.extras = {
            ...next.extras,
            ...patch.extras,
        };
    }

    if (patch.page !== undefined) {
        next.page = normalizePage(patch.page);
    } else if (meaningChanged(patch)) {
        next.page = null;
    }

    return next;
}

/**
 * FilterBar "Clear all": drop quick + advanced filters.
 * Keep search, view, saved view, extras, sort.
 */
export function clearQuickFilters(current: CanonicalListQuery): CanonicalListQuery {
    return patchListQuery(current, {
        filters: emptyListQueryFilters(),
        filterGroups: null,
    });
}

/**
 * Built-in view pill. Preserves current chrome filters / search.
 * Clears saved `filter_id`. Sets owner for `my`.
 */
export function applyBuiltInView(
    current: CanonicalListQuery,
    view: string,
    owner: string | number | null = null,
): CanonicalListQuery {
    return patchListQuery(current, {
        view,
        savedViewId: null,
        filters: {
            owner: owner === null || owner === undefined || owner === ''
                ? null
                : String(owner),
        },
    });
}

/**
 * Saved filter pill. Existing write path replaces chrome filters
 * with extras + `filter_id` only.
 */
export function applySavedFilter(
    current: CanonicalListQuery,
    id: number,
    extras: Partial<ListQueryExtras> = {},
): CanonicalListQuery {
    const next = emptyCanonicalListQuery();

    return {
        ...next,
        savedViewId: id,
        extras: {
            ...next.extras,
            ...current.extras,
            ...extras,
        },
    };
}

/**
 * Pipeline switch. Stage slugs are pipeline-scoped — drop `stage`.
 * Preserve search, filters, sort, view, saved view, extras besides pipeline.
 * Meaning change resets page.
 */
export function applyPipeline(
    current: CanonicalListQuery,
    pipelineId: number | null,
): CanonicalListQuery {
    return patchListQuery(current, {
        extras: { pipeline: pipelineId },
        filters: { stage: null },
    });
}

/**
 * Deal stage pill / ticket status pill. Preserve pipeline and unrelated keys.
 */
export function applyStageFilter(
    current: CanonicalListQuery,
    slug: string | null,
    key: 'stage' | 'status' = 'stage',
): CanonicalListQuery {
    return patchListQuery(current, {
        filters: { [key]: slug },
    });
}
