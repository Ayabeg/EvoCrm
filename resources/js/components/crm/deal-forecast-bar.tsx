import { formatDzd } from '@/components/crm/hub-chrome';

type Forecast = {
    count: number;
    amount_cents: number;
    weighted_cents: number;
    open_cents?: number;
};

export default function DealForecastBar({ forecast }: { forecast: Forecast }) {
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
        </div>
    );
}
