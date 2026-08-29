import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import {
    EVOVIZ_HAIRLINE,
    EVOVIZ_PALETTE,
    evovizIsEmpty,
    evovizSeriesColor,
} from '@/evoviz/contract';
import type { EvoVizPayload } from '@/evoviz/contract';

/**
 * EvoViz renderer — the React/Inertia half of the EvoViz contract (see
 * contract.ts). Pure SVG/HTML, no chart library: every stroke and fill is
 * an EvoSales CSS variable, so the same payload reads on the Light Cabinet
 * white and the Dark Cabinet #000 without a theme branch.
 */

const MUTE = 'var(--evosales-mute)';

function formatValue(value: number): string {
    if (Math.abs(value) >= 100_000) {
        return `${Math.round(value / 1000)}k`;
    }

    return new Intl.NumberFormat('en-US').format(value);
}

function ChartFrame({
    payload,
    framed,
    children,
}: {
    payload: EvoVizPayload;
    framed: boolean;
    children: ReactNode;
}) {
    const body = (
        <div
            className={
                framed
                    ? 'border border-hairline px-4 py-3'
                    : ''
            }
        >
            <div className="flex items-baseline justify-between gap-3">
                <p className="text-[11px] leading-4 text-mute">
                    {payload.title}
                </p>
                {payload.total !== undefined &&
                payload.id !== 'evoviz.kpi-spark' ? (
                    <p className="money text-[12px] text-mute">
                        {formatValue(payload.total)}
                        {payload.valueLabel ? ` ${payload.valueLabel}` : ''}
                    </p>
                ) : null}
            </div>
            {payload.series.length > 1 ? (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {payload.series.map((series, i) => (
                        <span
                            key={series.name}
                            className="flex items-center gap-1.5 text-[11px] text-mute"
                        >
                            <span
                                className="size-2 shrink-0 rounded-full"
                                style={{
                                    backgroundColor: evovizSeriesColor(
                                        series,
                                        i,
                                    ),
                                }}
                            />
                            {series.name}
                        </span>
                    ))}
                </div>
            ) : null}
            <div className="mt-4">{children}</div>
        </div>
    );

    if (payload.href) {
        return (
            <Link href={payload.href} className="block">
                {body}
            </Link>
        );
    }

    return body;
}

/* ------------------------------------------------------------------ */
/* Shared SVG geometry                                                 */
/* ------------------------------------------------------------------ */

const W = 560;
const H = 168;
const PAD_X = 6;
const PAD_TOP = 18;
const PAD_BOTTOM = 22;
const PLOT_W = W - PAD_X * 2;
const PLOT_H = H - PAD_TOP - PAD_BOTTOM;

function pointsFor(data: number[], count: number, max: number) {
    const band = PLOT_W / Math.max(count, 1);

    return data.map((value, i) => ({
        x: PAD_X + band * i + band / 2,
        y: PAD_TOP + PLOT_H - (max > 0 ? (value / max) * PLOT_H : 0),
    }));
}

function XLabels({ labels, every = 1 }: { labels: string[]; every?: number }) {
    const band = PLOT_W / Math.max(labels.length, 1);

    return (
        <>
            {labels.map((label, i) =>
                i % every === 0 || i === labels.length - 1 ? (
                    <text
                        key={`${label}-${i}`}
                        x={PAD_X + band * i + band / 2}
                        y={H - 6}
                        textAnchor="middle"
                        fontSize={10}
                        fill={MUTE}
                    >
                        {label}
                    </text>
                ) : null,
            )}
        </>
    );
}

function Baseline() {
    return (
        <line
            x1={PAD_X}
            x2={W - PAD_X}
            y1={PAD_TOP + PLOT_H}
            y2={PAD_TOP + PLOT_H}
            stroke={EVOVIZ_HAIRLINE}
            strokeWidth={1}
        />
    );
}

/* ------------------------------------------------------------------ */
/* evoviz.line / evoviz.area                                           */
/* ------------------------------------------------------------------ */

function LineChart({
    payload,
    filled,
}: {
    payload: EvoVizPayload;
    filled: boolean;
}) {
    const max = Math.max(...payload.series.flatMap((series) => series.data), 1);
    const every = Math.max(1, Math.ceil(payload.labels.length / 7));

    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-40 w-full"
            role="img"
            aria-label={payload.title}
        >
            {payload.series.map((series, seriesIndex) => {
                const color = evovizSeriesColor(series, seriesIndex);
                const points = pointsFor(
                    series.data,
                    payload.labels.length,
                    max,
                );
                const path = points
                    .map(
                        (p, i) =>
                            `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`,
                    )
                    .join(' ');
                const areaPath = `${path} L${points[points.length - 1].x.toFixed(1)},${(
                    PAD_TOP + PLOT_H
                ).toFixed(
                    1,
                )} L${points[0].x.toFixed(1)},${(PAD_TOP + PLOT_H).toFixed(1)} Z`;

                return (
                    <g key={series.name}>
                        {filled ? (
                            <path
                                d={areaPath}
                                fill={color}
                                fillOpacity={0.12}
                            />
                        ) : null}
                        <path
                            d={path}
                            fill="none"
                            stroke={color}
                            strokeWidth={2}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                        />
                    </g>
                );
            })}
            <Baseline />
            <XLabels labels={payload.labels} every={every} />
        </svg>
    );
}

/* ------------------------------------------------------------------ */
/* evoviz.bar                                                          */
/* ------------------------------------------------------------------ */

function BarChart({ payload }: { payload: EvoVizPayload }) {
    const series = payload.series[0];
    const color = evovizSeriesColor(series, 0);
    const max = Math.max(...series.data, 1);
    const count = payload.labels.length;
    const band = PLOT_W / Math.max(count, 1);
    const barW = Math.min(46, band * 0.55);

    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-40 w-full"
            role="img"
            aria-label={payload.title}
        >
            {series.data.map((value, i) => {
                const height = max > 0 ? (value / max) * PLOT_H : 0;
                const x = PAD_X + band * i + (band - barW) / 2;
                const y = PAD_TOP + PLOT_H - height;

                return (
                    <g key={`${payload.labels[i]}-${i}`}>
                        <rect
                            x={x}
                            y={y}
                            width={barW}
                            height={Math.max(height, value > 0 ? 2 : 0)}
                            rx={3}
                            fill={color}
                        />
                        <text
                            x={x + barW / 2}
                            y={y - 5}
                            textAnchor="middle"
                            fontSize={10}
                            fill={MUTE}
                        >
                            {formatValue(value)}
                        </text>
                    </g>
                );
            })}
            <Baseline />
            <XLabels labels={payload.labels} />
        </svg>
    );
}

/* ------------------------------------------------------------------ */
/* evoviz.bar-horizontal / evoviz.ranked-bars                          */
/* ------------------------------------------------------------------ */

function HorizontalBars({
    payload,
    ranked,
}: {
    payload: EvoVizPayload;
    ranked: boolean;
}) {
    const series = payload.series[0];
    const color = evovizSeriesColor(series, 0);
    let rows = payload.labels.map((label, i) => ({
        label,
        value: series.data[i] ?? 0,
    }));

    if (ranked) {
        rows = [...rows].sort((a, b) => b.value - a.value);
    }

    const max = Math.max(...rows.map((row) => row.value), 1);

    return (
        <ul className="flex flex-col gap-2" aria-label={payload.title}>
            {rows.map((row) => (
                <li key={row.label} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 truncate text-[12px] text-mute">
                        {row.label}
                    </span>
                    <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-hairline/50">
                        <span
                            className="block h-full rounded-full"
                            style={{
                                width: `${Math.max((row.value / max) * 100, row.value > 0 ? 2 : 0)}%`,
                                backgroundColor: color,
                            }}
                        />
                    </span>
                    <span className="money w-10 shrink-0 text-right text-[12px]">
                        {formatValue(row.value)}
                    </span>
                </li>
            ))}
        </ul>
    );
}

/* ------------------------------------------------------------------ */
/* evoviz.donut                                                        */
/* ------------------------------------------------------------------ */

function DonutChart({ payload }: { payload: EvoVizPayload }) {
    const series = payload.series[0];
    const values = payload.labels.map((_, i) => series.data[i] ?? 0);
    const total =
        payload.total ?? values.reduce((sum, value) => sum + value, 0);
    const r = 52;
    const cx = 60;
    const cy = 60;
    const circumference = 2 * Math.PI * r;
    const segments = values.reduce<{ length: number; rotation: number }[]>(
        (acc, value) => {
            const length = (total > 0 ? value / total : 0) * circumference;
            const drawn = acc.reduce((sum, seg) => sum + seg.length, 0);
            acc.push({
                length,
                rotation: (drawn / circumference) * 360 - 90,
            });

            return acc;
        },
        [],
    );

    return (
        <div className="flex items-center gap-4">
            <svg
                viewBox="0 0 120 120"
                className="h-28 w-28 shrink-0"
                role="img"
                aria-label={payload.title}
            >
                <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke={EVOVIZ_HAIRLINE}
                    strokeWidth={14}
                />
                {segments.map((segment, i) =>
                    segment.length === 0 ? null : (
                        <circle
                            key={payload.labels[i]}
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill="none"
                            stroke={EVOVIZ_PALETTE[i % EVOVIZ_PALETTE.length]}
                            strokeWidth={14}
                            strokeDasharray={`${segment.length} ${circumference - segment.length}`}
                            transform={`rotate(${segment.rotation} ${cx} ${cy})`}
                        />
                    ),
                )}
                <text
                    x={cx}
                    y={cy - 2}
                    textAnchor="middle"
                    fontSize={17}
                    fontWeight={600}
                    fill="var(--evosales-ink)"
                    className="money"
                >
                    {formatValue(total)}
                </text>
                <text
                    x={cx}
                    y={cy + 13}
                    textAnchor="middle"
                    fontSize={9}
                    fill={MUTE}
                >
                    {payload.valueLabel ?? 'total'}
                </text>
            </svg>
            <ul className="flex min-w-0 flex-col gap-1.5">
                {payload.labels.map((label, i) => (
                    <li
                        key={label}
                        className="flex items-center gap-2 text-[12px]"
                    >
                        <span
                            className="size-2 shrink-0 rounded-full"
                            style={{
                                backgroundColor:
                                    EVOVIZ_PALETTE[i % EVOVIZ_PALETTE.length],
                            }}
                        />
                        <span className="truncate text-mute">{label}</span>
                        <span className="money ml-auto pl-3">
                            {formatValue(values[i])}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* evoviz.kpi-spark                                                    */
/* ------------------------------------------------------------------ */

function KpiSpark({ payload }: { payload: EvoVizPayload }) {
    const series = payload.series[0];
    const color = evovizSeriesColor(series, 0);
    const total =
        payload.total ?? series.data.reduce((sum, value) => sum + value, 0);
    const max = Math.max(...series.data, 1);
    const sparkH = 44;
    const points = series.data.map((value, i) => ({
        x: (W / Math.max(series.data.length - 1, 1)) * i,
        y: sparkH - 4 - (value / max) * (sparkH - 10),
    }));
    const path = points
        .map(
            (p, i) =>
                `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`,
        )
        .join(' ');
    const areaPath = `${path} L${W},${sparkH} L0,${sparkH} Z`;

    return (
        <div>
            <p className="money text-kpi font-semibold tracking-tight text-ink">
                {formatValue(total)}
                {payload.valueLabel ? (
                    <span className="ml-1 text-[12px] font-normal text-mute">
                        {payload.valueLabel}
                    </span>
                ) : null}
            </p>
            <svg
                viewBox={`0 0 ${W} ${sparkH}`}
                className="mt-2 h-11 w-full"
                preserveAspectRatio="none"
                role="img"
                aria-label={payload.title}
            >
                <path d={areaPath} fill={color} fillOpacity={0.12} />
                <path
                    d={path}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                />
            </svg>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Entry point                                                         */
/* ------------------------------------------------------------------ */

export function EvoVizChart({
    payload,
    framed = true,
}: {
    payload: EvoVizPayload;
    framed?: boolean;
}) {
    if (evovizIsEmpty(payload)) {
        return null;
    }

    let chart: ReactNode;

    switch (payload.id) {
        case 'evoviz.line':
            chart = <LineChart payload={payload} filled={false} />;
            break;
        case 'evoviz.area':
            chart = <LineChart payload={payload} filled={true} />;
            break;
        case 'evoviz.bar':
            chart = <BarChart payload={payload} />;
            break;
        case 'evoviz.bar-horizontal':
            chart = <HorizontalBars payload={payload} ranked={false} />;
            break;
        case 'evoviz.ranked-bars':
            chart = <HorizontalBars payload={payload} ranked={true} />;
            break;
        case 'evoviz.donut':
            chart = <DonutChart payload={payload} />;
            break;
        case 'evoviz.kpi-spark':
            chart = <KpiSpark payload={payload} />;
            break;
    }

    return (
        <ChartFrame payload={payload} framed={framed}>
            {chart}
        </ChartFrame>
    );
}
