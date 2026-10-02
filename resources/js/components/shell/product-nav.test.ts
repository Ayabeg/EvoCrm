import { describe, expect, it } from 'vitest';
import {
    NAV_SECTIONS,
    activeNavId,
    activeParentId,
    isNavigationChildActive,
    visibleSections,
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
            'inbox',
            'leads',
            'contacts',
            'companies',
            'deals',
            'quotes',
            'activities',
        ]);
        const sections = visibleSections(true, allowed, features, null);
        const ids = sections.flatMap((section) =>
            section.items.flatMap((item) => [
                item.id,
                ...(item.children ?? []).map((child) => child.id),
            ]),
        );

        expect(ids).toContain('crm');
        expect(ids).toContain('deals-all');
        expect(ids).not.toContain('outbound');
        expect(ids).not.toContain('tickets');
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
    });
});
