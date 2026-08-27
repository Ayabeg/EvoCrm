import { formatDzd } from '@/lib/money';

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

export default function DealForecastBar({
    forecast,
    forecastBand,
}: {
    forecast: Forecast;
    forecastBand?: ForecastBand | null;
}) {
    return (
        <div
            className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-hairline py-3 text-sm"
            data-testid="forecast-totals"
        >
            <div>
                <p className="text-[10px] tracking-wide text-mute">Deals</p>
                <p className="font-semibold tabular-nums">{forecast.count}</p>
            </div>
            <div>
                <p className="text-[10px] tracking-wide text-mute">Total</p>
                <p className="money font-semibold text-ink">
                    {formatDzd(forecast.amount_cents)}
                </p>
            </div>
            <div>
                <p className="text-[10px] tracking-wide text-mute">Weighted</p>
                <p className="money font-semibold text-brand">
                    {formatDzd(forecast.weighted_cents)}
                </p>
            </div>
            {typeof forecast.open_cents === 'number' ? (
                <div>
                    <p className="text-[10px] tracking-wide text-mute">
                        Open pipeline
                    </p>
                    <p className="money font-semibold text-ink">
                        {formatDzd(forecast.open_cents)}
                    </p>
                </div>
            ) : null}
            {forecastBand ? (
                <div className="min-w-[140px]">
                    <p className="text-[10px] tracking-wide text-mute">
                        AI band · {forecastBand.band_label}
                    </p>
                    <p className="money text-xs text-ink">
                        {formatDzd(forecastBand.low_cents)} –{' '}
                        {formatDzd(forecastBand.high_cents)}
                    </p>
                    {forecastBand.narrative ? (
                        <p className="mt-0.5 text-[10px] text-mute">
                            {forecastBand.narrative}
                        </p>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
