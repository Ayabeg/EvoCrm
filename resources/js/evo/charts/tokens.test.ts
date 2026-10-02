import { describe, expect, it } from 'vitest';
import { CHART_HIGHLIGHT, CHART_SERIES, seriesColor } from './tokens';

describe('chart series tokens', () => {
    it('defaults to ink then teal CSS variables', () => {
        expect(CHART_SERIES[0]).toBe('var(--evo-chart-1)');
        expect(CHART_SERIES[1]).toBe('var(--evo-chart-2)');
        expect(CHART_HIGHLIGHT).toBe('var(--evo-chart-highlight)');
    });

    it('wraps series colors without inventing a sixth hue', () => {
        expect(seriesColor(5)).toBe(CHART_SERIES[0]);
        expect(seriesColor(6)).toBe(CHART_SERIES[1]);
    });
});
