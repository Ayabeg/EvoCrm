/**
 * Evo Design System — Sparkline
 * Registry: Recharts Line (compact)
 * Source: https://github.com/recharts/recharts
 * License: MIT
 * Copied: 2026-10-02
 */

import { Line, LineChart, ResponsiveContainer } from 'recharts';

import { seriesColor } from '@/evo/charts/tokens';
import { usePrefersReducedMotion } from '@/evo/lib/motion';

export type SparklineProps = {
    data: Array<Record<string, string | number | null>>;
    dataKey: string;
    height?: number;
    className?: string;
    color?: string;
};

export function Sparkline({
    data,
    dataKey,
    height = 40,
    className,
    color,
}: SparklineProps) {
    const reduced = usePrefersReducedMotion();

    return (
        <ResponsiveContainer width="100%" height={height} className={className}>
            <LineChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <Line
                    type="monotone"
                    dataKey={dataKey}
                    stroke={color ?? seriesColor(1)}
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={!reduced}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
