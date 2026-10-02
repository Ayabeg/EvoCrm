import {
    AreaChart,
    BarChart,
    ChartFrame,
    DonutChart,
    HorizontalBarChart,
    LineChart,
    Sparkline,
} from '@/evo/charts';
import { formatNumber } from '@/evo/lib/format';
import { evovizIsEmpty } from '@/evoviz';
import type { EvoVizPayload } from '@/evoviz';
import { t } from '@/lib/i18n';

import { chartKind, payloadToCartesian, payloadToDonut, payloadToSparkline } from './payload-to-chart';

export function ChartFromPayload({ payload }: { payload: EvoVizPayload }) {
    if (evovizIsEmpty(payload)) {
        return null;
    }

    const kind = chartKind(payload.id);
    const cartesian = payloadToCartesian(payload);
    const height = kind === 'spark' ? 48 : 220;

    return (
        <article className="rounded-[var(--evo-radius-standard)] border border-[var(--evo-hairline)] bg-[var(--evo-surface)] px-4 py-3">
            <div className="mb-2 flex items-baseline justify-between gap-2">
                <h3 className="text-[13px] font-medium text-[var(--evo-ink)]">{t(payload.title)}</h3>
                {payload.total != null ? (
                    <p className="text-[13px] tabular-nums text-[var(--evo-ink-secondary)]">
                        {formatNumber(payload.total)}
                        {payload.valueLabel ? ` ${t(payload.valueLabel)}` : ''}
                    </p>
                ) : null}
            </div>
            <ChartFrame height={height} label={t(payload.title)} empty={false}>
                {kind === 'line' ? (
                    <LineChart data={cartesian.data} series={cartesian.series} height={height} showLegend={cartesian.series.length > 1} />
                ) : null}
                {kind === 'area' ? (
                    <AreaChart data={cartesian.data} series={cartesian.series} height={height} showLegend={cartesian.series.length > 1} />
                ) : null}
                {kind === 'bar' ? (
                    <BarChart data={cartesian.data} series={cartesian.series} height={height} showLegend={cartesian.series.length > 1} />
                ) : null}
                {kind === 'horizontal' ? (
                    <HorizontalBarChart data={cartesian.data} series={cartesian.series} height={height} />
                ) : null}
                {kind === 'donut' ? <DonutChart data={payloadToDonut(payload)} height={height} /> : null}
                {kind === 'spark' ? (
                    <Sparkline data={payloadToSparkline(payload)} dataKey="value" height={height} />
                ) : null}
            </ChartFrame>
            {payload.href ? (
                <a
                    href={payload.href}
                    className="mt-2 inline-block text-[12px] text-[var(--evo-teal)] underline-offset-2 hover:underline"
                >
                    {t('Open source')}
                </a>
            ) : null}
        </article>
    );
}
