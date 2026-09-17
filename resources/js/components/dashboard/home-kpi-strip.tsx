import { Link } from '@inertiajs/react';
import type { KpiTile } from '@/components/crm/crm-kpi-strip';
import { formatCompactDzd } from '@/lib/money';
import { cn } from '@/lib/utils';

function formatKpiValue(kpi: KpiTile): string {
    if (kpi.value === null || kpi.value === undefined) {
        return '—';
    }

    if (kpi.format === 'money' && typeof kpi.value === 'number') {
        return formatCompactDzd(kpi.value);
    }

    if (kpi.format === 'percent' && typeof kpi.value === 'number') {
        return `${kpi.value}%`;
    }

    if (typeof kpi.value === 'number') {
        return new Intl.NumberFormat('en-US').format(kpi.value);
    }

    return kpi.value;
}

export function HomeKpiStrip({ kpis }: { kpis: KpiTile[] }) {
    if (kpis.length === 0) {
        return null;
    }

    return (
        <section aria-label="Sales snapshot">
            <div className="flex overflow-x-auto border-y border-hairline md:grid md:grid-cols-4 md:divide-x md:overflow-visible">
                {kpis.map((kpi) => {
                    const value = formatKpiValue(kpi);
                    const change =
                        kpi.change === null || kpi.change === undefined
                            ? null
                            : `${kpi.change > 0 ? '+' : ''}${kpi.change}%`;
                    const body = (
                        <article className="flex min-w-[7.5rem] flex-col gap-0.5 px-2.5 py-2 md:min-w-0 md:gap-1 md:px-3 md:py-2.5">
                            <p className="text-[11px] font-medium leading-4 text-mute">
                                {kpi.label}
                            </p>
                            <p className="money text-[1.375rem] leading-none tracking-tight whitespace-nowrap text-ink md:text-kpi">
                                {value}
                            </p>
                            {change || kpi.hint ? (
                                <p className="hidden truncate text-[11px] leading-4 text-mute sm:block">
                                    {[change, kpi.changeLabel, kpi.hint]
                                        .filter(Boolean)
                                        .join(' · ')}
                                </p>
                            ) : null}
                        </article>
                    );

                    if (kpi.href) {
                        return (
                            <Link
                                key={kpi.key}
                                href={kpi.href}
                                className={cn(
                                    'min-w-[7.5rem] shrink-0 no-underline transition-colors duration-150 md:min-w-0',
                                    'hover:bg-canvas-soft focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none',
                                )}
                                aria-label={`${kpi.label} ${value}`}
                            >
                                {body}
                            </Link>
                        );
                    }

                    return (
                        <div key={kpi.key} className="min-w-[7.5rem] shrink-0 md:min-w-0">
                            {body}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
