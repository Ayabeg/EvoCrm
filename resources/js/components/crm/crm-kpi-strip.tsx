import { EvoKpiCard } from '@/components/crm/evo-kpi-card';
import { StatGrid } from '@/components/ui/aurora/stat-card';

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

    return (
        <StatGrid
            className={className}
            style={{
                gridTemplateColumns:
                    columns >= 5
                        ? 'repeat(auto-fill, minmax(160px, 1fr))'
                        : undefined,
            }}
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
        </StatGrid>
    );
}
