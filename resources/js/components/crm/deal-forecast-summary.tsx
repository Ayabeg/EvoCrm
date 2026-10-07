import { t } from '@/lib/i18n';
import { formatDzd } from '@/lib/money';

type Forecast = {
    count: number;
    amount_cents: number;
    weighted_cents: number;
};

export default function DealForecastSummary({
    forecast,
}: {
    forecast: Forecast;
}) {
    return (
        <p
            className="max-w-[28rem] truncate text-[12px] tabular-nums text-mute"
            data-testid="forecast-summary"
            title={`${forecast.count} · ${formatDzd(forecast.amount_cents)} · ${t('Weighted')} ${formatDzd(forecast.weighted_cents)}`}
        >
            {forecast.count}
            {' · '}
            <span className="money">{formatDzd(forecast.amount_cents)}</span>
            {' · '}
            {t('Weighted')}{' '}
            <span className="money">{formatDzd(forecast.weighted_cents)}</span>
        </p>
    );
}
