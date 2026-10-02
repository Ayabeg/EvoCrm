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
 * - Company index uses `CrmFilter::apply()` so groups run
 * - Segments preview / report builder / contact export also call `apply()`
 *
 * CANNOT / gaps:
 * - Nested groups deeper than 2 levels — silently dropped by parseFilterGroups
 * - Contact and Deal list controllers call `applyToContacts` / `applyToDeals`
 *   directly, so `filter_groups` do NOT affect those list pages today
 * - Tickets and quotes use controller `constrain()` — no CrmFilter groups
 * - Unknown operators are no-ops
 *
 * UI rule: FilterBuilder exposes only two levels. Nested ReUI trees are flattened
 * by `flattenToWorkspaceFilters` before URL / Inertia serialization.
 * Filter groups are offered only where LIST_PAGES_EXECUTE_FILTER_GROUPS is true
 * (company today). Contact / deal / ticket / quote / lead stay flat until PR4
 * wires CrmFilter::apply() on those indexes. Do not change the backend in PR3.
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
    contact: false,
    deal: false,
    ticket: false,
    quote: false,
    lead: false,
} as const;
