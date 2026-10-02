import { describe, expect, it } from 'vitest';
import { formatCompactDzd, formatDzd } from './money';

describe('money DA lock', () => {
    it('never prints DZD for full or compact amounts', () => {
        expect(formatDzd(128_000_000).replace(/\s/g, ' ')).toBe('1 280 000 DA');
        expect(formatDzd(128_000_000)).not.toContain('DZD');

        const compact = formatCompactDzd(228_500_000);
        expect(compact).toContain('DA');
        expect(compact).not.toContain('DZD');
        expect(compact).not.toMatch(/K DZD|M DZD/);
    });
});
