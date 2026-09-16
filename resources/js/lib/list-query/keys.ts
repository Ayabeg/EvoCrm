/**
 * Explicit query-key classes. Do not treat filterFields as the
 * workspace bag, and do not preserve arbitrary URL strings.
 */

/** Shareable list-workspace concerns (canonical model). */
export const CANONICAL_WORKSPACE_KEYS = [
    'q',
    'page',
    'view',
    'filter_id',
    'filter_groups',
    'sort',
    'direction',
] as const;

/**
 * Chrome / FilterBar quick-filter keys. `filterFields()` projects these
 * for chips and GET forms. It is not the navigation bag.
 */
export const CHROME_FILTER_KEYS = [
    'owner',
    'created',
    'last_activity',
    'status',
    'stage',
    'city',
    'wilaya',
    'unanswered',
    'unassigned',
    'priority',
    'channel',
    'attention',
] as const;

/**
 * Valid siblings that are not chrome filters. Patching a filter must
 * keep these when the destination adapter accepts them.
 */
export const UNRELATED_PRESERVED_KEYS = ['sort', 'direction', 'pipeline'] as const;

/**
 * Known request keys that must not be rewritten or renamed into the
 * list contract. `owner_id` is a record field, not the list `owner` param.
 */
export const UNSAFE_QUERY_KEYS = [
    'owner_id',
    'columns',
    'create',
    'contact_id',
    'mode',
    'peek',
] as const;

/**
 * Backend-supported association / behavior keys. Chrome writes them
 * through `filter_groups`, not as top-level FilterBar params. Not
 * widened onto the chrome projection.
 */
export const BACKEND_ASSOCIATION_KEYS = [
    'deal_stage',
    'has_open_deal',
    'has_won_deal',
    'has_company',
    'has_associated_company',
    'deal_min_amount',
    'enrolled_in_sequence',
    'email_replied',
    'email_opened',
] as const;

export type ListQueryKeyClass =
    | 'canonical-workspace'
    | 'chrome-filter'
    | 'unrelated-preserved'
    | 'backend-association'
    | 'unsafe'
    | 'unknown';

export function classifyListQueryKey(key: string): ListQueryKeyClass {
    if ((UNSAFE_QUERY_KEYS as readonly string[]).includes(key)) {
        return 'unsafe';
    }

    if ((UNRELATED_PRESERVED_KEYS as readonly string[]).includes(key)) {
        return 'unrelated-preserved';
    }

    if ((CANONICAL_WORKSPACE_KEYS as readonly string[]).includes(key)) {
        return 'canonical-workspace';
    }

    if ((CHROME_FILTER_KEYS as readonly string[]).includes(key)) {
        return 'chrome-filter';
    }

    if ((BACKEND_ASSOCIATION_KEYS as readonly string[]).includes(key)) {
        return 'backend-association';
    }

    return 'unknown';
}
