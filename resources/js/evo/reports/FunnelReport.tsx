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

export type CampaignAttributionRow = {
    campaign_id: number | null;
    campaign_name: string;
    spend_cents: number;
    visits: number;
    leads: number;
    qualified_leads: number;
    deals_created: number;
    won_deals: number;
    won_revenue_cents: number;
    cpl_cents: number | null;
    roas: number | null;
};

export function FunnelReport({
    stages,
    kpis,
    sources,
    campaigns,
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
    campaigns: CampaignAttributionRow[];
}) {
    const steps: FunnelStep[] = stages.map((stage) => ({
        id: stage.key,
        label: stage.label,
        value: stage.count,
        hint:
            stage.rate_from_previous != null
                ? t(':pct from previous', {
                      pct: Math.round(stage.rate_from_previous * 100),
                  })
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
                row.original.cpl_cents != null
                    ? formatMoneyFromCents(row.original.cpl_cents)
                    : '—',
        },
    ];

    const campaignColumns: EvoDataGridColumn<CampaignAttributionRow>[] = [
        {
            id: 'campaign',
            header: t('Campaign'),
            accessorFn: (row) => row.campaign_name,
        },
        {
            id: 'leads',
            header: t('Leads'),
            accessorFn: (row) => row.leads,
            cell: ({ row }) => formatNumber(row.original.leads),
        },
        {
            id: 'qualified',
            header: t('Qualified'),
            accessorFn: (row) => row.qualified_leads,
            cell: ({ row }) => formatNumber(row.original.qualified_leads),
        },
        {
            id: 'won',
            header: t('Won revenue'),
            accessorFn: (row) => row.won_revenue_cents,
            cell: ({ row }) =>
                formatMoneyFromCents(row.original.won_revenue_cents),
        },
        {
            id: 'spend',
            header: t('Spend'),
            accessorFn: (row) => row.spend_cents,
            cell: ({ row }) => formatMoneyFromCents(row.original.spend_cents),
        },
        {
            id: 'roas',
            header: t('ROAS'),
            accessorFn: (row) => row.roas ?? 0,
            cell: ({ row }) =>
                row.original.roas != null ? `${row.original.roas}×` : '—',
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
                        hint:
                            kpis.cpl_cents != null
                                ? t('Spend ÷ visits')
                                : t('No visits in window'),
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
                <div>
                    <h2 className="text-[13px] font-medium text-[var(--evo-ink)]">
                        {t(
                            'Revenue attribution — which campaigns create value',
                        )}
                    </h2>
                    <p className="mt-1 text-[12px] text-[var(--evo-ink-muted)]">
                        {t(
                            'Campaign touches are connected to qualified leads, won deals, and recorded spend.',
                        )}
                    </p>
                </div>
                <DataGrid
                    columns={campaignColumns}
                    data={campaigns}
                    getRowId={(row) =>
                        row.campaign_id?.toString() ?? 'unattributed'
                    }
                    density="compact"
                    enableSelection={false}
                    pagination="none"
                    hideColumnPicker
                    embedded
                    enableSorting={false}
                    emptyTitle={t('No campaign attribution in this window')}
                />
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
