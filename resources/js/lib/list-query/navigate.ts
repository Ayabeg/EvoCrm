import { router } from '@inertiajs/react';
import { patchListQuery } from '@/lib/list-query/patch';
import { listQueryHref } from '@/lib/list-query/serialize';
import type { CanonicalListQuery, ListQueryObject, ListQueryPatch } from '@/lib/list-query/types';

export type NavigateListQueryOptions = {
    preserveState?: boolean;
    preserveScroll?: boolean;
};

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
    const href = listQueryHref(basePath, patchListQuery(current, patch), object);

    router.get(href, {}, {
        preserveState: options.preserveState ?? true,
        ...(options.preserveScroll === undefined
            ? {}
            : { preserveScroll: options.preserveScroll }),
    });
}
