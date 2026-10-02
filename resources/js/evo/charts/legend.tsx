/**
 * Evo Design System — ChartLegend
 * Registry: evilcharts — recharts-legend (wrapper)
 * Source: https://github.com/legions-developer/evilcharts
 * License: MIT
 * Copied: 2026-10-02
 */

import { Legend as RechartsLegend } from 'recharts';
import type { LegendProps } from 'recharts';

export function ChartLegend(props: LegendProps) {
    return (
        <RechartsLegend
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            wrapperStyle={{ fontSize: 12, color: 'var(--evo-ink-secondary)' }}
            {...props}
        />
    );
}
