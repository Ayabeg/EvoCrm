import { describe, expect, it } from 'vitest';
import { BACKEND_FILTER_DEPTH, LIST_PAGES_EXECUTE_FILTER_GROUPS } from './backend-capabilities';
import {
    flattenToWorkspaceFilters,
    sanitizeRule,
    shouldOfferFilterGroups,
    workspaceFiltersToTree,
} from './filter-adapter';

describe('filter adapter', () => {
    it('flattens nested ReUI trees to two-level workspace filters', () => {
        const flat = flattenToWorkspaceFilters({
            kind: 'group',
            logic: 'and',
            children: [
                {
                    kind: 'group',
                    logic: 'or',
                    children: [
                        {
                            kind: 'group',
                            logic: 'and',
                            children: [
                                { kind: 'rule', rule: { field: 'city', operator: 'eq', value: 'Alger' } },
                            ],
                        },
                        { kind: 'rule', rule: { field: 'source', operator: 'eq', value: 'whatsapp' } },
                    ],
                },
            ],
        });

        expect(flat.logic).toBe('and');
        expect(flat.groups).toHaveLength(1);
        expect(flat.groups[0]?.logic).toBe('or');
        expect(flat.groups[0]?.rules).toHaveLength(2);
        expect(BACKEND_FILTER_DEPTH).toBe(2);
    });

    it('drops unsupported operators', () => {
        expect(
            sanitizeRule({ field: 'city', operator: 'eq', value: 'Alger' }),
        ).toEqual({ field: 'city', operator: 'eq', value: 'Alger' });
        expect(
            sanitizeRule({
                field: 'city',
                operator: 'between' as 'eq',
                value: 'x',
            }),
        ).toBeNull();
    });

    it('round-trips workspace filters through the tree', () => {
        const filters = {
            logic: 'or' as const,
            groups: [
                {
                    logic: 'and' as const,
                    rules: [{ field: 'city', operator: 'eq' as const, value: 'Alger' }],
                },
            ],
        };

        expect(flattenToWorkspaceFilters(workspaceFiltersToTree(filters))).toEqual(filters);
    });

    it('offers two-level filter groups on every CRM list index PR4 wired', () => {
        expect(LIST_PAGES_EXECUTE_FILTER_GROUPS.company).toBe(true);
        expect(shouldOfferFilterGroups('company')).toBe(true);
        expect(shouldOfferFilterGroups('contact')).toBe(true);
        expect(shouldOfferFilterGroups('deal')).toBe(true);
        expect(shouldOfferFilterGroups('ticket')).toBe(true);
        expect(shouldOfferFilterGroups('quote')).toBe(true);
        expect(shouldOfferFilterGroups('lead')).toBe(true);

        const tree = workspaceFiltersToTree({
            logic: 'or',
            groups: [
                { logic: 'and', rules: [{ field: 'city', operator: 'eq', value: 'Alger' }] },
                { logic: 'and', rules: [{ field: 'source', operator: 'eq', value: 'whatsapp' }] },
            ],
        });

        const company = flattenToWorkspaceFilters(tree, { resource: 'company' });
        expect(company.groups).toHaveLength(2);

        const contact = flattenToWorkspaceFilters(tree, { resource: 'contact' });
        expect(contact.logic).toBe('or');
        expect(contact.groups).toHaveLength(2);
    });
});
