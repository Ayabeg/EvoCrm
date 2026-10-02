/**
 * Evo Design System — Chart axes / grid
 * Registry: Recharts CartesianGrid / XAxis / YAxis
 * Source: https://github.com/recharts/recharts
 * License: MIT
 * Copied: 2026-10-02
 * Modified: ink/teal tick + hairline grid defaults.
 */

import { CartesianGrid, XAxis, YAxis } from 'recharts';
import type { CartesianGridProps, XAxisProps, YAxisProps } from 'recharts';

import { CHART_AXIS, CHART_GRID, CHART_TICK } from '@/evo/charts/tokens';

export function ChartGrid(props: CartesianGridProps) {
    return (
        <CartesianGrid
            stroke={CHART_GRID}
            vertical={false}
            strokeDasharray="0"
            {...props}
        />
    );
}

export function ChartXAxis(props: XAxisProps) {
    return (
        <XAxis
            tick={{ fill: CHART_TICK, fontSize: 11 }}
            axisLine={{ stroke: CHART_AXIS }}
            tickLine={false}
            {...props}
        />
    );
}

export function ChartYAxis(props: YAxisProps) {
    return (
        <YAxis
            tick={{ fill: CHART_TICK, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={40}
            {...props}
        />
    );
}
