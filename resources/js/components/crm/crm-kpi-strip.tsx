import {
    Activity,
    CircleDollarSign,
    Handshake,
    Percent,
    TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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

const KPI_ICONS: Record<string, LucideIcon> = {
    revenue: CircleDollarSign,
    pipeline: TrendingUp,
    win_rate: Percent,
    open_deals: Handshake,
    activities_done: Activity,
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
                        ? 'repeat(auto-fill, minmax(180px, 1fr))'
                        : undefined,
            }}
        >
            {kpis.map((kpi) => {
                const displayValue =
                    kpi.format === 'money' && typeof kpi.value === 'number'
                        ? kpi.value / 100
                        : kpi.value;

                const Icon = KPI_ICONS[kpi.key];

                const card = (
                    <EvoKpiCard
                        label={kpi.label}
                        value={displayValue}
                        format={kpi.format ?? 'number'}
                        hint={kpi.hint}
                        change={kpi.change}
                        changeLabel={kpi.changeLabel}
                        icon={Icon ? <Icon className="size-4" /> : undefined}
                        className={
                            kpi.href
                                ? 'h-full cursor-pointer transition-transform duration-150 hover:-translate-y-0.5'
                                : 'h-full'
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
