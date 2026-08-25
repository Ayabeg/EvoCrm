import { EvoKpiCard } from '@/components/crm/evo-kpi-card';

export type KpiTile = {
    key: string;
    label: string;
    value: number | string | null;
    format?: 'number' | 'money' | 'percent';
    hint?: string;
    href?: string;
};

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

    const gridClass =
        columns === 6
            ? 'sm:grid-cols-3 xl:grid-cols-6'
            : columns === 5
              ? 'sm:grid-cols-3 xl:grid-cols-5'
              : columns === 3
                ? 'sm:grid-cols-3'
                : columns === 2
                  ? 'grid-cols-2'
                  : 'sm:grid-cols-2 xl:grid-cols-4';

    return (
        <div className={`grid grid-cols-2 gap-3 ${gridClass} ${className ?? ''}`}>
            {kpis.map((kpi) => {
                const displayValue =
                    kpi.format === 'percent' && typeof kpi.value === 'number'
                        ? `${new Intl.NumberFormat('en-US').format(kpi.value)}%`
                        : kpi.format === 'money' && typeof kpi.value === 'number'
                          ? kpi.value / 100
                          : kpi.value;

                const card = (
                    <EvoKpiCard
                        label={kpi.label}
                        value={displayValue}
                        format={kpi.format === 'money' ? 'money' : 'number'}
                        hint={kpi.hint}
                        className={
                            kpi.href
                                ? 'h-full cursor-pointer hover:border-brand/60'
                                : undefined
                        }
                    />
                );

                if (kpi.href) {
                    return (
                        <a
                            key={kpi.key}
                            href={kpi.href}
                            className="block no-underline"
                        >
                            {card}
                        </a>
                    );
                }

                return <div key={kpi.key}>{card}</div>;
            })}
        </div>
    );
}
