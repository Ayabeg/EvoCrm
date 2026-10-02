import {
    BACKEND_FILTER_OPERATORS,
    shouldOfferFilterGroups,
} from '@/evo/data/adapters/backend-capabilities';
import type { ListPageResource } from '@/evo/data/adapters/backend-capabilities';
import type { FilterGroup, FilterRule, ListFieldDef, ListViewFilters } from '@/lib/list-view-config';
import { defaultFilterGroups } from '@/lib/list-view-config';

export { shouldOfferFilterGroups };
export type { ListPageResource };


export type FilterTreeNode =
    | { kind: 'group'; logic: 'and' | 'or'; children: FilterTreeNode[] }
    | { kind: 'rule'; rule: FilterRule };

const supported = new Set<string>(BACKEND_FILTER_OPERATORS);

export function flattenToWorkspaceFilters(
    tree: FilterTreeNode | null | undefined,
    options?: { resource?: ListPageResource; allowGroups?: boolean },
): ListViewFilters {
    const offerGroups =
        options?.allowGroups ?? (options?.resource ? shouldOfferFilterGroups(options.resource) : true);

    if (!tree) {
        return collapseUnlessGroupsOffered(defaultFilterGroups(), offerGroups);
    }

    if (tree.kind === 'rule') {
        return collapseUnlessGroupsOffered(
            {
                logic: 'and',
                groups: [{ logic: 'and', rules: [sanitizeRule(tree.rule)].filter(Boolean) as FilterRule[] }],
            },
            offerGroups,
        );
    }

    const groups: FilterGroup[] = [];

    for (const child of tree.children) {
        if (child.kind === 'rule') {
            const rule = sanitizeRule(child.rule);

            if (rule) {
                groups.push({ logic: 'and', rules: [rule] });
            }

            continue;
        }

        const rules = child.children
            .flatMap((node) => collectRules(node))
            .map(sanitizeRule)
            .filter((rule): rule is FilterRule => rule !== null);

        groups.push({ logic: child.logic, rules });
    }

    return collapseUnlessGroupsOffered(
        {
            logic: tree.logic,
            groups: groups.length > 0 ? groups : defaultFilterGroups().groups,
        },
        offerGroups,
    );
}

function collapseUnlessGroupsOffered(filters: ListViewFilters, offerGroups: boolean): ListViewFilters {
    if (offerGroups) {
        return filters;
    }

    return {
        logic: 'and',
        groups: [{ logic: 'and', rules: filters.groups.flatMap((group) => group.rules) }],
    };
}

export function workspaceFiltersToTree(filters: ListViewFilters | null | undefined): FilterTreeNode {
    const source = filters?.groups?.length ? filters : defaultFilterGroups();

    return {
        kind: 'group',
        logic: source.logic,
        children: source.groups.map((group) => ({
            kind: 'group',
            logic: group.logic,
            children: group.rules.map((rule) => ({ kind: 'rule' as const, rule })),
        })),
    };
}

export function sanitizeRule(rule: FilterRule): FilterRule | null {
    if (!rule.field || !supported.has(rule.operator)) {
        return null;
    }

    return {
        field: rule.field,
        operator: rule.operator,
        value: rule.value ?? null,
    };
}

function collectRules(node: FilterTreeNode): FilterRule[] {
    if (node.kind === 'rule') {
        return [node.rule];
    }

    return node.children.flatMap(collectRules);
}

export function fieldLabel(fields: ListFieldDef[], id: string): string {
    return fields.find((field) => field.id === id)?.label ?? id;
}
