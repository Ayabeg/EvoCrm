import { router } from '@inertiajs/react';
import { patchListQuery } from '@/lib/list-query/patch';
import { listQueryHref } from '@/lib/list-query/serialize';
import type { CanonicalListQuery, ListQueryObject, ListQueryPatch } from '@/lib/list-query/types';

export type NavigateListQueryOptions = {
    preserveState?: boolean;
    preserveScroll?: boolean;
};

function visitHref(href: string, options: NavigateListQueryOptions = {}): void {
    router.get(href, {}, {
        preserveState: options.preserveState ?? true,
        ...(options.preserveScroll === undefined
            ? {}
            : { preserveScroll: options.preserveScroll }),
    });
}

/**
 * One user action → one Inertia GET. Use when the next query is
 * already built (pipeline switch, tests). Do not add a second visit.
 */
export function visitListQuery(
    basePath: string,
    query: CanonicalListQuery,
    object: ListQueryObject,
    options: NavigateListQueryOptions = {},
): void {
    visitHref(listQueryHref(basePath, query, object), options);
}

/**
 * One user action → one Inertia GET. Existing chrome options:
 * FilterBar / chips / views use `{ preserveState: true }` and do not
 * set preserveScroll. Do not add a second visit or an effect loop.
 */
export function navigateListQuery(
    basePath: string,
    current: CanonicalListQuery,
    patch: ListQueryPatch,
    object: ListQueryObject,
    options: NavigateListQueryOptions = {},
): void {
    visitListQuery(basePath, patchListQuery(current, patch), object, options);
}
