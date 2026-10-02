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

describe('design-lab shell route', () => {
    it('parses /design-lab/shell as the shell page', () => {
        expect(parseLabLocation('/design-lab/shell', '')).toEqual({
            name: 'shell',
        });
        expect(routePath({ name: 'shell' })).toBe('/shell');
        expect(labHref({ name: 'shell' })).toMatch(/shell/);
    });
});
