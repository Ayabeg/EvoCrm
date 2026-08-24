import { formatDzd } from '@/components/crm/hub-chrome';

type Forecast = {
    count: number;
    amount_cents: number;
    weighted_cents: number;
    open_cents?: number;
};

type ForecastBand = {
    weighted_cents: number;
    low_cents: number;
    high_cents: number;
    band_label: string;
    narrative?: string | null;
    source: string;
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
            className="flex flex-wrap items-center gap-4 rounded-lg border border-hairline bg-canvas-soft px-3 py-2 text-sm"
            data-testid="forecast-totals"
        >
            <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Deals</p>
                <p className="font-semibold tabular-nums">{forecast.count}</p>
            </div>
            <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total</p>
                <p className="money font-semibold text-ink">{formatDzd(forecast.amount_cents)}</p>
            </div>
            <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Weighted</p>
                <p className="money font-semibold text-brand">{formatDzd(forecast.weighted_cents)}</p>
            </div>
            {typeof forecast.open_cents === 'number' ? (
                <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Open pipeline</p>
                    <p className="money font-semibold text-ink">{formatDzd(forecast.open_cents)}</p>
                </div>
            ) : null}
            {forecastBand ? (
                <div className="min-w-[140px]">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">AI band · {forecastBand.band_label}</p>
                    <p className="money text-xs text-ink">
                        {formatDzd(forecastBand.low_cents)} – {formatDzd(forecastBand.high_cents)}
                    </p>
                    {forecastBand.narrative ? (
                        <p className="mt-0.5 text-[10px] text-muted-foreground">{forecastBand.narrative}</p>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
