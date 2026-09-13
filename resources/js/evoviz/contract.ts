/**
 * EvoViz payload contract — EvoSales port.
 *
 * EvoViz is Evotechly's chart language (Brandbook `docs/20-evoviz.md`,
 * implemented on Evotrack as `resources/js/evoviz/` behind `window.EvoViz`).
 * EvoSales re-implements the same contract in React/Inertia: the server
 * ships plain JSON payloads keyed by these chart ids, and the renderer in
 * `evo-viz-chart.tsx` draws them as SVG from CSS-variable tokens only —
 * EvoCrm orange (`--color-accent`) / text / border, never Aurora teal or Kommo
 * blue, and always readable on the Dark Cabinet canvas.
 *
 * A payload whose series carries no signal (no labels, or every value
 * zero) is empty: servers omit it and the renderer returns null rather
 * than drawing a fake chart.
 */

export const EVOVIZ_IDS = [
    'evoviz.line',
    'evoviz.area',
    'evoviz.bar',
    'evoviz.bar-horizontal',
    'evoviz.donut',
    'evoviz.ranked-bars',
    'evoviz.kpi-spark',
] as const;

export type EvoVizId = (typeof EVOVIZ_IDS)[number];

export type EvoVizSeries = {
    /** Series name, shown in legends when more than one series exists. */
    name: string;
    /** Values aligned to `labels`. */
    data: number[];
    /**
     * Optional token override for this series, e.g. 'ink' | 'mute'.
     * Defaults to the EvoViz palette slot for the series index.
     */
    tone?: EvoVizTone;
};

export type EvoVizPayload = {
    /** Contract id — always one of the evoviz.* ids above. */
    id: EvoVizId;
    /** Card title. */
    title: string;
    /** Category labels (stages, days, slices). */
    labels: string[];
    /** One or more numeric series aligned to `labels`. */
    series: EvoVizSeries[];
    /** Headline number — required by evoviz.kpi-spark, used as donut center. */
    total?: number;
    /** Unit hint rendered next to values, e.g. 'DZD'. */
    valueLabel?: string;
    /** Optional in-app drill-down link. */
    href?: string;
};

/** Named palette slots — each maps to an EvoSales CSS variable. */
export type EvoVizTone = 'mark' | 'ink' | 'mute';

/**
 * EvoViz palette: Evotechly orange first, then ink, then mute. Every slot
 * is a CSS variable so Light and Dark Cabinet stay correct without a
 * single hard-coded hex leaving app.css.
 */
export const EVOVIZ_TONES: Record<EvoVizTone, string> = {
    mark: 'var(--color-accent)',
    ink: 'var(--color-text)',
    mute: 'var(--color-text-secondary)',
};

export const EVOVIZ_PALETTE: string[] = [
    EVOVIZ_TONES.mark,
    EVOVIZ_TONES.ink,
    EVOVIZ_TONES.mute,
];

/** Hairline token for baselines, grid rules, and donut tracks. */
export const EVOVIZ_HAIRLINE = 'var(--color-border)';

export function evovizSeriesColor(series: EvoVizSeries, index: number): string {
    if (series.tone) {
        return EVOVIZ_TONES[series.tone];
    }

    return EVOVIZ_PALETTE[index % EVOVIZ_PALETTE.length];
}

/**
 * A payload is empty when there is nothing honest to draw: no labels, no
 * series, or every value across every series is zero.
 */
export function evovizIsEmpty(payload: EvoVizPayload): boolean {
    if (payload.labels.length === 0 || payload.series.length === 0) {
        return true;
    }

    return payload.series.every((series) =>
        series.data.every((value) => !Number.isFinite(value) || value === 0),
    );
}
