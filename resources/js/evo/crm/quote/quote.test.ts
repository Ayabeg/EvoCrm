import { describe, expect, it } from 'vitest';
import type { QuoteLine } from '@/evo/crm/quote/types';

function lineTotal(line: QuoteLine): number {
    return Math.round((line.quantity || 0) * (line.unitDzd || 0));
}

describe('quote money', () => {
    it('totals the Clinique bloc opératoire quote v2 at 1 280 000 DA', () => {
        const items: QuoteLine[] = [
            { name: 'Scialytique LED', quantity: 1, unitDzd: 780_000 },
            { name: 'Table d’opération', quantity: 1, unitDzd: 500_000 },
        ];

        expect(items.reduce((sum, row) => sum + lineTotal(row), 0)).toBe(
            1_280_000,
        );
    });
});
