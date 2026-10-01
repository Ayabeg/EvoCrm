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
