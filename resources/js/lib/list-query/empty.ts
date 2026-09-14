import type {
    CanonicalListQuery,
    ListQueryExtras,
    ListQueryFilters,
    ListQuerySort,
} from '@/lib/list-query/types';
import type { ListViewFilters } from '@/lib/list-view-config';

export function emptyListQueryFilters(): ListQueryFilters {
    return {
        owner: null,
        created: null,
        last_activity: null,
        status: null,
        stage: null,
        city: null,
        wilaya: null,
        unanswered: null,
        unassigned: null,
        priority: null,
        channel: null,
    };
}

export function emptyListQueryExtras(): ListQueryExtras {
    return {
        pipeline: null,
    };
}

export function emptyCanonicalListQuery(): CanonicalListQuery {
    return {
        search: null,
        page: null,
        view: 'all',
        savedViewId: null,
        filters: emptyListQueryFilters(),
        filterGroups: null,
        sort: null,
        extras: emptyListQueryExtras(),
    };
}

export function isEmptyFilterGroups(groups: ListViewFilters | null): boolean {
    if (!groups?.groups?.length) {
        return true;
    }

    return !groups.groups.some((group) => group.rules.length > 0);
}

export function isListQuerySort(value: unknown): value is ListQuerySort {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const sort = value as { field?: unknown; direction?: unknown };

    return (
        typeof sort.field === 'string' &&
        sort.field !== '' &&
        (sort.direction === 'asc' || sort.direction === 'desc')
    );
}

/**
 * URL-owned sort only. Inertia `activeFilters.sort` is often the
 * saved-view / default object — that is listView state, not a URL param.
 */
export function parseUrlSort(
    sort: unknown,
    direction: unknown,
): ListQuerySort | null {
    if (typeof sort !== 'string') {
        return null;
    }

    const field = sort.trim();

    if (field === '') {
        return null;
    }

    return {
        field,
        direction: direction === 'asc' ? 'asc' : 'desc',
    };
}

export function emptyToNull(value: unknown): string | null {
    if (value === null || value === undefined || value === false) {
        return null;
    }

    const text = String(value).trim();

    return text === '' ? null : text;
}

export function toOptionalNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
}

export function toOptionalBoolean(value: unknown): boolean | null {
    if (value === true || value === 1 || value === '1') {
        return true;
    }

    if (value === false || value === 0 || value === '0' || value === null || value === undefined || value === '') {
        return null;
    }

    return value ? true : null;
}

export function normalizePage(page: number | null | undefined): number | null {
    if (page === null || page === undefined || page <= 1) {
        return null;
    }

    return page;
}
