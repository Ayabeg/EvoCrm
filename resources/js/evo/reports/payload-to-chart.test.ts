import { describe, expect, it } from 'vitest';

import { chartKind, payloadToCartesian, payloadToDonut } from '@/evo/reports/payload-to-chart';
import type { EvoVizPayload } from '@/evoviz';

const payload: EvoVizPayload = {
    id: 'evoviz.bar',
    title: 'Pipeline',
    labels: ['Nouveau', 'Gagné'],
    series: [
        { name: 'Affaires', data: [4, 2] },
        { name: 'Montant', data: [1280000, 640000] },
    ],
};

describe('payloadToCartesian', () => {
    it('aligns labels to series keys without orange defaults', () => {
        const { data, series } = payloadToCartesian(payload);

        expect(data).toEqual([
            { label: 'Nouveau', affaires: 4, montant: 1280000 },
            { label: 'Gagné', affaires: 2, montant: 640000 },
        ]);
        expect(series.map((item) => item.dataKey)).toEqual(['affaires', 'montant']);
        expect(series[0]?.color).toBe('var(--evo-chart-1)');
        expect(series[1]?.color).toBe('var(--evo-chart-2)');
    });
});

describe('payloadToDonut', () => {
    it('uses the first series as slices', () => {
        expect(payloadToDonut(payload)).toEqual([
            { name: 'Nouveau', value: 4, color: 'var(--evo-chart-1)' },
            { name: 'Gagné', value: 2, color: 'var(--evo-chart-2)' },
        ]);
    });
});

describe('chartKind', () => {
    it('maps evoviz ids to evo chart kinds', () => {
        expect(chartKind('evoviz.line')).toBe('line');
        expect(chartKind('evoviz.area')).toBe('area');
        expect(chartKind('evoviz.bar-horizontal')).toBe('horizontal');
        expect(chartKind('evoviz.donut')).toBe('donut');
        expect(chartKind('evoviz.kpi-spark')).toBe('spark');
        expect(chartKind('evoviz.bar')).toBe('bar');
    });
});
