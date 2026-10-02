import { router } from '@inertiajs/react';

import { listQueryHref } from '@/lib/list-query/serialize';
import type { CanonicalListQuery, ListQueryObject } from '@/lib/list-query/types';

export type EvoListUrlOptions = {
    preserveState?: boolean;
    preserveScroll?: boolean;
    replace?: boolean;
};

/**
 * URL state for grid / filter / view. No nuqs.
 * Always Inertia `router.get` with preserveState + preserveScroll + replace.
 */
export function replaceListUrl(
    basePath: string,
    query: CanonicalListQuery,
    object: ListQueryObject,
    options: EvoListUrlOptions = {},
): void {
    router.get(listQueryHref(basePath, query, object), {}, {
        preserveState: options.preserveState ?? true,
        preserveScroll: options.preserveScroll ?? true,
        replace: options.replace ?? true,
    });
}

export function pushListUrl(
    basePath: string,
    query: CanonicalListQuery,
    object: ListQueryObject,
    options: EvoListUrlOptions = {},
): void {
    replaceListUrl(basePath, query, object, { ...options, replace: false });
}
