import { ChartFrame, ComposedChart } from '@/evo/charts';
import { DataGrid } from '@/evo/data/data-grid';
import { CrmKpiStrip } from '@/evo/patterns/kpi';
import { Card, CardContent, CardHeader, CardTitle } from '@/evo/ui/card';
import { Status } from '@/evo/ui/status';
import { LabLink } from '../components/LabLink';
import { ContextChip, PageHeader } from '../components/PageHeader';
import { useLabLoading } from '../components/useLabLoading';
import { campaigns, deals } from '../data/evocrm-demo-data';
import {
    formatCompactAxis,
    formatCount,
    formatDa,
    formatDayLabel,
    formatExactRoas,
    formatRoas,
} from '../data/format';
import {
    STAGE_LABELS,
    getCampaignTotals,
    getCompany,
    getDailyAdPerformanceForCampaign,
} from '../data/selectors';

type Props = {
    id: string;
};

export function CampaignPage({ id }: Props) {
    const loading = useLabLoading();
    const campaign = campaigns.find((row) => row.id === id);
    const totals = getCampaignTotals().find((row) => row.id === id);
    const campaignDeals = deals.filter((deal) => deal.sourceCampaignId === id);
    const daily = getDailyAdPerformanceForCampaign(id).map((row) => ({
        ...row,
        label: formatDayLabel(row.date),
    }));

    if (!campaign || !totals) {
        return <p className="text-[14px] text-[var(--evo-ink-muted)]">Campagne introuvable.</p>;
    }

    return (
        <div className="space-y-7">
            <PageHeader
                eyebrow="Pubs / Campagnes"
                title={campaign.name}
                descriptor="Compte Meta EO · septembre 2026"
                context={
                    <>
                        <ContextChip>
                            <LabLink to={{ name: 'ads' }}>Retour vue d’ensemble</LabLink>
                        </ContextChip>
                        <ContextChip active>1–30 sept. 2026</ContextChip>
                    </>
                }
            />

            <CrmKpiStrip
                columns={5}
                kpis={[
                    { key: 'spend', label: 'Dépensé', value: formatDa(totals.spend) },
                    { key: 'leads', label: 'Leads', value: formatCount(totals.leads) },
                    { key: 'deals', label: 'Affaires', value: formatCount(totals.deals) },
                    { key: 'pipeline', label: 'Pipeline attribué', value: formatDa(totals.attributedRevenue) },
                    {
                        key: 'roas',
                        label: 'Valeur / dépenses',
                        value: formatRoas(totals.roas),
                        hint: `exact ${formatExactRoas(totals.exactRoas)}`,
                    },
                ]}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Dépenses & leads</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartFrame height={280} loading={loading} label="Dépenses et leads">
                        <ComposedChart
                            data={daily}
                            xKey="label"
                            height={280}
                            yTickFormatter={(value) => formatCompactAxis(value)}
                            rightYTickFormatter={(value) => formatCount(value)}
                            series={[
                                { type: 'bar', dataKey: 'spend', name: 'Dépensé', yAxisId: 'left' },
                                { type: 'line', dataKey: 'leads', name: 'Leads', yAxisId: 'right' },
                            ]}
                        />
                    </ChartFrame>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Affaires de la campagne</CardTitle>
                </CardHeader>
                <CardContent>
                    <DataGrid
                        columns={[
                            {
                                id: 'name',
                                header: 'Affaire',
                                accessorFn: (row) => row.name,
                                cell: ({ row }) => (
                                    <LabLink
                                        to={{ name: 'deal', id: row.original.id }}
                                        className="font-medium text-[var(--evo-teal)] hover:underline"
                                    >
                                        {row.original.name}
                                    </LabLink>
                                ),
                            },
                            {
                                id: 'company',
                                header: 'Société',
                                accessorFn: (row) => getCompany(row.companyId).name,
                            },
                            {
                                id: 'status',
                                header: 'Statut',
                                accessorFn: (row) =>
                                    row.status === 'open'
                                        ? STAGE_LABELS[row.stage]
                                        : row.status === 'won'
                                          ? 'Gagné'
                                          : 'Perdu',
                                cell: ({ row }) => (
                                    <Status
                                        tone={
                                            row.original.status === 'won'
                                                ? 'success'
                                                : row.original.status === 'lost'
                                                  ? 'error'
                                                  : 'info'
                                        }
                                        label={
                                            row.original.status === 'open'
                                                ? STAGE_LABELS[row.original.stage]
                                                : row.original.status === 'won'
                                                  ? 'Gagné'
                                                  : 'Perdu'
                                        }
                                    />
                                ),
                            },
                            {
                                id: 'value',
                                header: 'Valeur',
                                accessorFn: (row) => row.value,
                                cell: ({ row }) => (
                                    <span className="tabular-nums">{formatDa(row.original.value)}</span>
                                ),
                            },
                        ]}
                        data={campaignDeals}
                        getRowId={(row) => row.id}
                        density="compact"
                        enableSelection={false}
                        emptyTitle="Aucune affaire attribuée"
                    />
                </CardContent>
            </Card>
        </div>
    );
}
