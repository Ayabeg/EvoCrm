import type { DonutSlice } from '@/evo/charts/donut-chart';
import type { ChartSeries } from '@/evo/charts/line-chart';
import { seriesColor } from '@/evo/charts/tokens';
import type { EvoVizPayload } from '@/evoviz';

export type CartesianFromPayload = {
    data: Array<Record<string, string | number | null>>;
    series: ChartSeries[];
};

function seriesKey(name: string, index: number): string {
    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');

    return slug.length > 0 ? slug : `series_${index}`;
}

export function payloadToCartesian(payload: EvoVizPayload): CartesianFromPayload {
    const keys = payload.series.map((item, index) => seriesKey(item.name, index));
    const data = payload.labels.map((label, rowIndex) => {
        const row: Record<string, string | number | null> = { label };

        payload.series.forEach((item, seriesIndex) => {
            row[keys[seriesIndex] ?? `series_${seriesIndex}`] = item.data[rowIndex] ?? 0;
        });

        return row;
    });

    const series: ChartSeries[] = payload.series.map((item, index) => ({
        dataKey: keys[index] ?? `series_${index}`,
        name: item.name,
        color: seriesColor(index),
    }));

    return { data, series };
}

export function payloadToDonut(payload: EvoVizPayload): DonutSlice[] {
    const first = payload.series[0];

    if (!first) {
        return [];
    }

    return payload.labels.map((label, index) => ({
        name: label,
        value: first.data[index] ?? 0,
        color: seriesColor(index),
    }));
}

export function payloadToSparkline(payload: EvoVizPayload): Array<Record<string, string | number | null>> {
    const first = payload.series[0];

    return payload.labels.map((label, index) => ({
        label,
        value: first?.data[index] ?? 0,
    }));
}

export function chartKind(id: string): 'line' | 'area' | 'bar' | 'horizontal' | 'donut' | 'spark' {
    if (id === 'evoviz.area') {
        return 'area';
    }

    if (id === 'evoviz.bar-horizontal' || id === 'evoviz.ranked-bars') {
        return 'horizontal';
    }

    if (id === 'evoviz.donut') {
        return 'donut';
    }

    if (id === 'evoviz.kpi-spark') {
        return 'spark';
    }

    if (id === 'evoviz.line') {
        return 'line';
    }

    return 'bar';
}
