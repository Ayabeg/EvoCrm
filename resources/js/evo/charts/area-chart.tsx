/**
 * Evo Design System — AreaChart
 * Registry: Recharts AreaChart
 * Source: https://github.com/recharts/recharts
 * License: MIT
 * Copied: 2026-10-02
 */

import type { ComponentProps } from 'react';
import { Area, AreaChart as RechartsAreaChart, ResponsiveContainer } from 'recharts';

import { ChartGrid, ChartXAxis, ChartYAxis } from '@/evo/charts/axis';
import { ChartLegend } from '@/evo/charts/legend';
import type { CartesianChartProps } from '@/evo/charts/line-chart';
import { seriesColor } from '@/evo/charts/tokens';
import { ChartTooltip } from '@/evo/charts/tooltip';
import { usePrefersReducedMotion } from '@/evo/lib/motion';

export function AreaChart({
    data,
    series,
    xKey = 'label',
    height = 280,
    className,
    showLegend = true,
    showGrid = true,
    yTickFormatter,
}: CartesianChartProps) {
    const reduced = usePrefersReducedMotion();

    return (
        <ResponsiveContainer width="100%" height={height} className={className}>
            <RechartsAreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                {showGrid ? <ChartGrid /> : null}
                <ChartXAxis dataKey={xKey} />
                <ChartYAxis tickFormatter={yTickFormatter} />
                <ChartTooltip />
                {showLegend ? <ChartLegend /> : null}
                {series.map((item, index) => (
                    <Area
                        key={item.dataKey}
                        type="monotone"
                        dataKey={item.dataKey}
                        name={item.name ?? item.dataKey}
                        stroke={item.color ?? seriesColor(index === 0 ? 1 : index)}
                        fill={item.color ?? seriesColor(index === 0 ? 1 : index)}
                        fillOpacity={0.16}
                        strokeWidth={2}
                        isAnimationActive={!reduced}
                    />
                ))}
            </RechartsAreaChart>
        </ResponsiveContainer>
    );
}

export function ChartArea(props: ComponentProps<typeof Area>) {
    const reduced = usePrefersReducedMotion();

    return (
        <Area
            type="monotone"
            stroke={props.stroke ?? seriesColor(1)}
            fill={props.fill ?? seriesColor(1)}
            fillOpacity={0.16}
            strokeWidth={2}
            isAnimationActive={!reduced}
            {...props}
        />
    );
}
