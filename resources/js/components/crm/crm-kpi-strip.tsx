import { formatCompactDzd } from '@/lib/money';
import { cn } from '@/lib/utils';

export type KpiTile = {
    key: string;
    label: string;
    value: number | string | null;
    format?: 'number' | 'money' | 'percent';
    hint?: string;
    href?: string;
    change?: number | null;
    changeLabel?: string;
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

export function CrmKpiStrip({
    kpis,
    columns = 4,
    className,
}: {
    kpis: KpiTile[];
    columns?: 2 | 3 | 4 | 5 | 6;
    className?: string;
}) {
    if (kpis.length === 0) {
        return null;
    }

    const columnClass =
        columns >= 6
            ? 'min-[430px]:grid-cols-3 xl:grid-cols-6'
            : columns === 5
              ? 'min-[430px]:grid-cols-3 xl:grid-cols-5'
              : columns === 4
                ? 'min-[430px]:grid-cols-2 xl:grid-cols-4'
                : columns === 3
                  ? 'min-[430px]:grid-cols-3'
                  : 'min-[430px]:grid-cols-2';

    return (
        <section
            aria-label="Key figures"
            className={cn(
                'grid grid-cols-2 divide-hairline border-y border-hairline',
                columnClass,
                className,
            )}
        >
            {kpis.map((kpi) => {
                const value = formatKpiValue(kpi);
                const change =
                    kpi.change === null || kpi.change === undefined
                        ? null
                        : `${kpi.change > 0 ? '+' : ''}${kpi.change}%`;
                const body = (
                    <article className="flex min-w-0 flex-col gap-0.5 px-2.5 py-2 md:px-3 md:py-2.5">
                        <p className="text-[11px] font-medium leading-4 text-mute">
                            {kpi.label}
                        </p>
                        <p className="money text-[1.375rem] leading-none tracking-tight text-ink md:text-kpi">
                            {value}
                        </p>
                        {change || kpi.hint || kpi.changeLabel ? (
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
                        <a
                            key={kpi.key}
                            href={kpi.href}
                            className="min-w-0 no-underline transition-colors hover:bg-canvas-soft focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                            aria-label={`${kpi.label} ${value}`}
                        >
                            {body}
                        </a>
                    );
                }

                return (
                    <div key={kpi.key} className="min-w-0">
                        {body}
                    </div>
                );
            })}
        </section>
    );
}
