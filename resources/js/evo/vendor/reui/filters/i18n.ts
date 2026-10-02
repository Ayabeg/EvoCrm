/**
 * Registry: ReUI — filters-i18n
 * Source: https://reui.io/components/filters
 * Upstream: https://github.com/keenthemes/reui @ 6e433ddaba3a4be38182c8c8883b6cc335183c42
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: English keys via t().
 */

import { t } from '@/lib/i18n';

export const filtersKeys = {
    addFilter: 'Add filter',
    addGroup: 'Add group',
    addCondition: 'Add a condition',
    and: 'AND',
    or: 'OR',
    field: 'Field',
    operator: 'Operator',
    value: 'Value',
    apply: 'Apply',
    clear: 'Clear',
    advanced: 'Advanced filters',
    search: 'Search',
    savedViews: 'Saved views',
    saveView: 'Save view',
    operators: {
        eq: 'is',
        neq: 'is not',
        contains: 'contains',
        gt: 'greater than',
        gte: 'greater than or equal',
        lt: 'less than',
        lte: 'less than or equal',
        is_true: 'is true',
        is_false: 'is false',
        is_set: 'is set',
        is_not_set: 'is not set',
        in: 'is among',
        before: 'before',
        after: 'after',
    },
} as const;

function translateDeep<T>(value: T): T {
    if (typeof value === 'string') {
        return t(value) as T;
    }

    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, inner]) => [key, translateDeep(inner)]),
        ) as T;
    }

    return value;
}

export const filtersFr = new Proxy(filtersKeys, {
    get(target, property) {
        const value = target[property as keyof typeof target];

        return translateDeep(value);
    },
}) as typeof filtersKeys;
