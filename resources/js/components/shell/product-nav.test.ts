import { describe, expect, it } from 'vitest';
import {
    NAV_SECTIONS,
    activeNavId,
    activeParentId,
    isNavigationChildActive,
    visibleSections,
    visibleSimpleItems,
} from './product-nav';

const features = {
    tickets: true,
    sms: true,
    ask_evo: true,
    ads: true,
    warmup: true,
    report_builder: true,
};

describe('hierarchical product navigation', () => {
    it('selects the deepest child for a record route and its parent', () => {
        const sections = visibleSections(false, null, features, null);

        expect(activeNavId('/crm/deals/board?view=kanban', sections)).toBe(
            'deals-pipeline',
        );
        expect(activeParentId('/crm/deals/board', sections)).toBe('deals');
    });

    it('normalizes trailing slashes and query strings', () => {
        const reports = NAV_SECTIONS.find((section) => section.id === 'analyze')
            ?.items[0];
        const overview = reports?.children?.find(
            (child) => child.id === 'reports-home',
        );

        expect(overview).toBeDefined();
        expect(isNavigationChildActive('/reports/?tab=activity', overview!)).toBe(
            true,
        );
    });

    it('keeps only simple-mode destinations in their canonical groups', () => {
        const allowed = new Set([
            'home',
            'contacts',
            'deals',
            'inbox',
            'quotes',
        ]);
        const sections = visibleSections(true, allowed, features, null);
        const ids = sections.flatMap((section) =>
            section.items.flatMap((item) => [
                item.id,
                ...(item.children ?? []).map((child) => child.id),
            ]),
        );

        expect(ids).toContain('home');
        expect(ids).toContain('contacts');
        expect(ids).toContain('deals');
        expect(ids).toContain('inbox');
        expect(ids).toContain('quotes');
        expect(ids).toContain('deals-all');
        expect(ids).not.toContain('companies');
        expect(ids).not.toContain('leads');
        expect(ids).not.toContain('activities');
        expect(ids).not.toContain('outbound');
        expect(ids).not.toContain('tickets');
        expect(ids).not.toContain('reports');
    });

    it('filters feature-gated groups before rendering them', () => {
        const sections = visibleSections(
            false,
            null,
            { ...features, ads: false, tickets: false },
            null,
        );
        const ids = sections.flatMap((section) =>
            section.items.map((item) => item.id),
        );

        expect(ids).not.toContain('ads');
        expect(ids).not.toContain('tickets');
    });

    it('filters restricted destinations by capability', () => {
        const sections = visibleSections(
            false,
            null,
            features,
            new Set(['crm.view']),
        );
        const ids = sections.flatMap((section) =>
            section.items.map((item) => item.id),
        );

        expect(ids).not.toContain('outbound');
        expect(ids).not.toContain('ads');
        expect(ids).toContain('crm');
        expect(ids).toContain('agents');
    });

    it('keeps SIMPLE_NAV hrefs and hides Agents from Simple Mode', () => {
        const allowed = new Set([
            'home',
            'contacts',
            'deals',
            'inbox',
            'quotes',
        ]);
        const simple = visibleSections(true, allowed, features, null);
        const full = visibleSections(false, null, features, null);
        const simpleIds = simple.flatMap((section) =>
            section.items.flatMap((item) => [
                item.id,
                ...(item.children ?? []).map((child) => child.id),
            ]),
        );
        const fullIds = full.flatMap((section) =>
            section.items.map((item) => item.id),
        );
        const fullLeafIds = full.flatMap((section) =>
            section.items.flatMap((item) => [
                item.id,
                ...(item.children ?? []).map((child) => child.id),
            ]),
        );

        expect(simpleIds).toEqual(
            expect.arrayContaining([
                'home',
                'contacts',
                'deals',
                'inbox',
                'quotes',
            ]),
        );
        expect(simpleIds).not.toContain('companies');
        expect(simpleIds).not.toContain('leads');
        expect(simpleIds).not.toContain('activities');
        expect(simpleIds).not.toContain('agents');
        expect(simpleIds).not.toContain('outbound');
        expect(simpleIds).not.toContain('reports');
        expect(fullIds).toContain('agents');
        expect(fullLeafIds).toEqual(
            expect.arrayContaining(['companies', 'leads', 'activities']),
        );
        expect(NAV_SECTIONS.some((section) => section.id === 'pilot')).toBe(
            true,
        );
    });

    it('flattens Simple Mode to Accueil Contacts Deals Inbox Devis in that order', () => {
        const items = visibleSimpleItems(
            [
                { id: 'home' },
                { id: 'contacts' },
                { id: 'deals' },
                { id: 'inbox' },
                { id: 'quotes' },
            ],
            features,
            null,
        );

        expect(items.map((item) => item.id)).toEqual([
            'home',
            'contacts',
            'deals',
            'inbox',
            'quotes',
        ]);
        expect(items.map((item) => item.href)).toEqual([
            '/dashboard',
            '/crm/contacts',
            '/crm/deals',
            '/inbox',
            '/crm/quotes',
        ]);
        expect(items.every((item) => !item.children?.length)).toBe(true);
        expect(items.map((item) => item.labelKey)).toEqual([
            'nav.home',
            'nav.crm.contacts',
            'nav.deals.title',
            'nav.inbox',
            'nav.quotes.title',
        ]);
    });
});
