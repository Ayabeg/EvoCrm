/**
 * Backend filter support findings (PR3).
 *
 * Verified against `app/Services/Crm/CrmFilter.php` and list controllers.
 *
 * CAN execute:
 * - Top-level `filter_groups`: `{ logic: 'and'|'or', groups: [{ logic, rules: [...] }] }`
 * - Two levels only: group logic + rule logic. No nested `groups` inside a group.
 * - Operators: eq, neq, contains, gt, gte, lt, lte, before, after,
 *   is_set, is_not_set, is_true, is_false, in
 * - Custom attributes via `custom:{key}`
 * - Company / contact / deal / ticket / quote / lead indexes call
 *   `CrmFilter::apply()` so two-level `filter_groups` execute (PR4).
 * - Segments preview / report builder / contact + deal export also call `apply()`
 *
 * CANNOT / gaps:
 * - Nested groups deeper than 2 levels — silently dropped by parseFilterGroups
 * - Unknown operators are no-ops
 * - Deal board calls `apply('deal')` so two-level `filter_groups` execute (PR5)
 *
 * UI rule: FilterBuilder exposes only two levels. Nested ReUI trees are flattened
 * by `flattenToWorkspaceFilters` before URL / Inertia serialization.
 * Filter groups are offered where LIST_PAGES_EXECUTE_FILTER_GROUPS is true.
 */

export type ListPageResource = keyof typeof LIST_PAGES_EXECUTE_FILTER_GROUPS;

export function shouldOfferFilterGroups(resource: ListPageResource): boolean {
    return LIST_PAGES_EXECUTE_FILTER_GROUPS[resource];
}

export const BACKEND_FILTER_OPERATORS = [
    'eq',
    'neq',
    'contains',
    'gt',
    'gte',
    'lt',
    'lte',
    'is_true',
    'is_false',
    'is_set',
    'is_not_set',
    'in',
    'before',
    'after',
] as const;

export const BACKEND_FILTER_DEPTH = 2;

export const LIST_PAGES_EXECUTE_FILTER_GROUPS = {
    company: true,
    contact: true,
    deal: true,
    ticket: true,
    quote: true,
    lead: true,
} as const;
