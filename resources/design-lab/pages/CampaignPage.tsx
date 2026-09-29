import { EvilComposedChart } from '@/components/evilcharts/charts/recharts-composed-chart';
import { ChartFrame } from '../components/ChartFrame';
import { LabLink } from '../components/LabLink';
import { KpiMetric, KpiStrip } from '../components/KpiMetric';
import { Module } from '../components/Module';
import { ContextChip, PageHeader } from '../components/PageHeader';
import { useLabLoading } from '../components/useLabLoading';
import { campaigns, deals } from '../data/evocrm-demo-data';
import { spendLeadsChartConfig } from '../data/chart-config';
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

            <KpiStrip>
                <KpiMetric label="Dépensé" value={formatDa(totals.spend)} />
                <KpiMetric label="Leads" value={formatCount(totals.leads)} />
                <KpiMetric label="Affaires" value={formatCount(totals.deals)} />
                <KpiMetric label="Pipeline attribué" value={formatDa(totals.attributedRevenue)} />
                <KpiMetric
                    label="Valeur / dépenses"
                    value={formatRoas(totals.roas)}
                    hint={`exact ${formatExactRoas(totals.exactRoas)}`}
                />
            </KpiStrip>

            <Module title="Dépenses & leads" hint="Filtré sur cette campagne" flush>
                <ChartFrame loading={loading}>
                    <EvilComposedChart
                        data={daily}
                        config={spendLeadsChartConfig}
                        className="h-full w-full"
                        animationType="none"
                    >
                        <EvilComposedChart.Grid stroke="var(--evo-hairline)" vertical={false} />
                        <EvilComposedChart.XAxis dataKey="label" />
                        <EvilComposedChart.YAxis
                            yAxisId="left"
                            tickFormatter={(value: number) => formatCompactAxis(value)}
                        />
                        <EvilComposedChart.YAxis
                            yAxisId="right"
                            orientation="right"
                            tickFormatter={(value: number) => formatCount(value)}
                        />
                        <EvilComposedChart.Tooltip />
                        <EvilComposedChart.Bar dataKey="spend" barProps={{ yAxisId: 'left' }} />
                        <EvilComposedChart.Line dataKey="leads" lineProps={{ yAxisId: 'right' }} />
                    </EvilComposedChart>
                </ChartFrame>
            </Module>

            <Module title="Affaires de la campagne" hint={`${campaignDeals.length} affaires · valeur créée`}>
                <table className="w-full text-left text-[13px]">
                    <thead className="text-[11px] text-[var(--evo-ink-muted)]">
                        <tr className="border-b border-[var(--evo-hairline)]">
                            <th className="px-4 py-2 font-medium">Affaire</th>
                            <th className="px-4 py-2 font-medium">Société</th>
                            <th className="px-4 py-2 font-medium">Statut</th>
                            <th className="px-4 py-2 text-right font-medium">Valeur</th>
                        </tr>
                    </thead>
                    <tbody>
                        {campaignDeals.map((deal) => (
                            <tr key={deal.id} className="border-b border-[var(--evo-hairline)] last:border-0">
                                <td className="px-4 py-2.5">
                                    <LabLink
                                        to={{ name: 'deal', id: deal.id }}
                                        className="font-medium text-[var(--evo-teal)] hover:underline"
                                    >
                                        {deal.name}
                                    </LabLink>
                                </td>
                                <td className="px-4 py-2.5">{getCompany(deal.companyId).name}</td>
                                <td className="px-4 py-2.5">
                                    {deal.status === 'open' ? STAGE_LABELS[deal.stage] : deal.status === 'won' ? 'Gagné' : 'Perdu'}
                                </td>
                                <td className="px-4 py-2.5 text-right tabular-nums">{formatDa(deal.value)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Module>
        </div>
    );
}
