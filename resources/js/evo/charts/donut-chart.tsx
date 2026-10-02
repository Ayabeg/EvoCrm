/**
 * Evo Design System — DonutChart
 * Registry: Recharts PieChart
 * Source: https://github.com/recharts/recharts
 * License: MIT
 * Copied: 2026-10-02
 * Modified: additive PR10 wrapper; ink/teal slices; --evo-* only.
 */

import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

import { ChartLegend } from '@/evo/charts/legend';
import { seriesColor } from '@/evo/charts/tokens';
import { ChartTooltip } from '@/evo/charts/tooltip';
import { usePrefersReducedMotion } from '@/evo/lib/motion';

export type DonutSlice = {
    name: string;
    value: number;
    color?: string;
};

export type DonutChartProps = {
    data: DonutSlice[];
    height?: number;
    className?: string;
    innerRadius?: number;
    outerRadius?: number;
    showLegend?: boolean;
};

export function DonutChart({
    data,
    height = 220,
    className,
    innerRadius = 48,
    outerRadius = 72,
    showLegend = true,
}: DonutChartProps) {
    const reduced = usePrefersReducedMotion();

    return (
        <ResponsiveContainer width="100%" height={height} className={className}>
            <PieChart>
                <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={innerRadius}
                    outerRadius={outerRadius}
                    paddingAngle={1}
                    isAnimationActive={!reduced}
                >
                    {data.map((slice, index) => (
                        <Cell key={slice.name} fill={slice.color ?? seriesColor(index)} />
                    ))}
                </Pie>
                <ChartTooltip />
                {showLegend ? <ChartLegend /> : null}
            </PieChart>
        </ResponsiveContainer>
    );
}
