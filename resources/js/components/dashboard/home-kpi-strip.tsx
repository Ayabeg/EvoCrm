import { Link } from '@inertiajs/react';
import {
    ChartBar,
    Kanban,
    Percent,
    TrendUp,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import type { KpiTile } from '@/components/crm/crm-kpi-strip';
import { LtrValue } from '@/components/ltr-value';
import {
    HOME_KPI_STRIP_TRACK_CLASS,
    HOME_KPI_VALUE_CLASS,
} from '@/lib/dashboard-operating-home';
import { t } from '@/lib/i18n';
import { formatCompactDzd } from '@/lib/money';
import { MOTION_HOVER_CLASS } from '@/lib/motion';
import { cn } from '@/lib/utils';

const KPI_ICONS: Record<string, Icon> = {
    revenue: TrendUp,
    pipeline: ChartBar,
    win_rate: Percent,
    open_deals: Kanban,
};

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
        <section aria-label={t('Sales snapshot')}>
            <div className={HOME_KPI_STRIP_TRACK_CLASS}>
                {kpis.map((kpi) => {
                    const value = formatKpiValue(kpi);
                    const change =
                        kpi.change === null || kpi.change === undefined
                            ? null
                            : kpi.change;
                    const Icon = KPI_ICONS[kpi.key] ?? ChartBar;
                    const body = (
                        <article className="flex h-[140px] min-w-0 gap-3.5 rounded-[10px] border border-[var(--home-line)] bg-[var(--home-paper)] p-5">
                            <span className="grid size-[46px] shrink-0 place-items-center rounded-xl bg-[var(--home-well)] text-[var(--home-ink)]">
                                <Icon className="size-6" weight="regular" aria-hidden />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-[12px] leading-4 text-[var(--home-muted)]">{t(kpi.label)}</p>
                                <p className={HOME_KPI_VALUE_CLASS}>
                                    {kpi.format === 'money' ? <LtrValue>{value}</LtrValue> : value}
                                </p>
                                {kpi.hint ? (
                                    <p className="truncate text-[12px] leading-4 text-[var(--home-muted)]">
                                        {t(kpi.hint)}
                                    </p>
                                ) : null}
                                {change !== null ? (
                                    <p className="mt-1.5 text-end text-[12px] leading-4">
                                        <span
                                            className={cn(
                                                'font-semibold',
                                                change < 0 ? 'text-[var(--evo-danger)]' : 'text-[var(--evo-success)]',
                                            )}
                                        >
                                            {change < 0 ? '↓' : '↑'} {change > 0 ? '+' : ''}
                                            {change}%
                                        </span>
                                        <span className="mt-0.5 block text-[var(--home-muted)]">
                                            {t('vs last month')}
                                        </span>
                                    </p>
                                ) : null}
                            </div>
                        </article>
                    );

                    if (kpi.href) {
                        return (
                            <Link
                                key={kpi.key}
                                href={kpi.href}
                                className={cn(
                                    'min-w-0 rounded-[10px] no-underline',
                                    MOTION_HOVER_CLASS,
                                    'focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none',
                                )}
                                aria-label={`${kpi.label} ${value}`}
                            >
                                {body}
                            </Link>
                        );
                    }

                    return (
                        <div key={kpi.key} className="min-w-0">
                            {body}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
