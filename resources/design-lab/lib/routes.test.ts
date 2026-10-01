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
