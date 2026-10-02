/**
 * Evo Design System — LineChart
 * Registry: Recharts LineChart
 * Source: https://github.com/recharts/recharts
 * License: MIT
 * Copied: 2026-10-02
 */

import type { ReactNode } from 'react';
import { Line, LineChart as RechartsLineChart, ResponsiveContainer } from 'recharts';
import type { LineProps } from 'recharts';

import { ChartGrid, ChartXAxis, ChartYAxis } from '@/evo/charts/axis';
import { ChartLegend } from '@/evo/charts/legend';
import { seriesColor } from '@/evo/charts/tokens';
import { ChartTooltip } from '@/evo/charts/tooltip';
import { usePrefersReducedMotion } from '@/evo/lib/motion';

export type ChartSeries = {
    dataKey: string;
    name?: string;
    color?: string;
    yAxisId?: string;
};

export type CartesianChartProps = {
    data: Array<Record<string, string | number | null>>;
    series: ChartSeries[];
    xKey?: string;
    height?: number;
    className?: string;
    showLegend?: boolean;
    showGrid?: boolean;
    yTickFormatter?: (value: number) => string;
    rightYTickFormatter?: (value: number) => string;
    children?: ReactNode;
};

export function LineChart({
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
            <RechartsLineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                {showGrid ? <ChartGrid /> : null}
                <ChartXAxis dataKey={xKey} />
                <ChartYAxis tickFormatter={yTickFormatter} />
                <ChartTooltip />
                {showLegend ? <ChartLegend /> : null}
                {series.map((item, index) => (
                    <Line
                        key={item.dataKey}
                        type="monotone"
                        dataKey={item.dataKey}
                        name={item.name ?? item.dataKey}
                        stroke={item.color ?? seriesColor(index === 0 ? 1 : index)}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={!reduced}
                    />
                ))}
            </RechartsLineChart>
        </ResponsiveContainer>
    );
}

export function ChartLine(props: LineProps) {
    const reduced = usePrefersReducedMotion();

    return (
        <Line
            type="monotone"
            stroke={props.stroke ?? seriesColor(1)}
            strokeWidth={2}
            dot={false}
            isAnimationActive={!reduced}
            {...props}
        />
    );
}
