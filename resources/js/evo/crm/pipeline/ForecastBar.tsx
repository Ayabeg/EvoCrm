/**
 * Evo Design System — ForecastBar
 * Registry: custom Evo on evo/charts (Recharts, PR9)
 * License: MIT (original composition)
 */

import { FunnelChart } from '@/evo/charts/funnel-chart';
import type { ForecastTotals } from '@/evo/crm/pipeline/types';
import { t } from '@/lib/i18n';

export function ForecastBar({
    forecast,
    stages = [],
}: {
    forecast: ForecastTotals;
    stages?: Array<{ id: string; label: string; value: number; hint?: string }>;
}) {
    return (
        <div
            className="border-b border-[var(--evo-hairline)] bg-[var(--evo-canvas)] px-4 py-2 sm:px-6"
            data-testid="forecast-totals"
            data-evo="forecast-bar"
        >
            <div className="flex items-end gap-x-5 gap-y-2 overflow-x-auto">
                <ForecastFact
                    label={t('Pipeline')}
                    value={forecast.amount}
                    money
                />
                <ForecastFact
                    label={t('Open deals')}
                    value={String(forecast.count)}
                />
                <ForecastFact
                    label={t('Weighted')}
                    value={forecast.weighted}
                    money
                />
                {forecast.open ? (
                    <ForecastFact
                        label={t('Open pipeline')}
                        value={forecast.open}
                        money
                    />
                ) : null}
                {forecast.band ? (
                    <ForecastFact label={t('Band')} value={forecast.band} />
                ) : null}
            </div>
            {forecast.narrative ? (
                <p className="mt-1 text-[11px] text-[var(--evo-ink-muted)]">
                    {forecast.narrative}
                </p>
            ) : null}
            {stages.length > 0 ? (
                <div className="mt-3">
                    <FunnelChart steps={stages} compact />
                </div>
            ) : null}
        </div>
    );
}

function ForecastFact({
    label,
    value,
    money = false,
}: {
    label: string;
    value: string;
    money?: boolean;
}) {
    return (
        <div className="min-w-0 shrink-0">
            <p className="text-[10px] leading-3 tracking-wide text-[var(--evo-ink-muted)]">
                {label}
            </p>
            <p
                className={`mt-0.5 text-[13px] font-semibold text-[var(--evo-ink)] tabular-nums ${money ? 'break-words' : ''}`}
            >
                {value}
            </p>
        </div>
    );
}
