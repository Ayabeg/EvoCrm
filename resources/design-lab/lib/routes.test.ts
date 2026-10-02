import { describe, expect, it } from 'vitest';
import { labHref, parseLabLocation, routePath } from './routes';

describe('design-lab token route', () => {
    it('parses /design-lab/tokens as the token page', () => {
        expect(parseLabLocation('/design-lab/tokens', '')).toEqual({
            name: 'tokens',
        });
        expect(routePath({ name: 'tokens' })).toBe('/tokens');
        expect(labHref({ name: 'tokens' })).toMatch(/tokens/);
    });

    it('parses /design-lab/components and /design-lab/data', () => {
        expect(parseLabLocation('/design-lab/components', '')).toEqual({
            name: 'components',
        });
        expect(parseLabLocation('/design-lab/data', '')).toEqual({
            name: 'data',
        });
        expect(routePath({ name: 'components' })).toBe('/components');
        expect(routePath({ name: 'data' })).toBe('/data');
    });

    it('parses /design-lab/agents as the agents states page', () => {
        expect(parseLabLocation('/design-lab/agents', '')).toEqual({
            name: 'agents',
        });
        expect(routePath({ name: 'agents' })).toBe('/agents');
        expect(labHref({ name: 'agents' })).toMatch(/agents/);
    });
});

describe('design-lab outbound route', () => {
    it('parses /design-lab/outbound as the outbound lab page', () => {
        expect(parseLabLocation('/design-lab/outbound', '')).toEqual({
            name: 'outbound',
            view: 'overview',
        });
        expect(parseLabLocation('/design-lab/outbound/sequences', '')).toEqual({
            name: 'outbound',
            view: 'sequences',
        });
        expect(routePath({ name: 'outbound' })).toBe('/outbound');
        expect(labHref({ name: 'outbound', view: 'sequences' })).toMatch(/outbound\/sequences/);
    });
});

describe('design-lab settings route', () => {
    it('parses /design-lab/settings as the settings family page', () => {
        expect(parseLabLocation('/design-lab/settings', '')).toEqual({
            name: 'settings',
        });
        expect(routePath({ name: 'settings' })).toBe('/settings');
        expect(labHref({ name: 'settings' })).toMatch(/settings/);
    });
});

describe('design-lab ads route', () => {
    it('parses /design-lab/ads and attribution', () => {
        expect(parseLabLocation('/design-lab/ads', '')).toEqual({
            name: 'ads',
            view: 'overview',
        });
        expect(parseLabLocation('/design-lab/ads/attribution', '')).toEqual({
            name: 'ads',
            view: 'attribution',
        });
        expect(parseLabLocation('/design-lab/ads/campaigns/campaign-wa-cliniques-alger', '')).toEqual({
            name: 'campaign',
            id: 'campaign-wa-cliniques-alger',
        });
        expect(routePath({ name: 'ads' })).toBe('/ads');
        expect(routePath({ name: 'ads', view: 'attribution' })).toBe('/ads/attribution');
    });
});

describe('design-lab reports route', () => {
    it('parses /design-lab/reports and report builder views', () => {
        expect(parseLabLocation('/design-lab/reports', '')).toEqual({
            name: 'reports',
            view: 'overview',
        });
        expect(parseLabLocation('/design-lab/reports/funnels', '')).toEqual({
            name: 'reports',
            view: 'funnels',
        });
        expect(parseLabLocation('/design-lab/reports/builder', '')).toEqual({
            name: 'reports',
            view: 'builder',
        });
        expect(parseLabLocation('/design-lab/reports/cross-object', '')).toEqual({
            name: 'reports',
            view: 'cross-object',
        });
        expect(routePath({ name: 'reports' })).toBe('/reports');
        expect(routePath({ name: 'reports', view: 'funnels' })).toBe('/reports/funnels');
    });
});

describe('design-lab automation route', () => {
    it('parses /design-lab/automation and WHEN/IF/THEN views', () => {
        expect(parseLabLocation('/design-lab/automation', '')).toEqual({
            name: 'automation',
            view: 'overview',
        });
        expect(parseLabLocation('/design-lab/automation/editor', '')).toEqual({
            name: 'automation',
            view: 'editor',
        });
        expect(parseLabLocation('/design-lab/automation/segments', '')).toEqual({
            name: 'automation',
            view: 'segments',
        });
        expect(parseLabLocation('/design-lab/automation/history', '')).toEqual({
            name: 'automation',
            view: 'history',
        });
        expect(routePath({ name: 'automation' })).toBe('/automation');
        expect(routePath({ name: 'automation', view: 'editor' })).toBe('/automation/editor');
        expect(labHref({ name: 'automation', view: 'history' })).toMatch(/automation\/history/);
    });
});

describe('design-lab shell route', () => {
    it('parses /design-lab/shell as the shell page', () => {
        expect(parseLabLocation('/design-lab/shell', '')).toEqual({
            name: 'shell',
        });
        expect(routePath({ name: 'shell' })).toBe('/shell');
        expect(labHref({ name: 'shell' })).toMatch(/shell/);
    });
});
