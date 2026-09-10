import { formatDzd } from '@/lib/money';
import { cn } from '@/lib/utils';

type Forecast = {
    count: number;
    amount_cents: number;
    weighted_cents: number;
    open_cents?: number;
};

type ForecastBand = {
    low_cents: number;
    high_cents: number;
    band_label: string;
    narrative?: string | null;
};

type ForecastBacktest = {
    status: string;
    label: string;
    sample_count: number;
    error_pct: number | null;
    within_15: boolean;
};

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
            <p className="text-[10px] leading-3 tracking-wide text-mute">
                {label}
            </p>
            <p
                className={cn(
                    'mt-0.5 text-[13px] font-semibold tabular-nums text-ink',
                    money && 'money break-words',
                )}
            >
                {value}
            </p>
        </div>
    );
}

export default function DealForecastBar({
    forecast,
    forecastBand,
    forecastBacktest,
}: {
    forecast: Forecast;
    forecastBand?: ForecastBand | null;
    forecastBacktest?: ForecastBacktest | null;
}) {
    return (
        <div
            className="flex items-end gap-x-5 gap-y-2 overflow-x-auto border-b border-hairline bg-canvas px-4 py-2 sm:px-6"
            data-testid="forecast-totals"
        >
            <ForecastFact
                label="Pipeline"
                value={formatDzd(forecast.amount_cents)}
                money
            />
            <ForecastFact label="Open deals" value={String(forecast.count)} />
            <ForecastFact
                label="Weighted"
                value={formatDzd(forecast.weighted_cents)}
                money
            />
            {typeof forecast.open_cents === 'number' ? (
                <ForecastFact
                    label="Open pipeline"
                    value={formatDzd(forecast.open_cents)}
                    money
                />
            ) : null}
            {forecastBand ? (
                <div className="min-w-0 shrink-0 border-l border-hairline pl-5">
                    <p className="text-[10px] leading-3 tracking-wide text-mute">
                        Band · {forecastBand.band_label}
                    </p>
                    <p className="money mt-0.5 break-words text-[12px] tabular-nums text-mute">
                        {formatDzd(forecastBand.low_cents)} –{' '}
                        {formatDzd(forecastBand.high_cents)}
                    </p>
                    {forecastBand.narrative ? (
                        <p className="mt-0.5 max-w-[18rem] text-[10px] leading-4 text-mute">
                            {forecastBand.narrative}
                        </p>
                    ) : null}
                </div>
            ) : null}
            {forecastBacktest ? (
                <div
                    className="min-w-0 shrink-0 border-l border-hairline pl-5"
                    data-testid="forecast-backtest"
                >
                    <p className="text-[10px] leading-3 tracking-wide text-mute">
                        Backtest · 90d
                    </p>
                    <p className="mt-0.5 text-[13px] font-semibold text-ink">
                        {forecastBacktest.label}
                    </p>
                </div>
            ) : null}
        </div>
    );
}
