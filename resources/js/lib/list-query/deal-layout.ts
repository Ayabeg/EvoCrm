import { fromActiveFilters, listQueryHref } from '@/lib/list-query/serialize';
import type { ActiveFilterBag, ListQueryExtraInput } from '@/lib/list-query/serialize';
import type { CanonicalListQuery } from '@/lib/list-query/types';

export const DEAL_LIST_PATH = '/crm/deals';
export const DEAL_BOARD_PATH = '/crm/deals/board';

export type DealLayoutTarget = 'list' | 'board';

/**
 * List ↔ Board share one Deal query. Board is not paginated, so `page`
 * is dropped when targeting board (documented page reset). Compatible
 * siblings stay: search, view, filter_id, chrome filters, filter_groups,
 * sort/direction, pipeline. Never writes peek / mode / create.
 */
export function dealLayoutQuery(
    current: CanonicalListQuery,
    target: DealLayoutTarget,
): CanonicalListQuery {
    return {
        ...current,
        page: target === 'board' ? null : current.page,
        filters: { ...current.filters },
        extras: { ...current.extras },
        sort: current.sort ? { ...current.sort } : null,
        filterGroups: current.filterGroups,
    };
}

export function dealLayoutPath(target: DealLayoutTarget): string {
    return target === 'board' ? DEAL_BOARD_PATH : DEAL_LIST_PATH;
}

export function dealLayoutHref(
    current: CanonicalListQuery,
    target: DealLayoutTarget,
): string {
    return listQueryHref(dealLayoutPath(target), dealLayoutQuery(current, target), 'deal');
}

export function dealLayoutHrefFromFilters(
    filters: ActiveFilterBag,
    extra: ListQueryExtraInput | undefined,
    target: DealLayoutTarget,
): string {
    return dealLayoutHref(fromActiveFilters(filters, extra), target);
}
