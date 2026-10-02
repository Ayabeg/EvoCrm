/**
 * Evo charts — default series. Ink then teal; orange is opt-in highlight only.
 * Values are CSS variables so light/dark resolve from evo tokens.
 */

export const CHART_SERIES = [
    'var(--evo-chart-1)',
    'var(--evo-chart-2)',
    'var(--evo-chart-3)',
    'var(--evo-chart-4)',
    'var(--evo-chart-5)',
] as const;

export const CHART_HIGHLIGHT = 'var(--evo-chart-highlight)';

export const CHART_GRID = 'var(--evo-hairline)';
export const CHART_TICK = 'var(--evo-ink-muted)';
export const CHART_AXIS = 'var(--evo-hairline)';

export function seriesColor(index: number): string {
    return CHART_SERIES[index % CHART_SERIES.length] ?? CHART_SERIES[0];
}
