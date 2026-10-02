/**
 * Evo Design System — ComposedChart
 * Registry: Recharts ComposedChart
 * Source: https://github.com/recharts/recharts
 * License: MIT
 * Copied: 2026-10-02
 */

import { Bar, ComposedChart as RechartsComposedChart, Line, ResponsiveContainer } from 'recharts';

import { ChartGrid, ChartXAxis, ChartYAxis } from '@/evo/charts/axis';
import { ChartLegend } from '@/evo/charts/legend';
import type { CartesianChartProps } from '@/evo/charts/line-chart';
import { seriesColor } from '@/evo/charts/tokens';
import { ChartTooltip } from '@/evo/charts/tooltip';
import { usePrefersReducedMotion } from '@/evo/lib/motion';

export type ComposedSeries = CartesianChartProps['series'][number] & {
    type: 'bar' | 'line';
};

export function ComposedChart({
    data,
    series,
    xKey = 'label',
    height = 280,
    className,
    showLegend = true,
    showGrid = true,
    yTickFormatter,
    rightYTickFormatter,
}: Omit<CartesianChartProps, 'series'> & { series: ComposedSeries[] }) {
    const reduced = usePrefersReducedMotion();
    const hasRight = series.some((item) => item.yAxisId === 'right');

    return (
        <ResponsiveContainer width="100%" height={height} className={className}>
            <RechartsComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                {showGrid ? <ChartGrid /> : null}
                <ChartXAxis dataKey={xKey} />
                <ChartYAxis yAxisId="left" tickFormatter={yTickFormatter} />
                {hasRight ? (
                    <ChartYAxis
                        yAxisId="right"
                        orientation="right"
                        tickFormatter={rightYTickFormatter}
                    />
                ) : null}
                <ChartTooltip />
                {showLegend ? <ChartLegend /> : null}
                {series.map((item, index) => {
                    if (item.type === 'line') {
                        return (
                            <Line
                                key={item.dataKey}
                                type="monotone"
                                dataKey={item.dataKey}
                                name={item.name ?? item.dataKey}
                                yAxisId={item.yAxisId ?? 'left'}
                                stroke={item.color ?? seriesColor(1)}
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={!reduced}
                            />
                        );
                    }

                    return (
                        <Bar
                            key={item.dataKey}
                            dataKey={item.dataKey}
                            name={item.name ?? item.dataKey}
                            yAxisId={item.yAxisId ?? 'left'}
                            fill={item.color ?? seriesColor(index === 0 ? 0 : index)}
                            radius={[2, 2, 0, 0]}
                            maxBarSize={28}
                            isAnimationActive={!reduced}
                        />
                    );
                })}
            </RechartsComposedChart>
        </ResponsiveContainer>
    );
}
