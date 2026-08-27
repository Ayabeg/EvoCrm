import { EvoKpiCard } from '@/components/crm/evo-kpi-card';
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
            ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
            : columns === 5
              ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
              : columns === 4
                ? 'sm:grid-cols-2 xl:grid-cols-4'
                : columns === 3
                  ? 'sm:grid-cols-3'
                  : 'sm:grid-cols-2';

    return (
        <div
            className={cn('grid grid-cols-1 gap-3 sm:gap-4', columnClass, className)}
        >
            {kpis.map((kpi) => {
                const displayValue =
                    kpi.format === 'money' && typeof kpi.value === 'number'
                        ? kpi.value / 100
                        : kpi.value;

                const card = (
                    <EvoKpiCard
                        label={kpi.label}
                        value={displayValue}
                        format={kpi.format ?? 'number'}
                        hint={kpi.hint}
                        change={kpi.change}
                        changeLabel={kpi.changeLabel}
                        className={
                            kpi.href
                                ? 'transition-colors duration-150 hover:bg-canvas-soft'
                                : undefined
                        }
                    />
                );

                if (kpi.href) {
                    return (
                        <a
                            key={kpi.key}
                            href={kpi.href}
                            className="block rounded-2xl no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
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
