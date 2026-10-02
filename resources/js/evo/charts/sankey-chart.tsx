/**
 * Evo Design System — SankeyChart
 * Registry: Recharts Sankey (evilcharts recharts-sankey-chart as prior art)
 * Source: https://github.com/recharts/recharts · https://github.com/legions-developer/evilcharts
 * License: MIT
 * Copied: 2026-10-02
 * Modified: generic wrapper; ink/teal nodes; no evilcharts import.
 */

import { Layer, Rectangle, ResponsiveContainer, Sankey, Tooltip } from 'recharts';
import type { SankeyLinkProps, SankeyNodeProps } from 'recharts';

import { seriesColor } from '@/evo/charts/tokens';
import { ChartTooltipCard } from '@/evo/charts/tooltip';
import { formatNumber } from '@/evo/lib/format';

export type SankeyNodeDatum = {
    name: string;
};

export type SankeyLinkDatum = {
    source: number;
    target: number;
    value: number;
};

export type SankeyChartData = {
    nodes: SankeyNodeDatum[];
    links: SankeyLinkDatum[];
};

export type SankeyChartProps = {
    data: SankeyChartData;
    height?: number;
    className?: string;
    formatValue?: (value: number) => string;
};

function nodeFill(depth: number): string {
    return seriesColor(depth === 0 ? 0 : 1);
}

function SankeyNode({ x, y, width, height, payload, index }: SankeyNodeProps) {
    const name = payload.name;
    const labelOnRight = payload.depth > 0;
    const value = typeof payload.value === 'number' ? payload.value : 0;

    return (
        <Layer key={`sankey-node-${index}`}>
            <Rectangle
                x={x}
                y={y}
                width={width}
                height={height}
                fill={nodeFill(payload.depth)}
                fillOpacity={0.92}
                radius={2}
            />
            <text
                x={labelOnRight ? x + width + 8 : x - 8}
                y={y + height / 2}
                textAnchor={labelOnRight ? 'start' : 'end'}
                dominantBaseline="middle"
                fill="var(--evo-ink)"
                fontSize={11}
            >
                {name}
            </text>
            {value > 0 && height > 18 ? (
                <text
                    x={labelOnRight ? x + width + 8 : x - 8}
                    y={y + height / 2 + 12}
                    textAnchor={labelOnRight ? 'start' : 'end'}
                    fill="var(--evo-ink-muted)"
                    fontSize={10}
                >
                    {formatNumber(Math.round(value))}
                </text>
            ) : null}
        </Layer>
    );
}

function SankeyLink(props: SankeyLinkProps) {
    const {
        sourceX,
        targetX,
        sourceY,
        targetY,
        sourceControlX,
        targetControlX,
        linkWidth,
        index,
    } = props;

    return (
        <path
            d={`
                M${sourceX},${sourceY}
                C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
            `}
            fill="none"
            stroke={seriesColor(1)}
            strokeOpacity={0.22}
            strokeWidth={Math.max(linkWidth, 1)}
            data-link-index={index}
        />
    );
}

export function SankeyChart({
    data,
    height = 360,
    className,
    formatValue = formatNumber,
}: SankeyChartProps) {
    return (
        <ResponsiveContainer width="100%" height={height} className={className}>
            <Sankey
                data={data}
                nodeWidth={12}
                nodePadding={28}
                linkCurvature={0.5}
                iterations={32}
                node={SankeyNode}
                link={SankeyLink}
                margin={{ top: 8, right: 120, bottom: 8, left: 120 }}
            >
                <Tooltip
                    content={({ payload }) => {
                        const row = payload?.[0]?.payload as
                            | { source?: { name?: string }; target?: { name?: string }; value?: number }
                            | undefined;

                        if (!row?.source?.name || !row.target?.name || row.value == null) {
                            return null;
                        }

                        return (
                            <ChartTooltipCard>
                                <p className="text-[11px] text-[var(--evo-ink-secondary)]">
                                    {row.source.name} → {row.target.name}
                                </p>
                                <p className="mt-0.5 font-medium tabular-nums">{formatValue(row.value)}</p>
                            </ChartTooltipCard>
                        );
                    }}
                />
            </Sankey>
        </ResponsiveContainer>
    );
}
