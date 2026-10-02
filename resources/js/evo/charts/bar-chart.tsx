/**
 * Evo Design System — BarChart
 * Registry: Recharts BarChart
 * Source: https://github.com/recharts/recharts
 * License: MIT
 * Copied: 2026-10-02
 */

import { Bar, BarChart as RechartsBarChart, ResponsiveContainer } from 'recharts';
import type { BarProps } from 'recharts';

import { ChartGrid, ChartXAxis, ChartYAxis } from '@/evo/charts/axis';
import { ChartLegend } from '@/evo/charts/legend';
import type { CartesianChartProps } from '@/evo/charts/line-chart';
import { seriesColor } from '@/evo/charts/tokens';
import { ChartTooltip } from '@/evo/charts/tooltip';
import { usePrefersReducedMotion } from '@/evo/lib/motion';

export function BarChart({
    data,
    series,
    xKey = 'label',
    height = 280,
    className,
    showLegend = false,
    showGrid = true,
    yTickFormatter,
}: CartesianChartProps) {
    const reduced = usePrefersReducedMotion();

    return (
        <ResponsiveContainer width="100%" height={height} className={className}>
            <RechartsBarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                {showGrid ? <ChartGrid /> : null}
                <ChartXAxis dataKey={xKey} />
                <ChartYAxis tickFormatter={yTickFormatter} />
                <ChartTooltip />
                {showLegend ? <ChartLegend /> : null}
                {series.map((item, index) => (
                    <Bar
                        key={item.dataKey}
                        dataKey={item.dataKey}
                        name={item.name ?? item.dataKey}
                        fill={item.color ?? seriesColor(index)}
                        radius={[2, 2, 0, 0]}
                        maxBarSize={28}
                        isAnimationActive={!reduced}
                    />
                ))}
            </RechartsBarChart>
        </ResponsiveContainer>
    );
}

export function ChartBar(props: BarProps) {
    const reduced = usePrefersReducedMotion();

    return (
        <Bar
            fill={props.fill ?? seriesColor(0)}
            radius={[2, 2, 0, 0]}
            maxBarSize={28}
            isAnimationActive={!reduced}
            {...props}
        />
    );
}
