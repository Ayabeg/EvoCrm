/**
 * Evo Design System — HorizontalBarChart
 * Registry: Recharts BarChart layout=vertical
 * Source: https://github.com/recharts/recharts
 * License: MIT
 * Copied: 2026-10-02
 * Modified: additive PR10 wrapper; ink/teal fills; --evo-* only.
 */

import { Bar, BarChart as RechartsBarChart, ResponsiveContainer } from 'recharts';

import { ChartGrid, ChartXAxis, ChartYAxis } from '@/evo/charts/axis';
import type { CartesianChartProps } from '@/evo/charts/line-chart';
import { seriesColor } from '@/evo/charts/tokens';
import { ChartTooltip } from '@/evo/charts/tooltip';
import { usePrefersReducedMotion } from '@/evo/lib/motion';

export function HorizontalBarChart({
    data,
    series,
    xKey = 'label',
    height = 280,
    className,
    showGrid = true,
    yTickFormatter,
}: CartesianChartProps) {
    const reduced = usePrefersReducedMotion();

    return (
        <ResponsiveContainer width="100%" height={height} className={className}>
            <RechartsBarChart
                data={data}
                layout="vertical"
                margin={{ top: 8, right: 12, left: 8, bottom: 4 }}
            >
                {showGrid ? <ChartGrid horizontal={false} /> : null}
                <ChartXAxis type="number" tickFormatter={yTickFormatter} />
                <ChartYAxis type="category" dataKey={xKey} width={88} />
                <ChartTooltip />
                {series.map((item, index) => (
                    <Bar
                        key={item.dataKey}
                        dataKey={item.dataKey}
                        name={item.name ?? item.dataKey}
                        fill={item.color ?? seriesColor(index)}
                        radius={[0, 2, 2, 0]}
                        maxBarSize={16}
                        isAnimationActive={!reduced}
                    />
                ))}
            </RechartsBarChart>
        </ResponsiveContainer>
    );
}
