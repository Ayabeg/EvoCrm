import { FunnelChart } from '@/evo/charts';
import type { FunnelStep } from '@/evo/charts';
import { DataGrid } from '@/evo/data/data-grid';
import type { EvoDataGridColumn } from '@/evo/data/data-grid';
import { formatMoneyFromCents, formatNumber } from '@/evo/lib/format';
import { ReportKpiRow } from '@/evo/reports/ReportKpiRow';
import { t } from '@/lib/i18n';

export type FunnelStageRow = {
    key: string;
    label: string;
    count: number;
    rate_from_previous: number | null;
    rate_from_top: number | null;
};

export type SourceBreakdownRow = {
    source: string;
    visits: number;
    orders_placed: number;
    confirmed?: number;
    delivered?: number;
    spend_cents: number;
    cpl_cents: number | null;
};

export function FunnelReport({
    stages,
    kpis,
    sources,
}: {
    stages: FunnelStageRow[];
    kpis: {
        spend_cents: number;
        visits: number;
        orders: number;
        cpl_cents: number | null;
        conversion_rate: number | null;
    };
    sources: SourceBreakdownRow[];
}) {
    const steps: FunnelStep[] = stages.map((stage) => ({
        id: stage.key,
        label: stage.label,
        value: stage.count,
        hint:
            stage.rate_from_previous != null
                ? t(':pct from previous', { pct: Math.round(stage.rate_from_previous * 100) })
                : undefined,
    }));

    const columns: EvoDataGridColumn<SourceBreakdownRow>[] = [
        { id: 'source', header: t('Source'), accessorFn: (row) => row.source },
        {
            id: 'visits',
            header: t('Visits'),
            accessorFn: (row) => row.visits,
            cell: ({ row }) => formatNumber(row.original.visits),
        },
        {
            id: 'orders',
            header: t('Orders'),
            accessorFn: (row) => row.orders_placed,
            cell: ({ row }) => formatNumber(row.original.orders_placed),
        },
        {
            id: 'spend',
            header: t('Spend'),
            accessorFn: (row) => row.spend_cents,
            cell: ({ row }) => formatMoneyFromCents(row.original.spend_cents),
        },
        {
            id: 'cpl',
            header: t('CPL'),
            accessorFn: (row) => row.cpl_cents ?? 0,
            cell: ({ row }) =>
                row.original.cpl_cents != null ? formatMoneyFromCents(row.original.cpl_cents) : '—',
        },
    ];

    return (
        <div className="space-y-6">
            <ReportKpiRow
                columns={5}
                kpis={[
                    {
                        label: t('Ad spend'),
                        value: kpis.spend_cents,
                        format: 'money',
                        hint: t('Total source spend in window'),
                    },
                    {
                        label: t('Visits'),
                        value: kpis.visits,
                        hint: t('Top-of-funnel traffic'),
                    },
                    {
                        label: t('Orders'),
                        value: kpis.orders,
                        hint: t('Bottom-of-funnel conversions'),
                    },
                    {
                        label: t('Cost per lead'),
                        value: kpis.cpl_cents,
                        format: 'money',
                        hint: kpis.cpl_cents != null ? t('Spend ÷ visits') : t('No visits in window'),
                    },
                    {
                        label: t('Visit → order'),
                        value: kpis.conversion_rate,
                        format: 'percent',
                        hint:
                            kpis.conversion_rate != null
                                ? t('Conversion rate')
                                : t('No visits to convert'),
                    },
                ]}
            />

            <section className="space-y-3">
                <h2 className="text-[13px] font-medium text-[var(--evo-ink)]">
                    {t('Stage conversion — where drop-off happens')}
                </h2>
                <div className="rounded-[var(--evo-radius-standard)] border border-[var(--evo-hairline)] bg-[var(--evo-surface)] p-4">
                    <FunnelChart steps={steps} />
                </div>
            </section>

            <section className="space-y-3">
                <h2 className="text-[13px] font-medium text-[var(--evo-ink)]">
                    {t('Source breakdown — which channels convert')}
                </h2>
                <DataGrid
                    columns={columns}
                    data={sources}
                    getRowId={(row) => row.source}
                    density="compact"
                    enableSelection={false}
                    pagination="none"
                    hideColumnPicker
                    embedded
                    enableSorting={false}
                    emptyTitle={t('No sources in this window')}
                />
            </section>
        </div>
    );
}
