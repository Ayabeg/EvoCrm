import { useState } from 'react';
import { EvilBarChart } from '@/components/evilcharts/charts/recharts-bar-chart';
import { EvilComposedChart } from '@/components/evilcharts/charts/recharts-composed-chart';
import { ChartFrame } from '../components/ChartFrame';
import { KpiCard } from '../components/KpiCard';
import { useLabLoading } from '../components/useLabLoading';
import { spendLeadsChartConfig, valueChartConfig } from '../data/chart-config';
import { formatCount, formatDa, formatDayLabel, formatRate, formatRoas } from '../data/format';
import {
    getAdsFunnel,
    getAdsTotals,
    getCampaignTotals,
    getDailyAdPerformanceForCampaign,
    getWonDeals,
} from '../data/selectors';

export function AdsHubPage() {
    const loading = useLabLoading();
    const [campaignId, setCampaignId] = useState<string | null>(null);
    const ads = getAdsTotals();
    const campaigns = getCampaignTotals();
    const daily = getDailyAdPerformanceForCampaign(campaignId).map((row) => ({
        ...row,
        label: formatDayLabel(row.date),
    }));
    const funnel = getAdsFunnel();
    const topFunnel = funnel.filter((row) => row.group === 'top');
    const bottomFunnel = funnel.filter((row) => row.group === 'bottom');
    const selected = campaigns.find((row) => row.id === campaignId);

    return (
        <div className="space-y-5">
            <section className="grid grid-cols-2 border border-[var(--evo-border)] bg-[var(--evo-surface)] lg:grid-cols-5">
                <KpiCard label="Dépensé" value={formatDa(ads.spend)} />
                <KpiCard label="Leads Inbox" value={formatCount(ads.leadsInbox)} />
                <KpiCard label="Deals" value={formatCount(ads.deals)} />
                <KpiCard
                    label="Revenu attribué"
                    value={formatDa(ads.attributedRevenue)}
                    hint="Valeur des deals créés"
                />
                <KpiCard
                    label="ROAS affiché"
                    value={formatRoas(ads.displayedRoas)}
                    hint={`Exact ${ads.exactRoas.toLocaleString('fr-DZ', { maximumFractionDigits: 2 })}x`}
                />
            </section>

            <ChartFrame
                title="Dépensé vs Leads Inbox"
                loading={loading}
                hint={selected ? selected.name : 'Toutes les campagnes'}
            >
                <EvilComposedChart
                    data={daily}
                    config={spendLeadsChartConfig}
                    className="h-full w-full"
                    animationType="none"
                    chartProps={{ margin: { top: 8, right: 16, left: 4, bottom: 4 } }}
                >
                    <EvilComposedChart.Grid />
                    <EvilComposedChart.XAxis dataKey="label" />
                    <EvilComposedChart.YAxis
                        yAxisId="left"
                        tickFormatter={(value: number) => formatCount(value)}
                    />
                    <EvilComposedChart.YAxis
                        yAxisId="right"
                        orientation="right"
                        tickFormatter={(value: number) => formatCount(value)}
                    />
                    <EvilComposedChart.Tooltip />
                    <EvilComposedChart.Legend verticalAlign="bottom" align="center" />
                    <EvilComposedChart.Bar dataKey="spend" barProps={{ yAxisId: 'left' }} />
                    <EvilComposedChart.Line dataKey="leads" lineProps={{ yAxisId: 'right' }} />
                </EvilComposedChart>
            </ChartFrame>

            <div className="grid gap-4 xl:grid-cols-2">
                <ChartFrame
                    title="Haut de funnel"
                    loading={loading}
                    hint="Échelle linéaire — impressions et clics"
                >
                    <EvilBarChart
                        data={topFunnel}
                        config={valueChartConfig}
                        className="h-full w-full"
                        layout="horizontal"
                        animationType="none"
                    >
                        <EvilBarChart.Grid />
                        <EvilBarChart.XAxis tickFormatter={(value: number) => formatCount(value)} />
                        <EvilBarChart.YAxis dataKey="step" width={110} />
                        <EvilBarChart.Tooltip />
                        <EvilBarChart.Bar dataKey="value" enableHoverHighlight />
                    </EvilBarChart>
                </ChartFrame>
                <ChartFrame
                    title="Bas de funnel"
                    loading={loading}
                    hint={`Gagnés ${getWonDeals().length} = période, pas ${ads.deals} deals ads`}
                >
                    <EvilBarChart
                        data={bottomFunnel}
                        config={valueChartConfig}
                        className="h-full w-full"
                        layout="horizontal"
                        animationType="none"
                    >
                        <EvilBarChart.Grid />
                        <EvilBarChart.XAxis tickFormatter={(value: number) => formatCount(value)} />
                        <EvilBarChart.YAxis dataKey="step" width={130} />
                        <EvilBarChart.Tooltip />
                        <EvilBarChart.Bar dataKey="value" enableHoverHighlight />
                    </EvilBarChart>
                </ChartFrame>
            </div>

            <section className="border border-[var(--evo-border)] bg-[var(--evo-surface)]">
                <header className="border-b border-[var(--evo-border-subtle)] px-4 py-3">
                    <h2 className="text-[15px] font-semibold">Taux de passage</h2>
                    <p className="mt-1 text-[12px] text-[var(--evo-ink-muted)]">
                        Volumes réels ci-dessus. Ici, le ratio d’une étape à la suivante — pas une barre d’impressions.
                    </p>
                </header>
                <div className="grid grid-cols-2 md:grid-cols-4">
                    {funnel.map((row, index) => {
                        if (index === 0) {
                            return null;
                        }

                        const previous = funnel[index - 1];

                        return (
                            <div
                                key={row.step}
                                className="border-t border-[var(--evo-border-subtle)] px-4 py-3 md:border-t-0 md:border-l md:first:border-l-0"
                            >
                                <p className="text-[11px] text-[var(--evo-ink-muted)]">
                                    {previous.step} → {row.step}
                                </p>
                                <p className="mt-1 text-[18px] font-semibold tabular-nums">
                                    {formatRate(row.conversionFromPrevious)}
                                </p>
                                <p className="mt-1 text-[12px] text-[var(--evo-ink-secondary)]">
                                    {formatCount(previous.value)} → {formatCount(row.value)}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </section>

            <section className="border border-[var(--evo-border)] bg-[var(--evo-surface)]">
                <header className="flex items-center justify-between border-b border-[var(--evo-border-subtle)] px-4 py-3">
                    <h2 className="text-[15px] font-semibold">Campagnes</h2>
                    <p className="text-[12px] text-[var(--evo-ink-muted)]">
                        Cliquez une ligne pour filtrer le graphique quotidien
                    </p>
                </header>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] text-left text-[13px]">
                        <thead className="text-[11px] text-[var(--evo-ink-muted)]">
                            <tr className="border-b border-[var(--evo-border-subtle)]">
                                <th className="px-4 py-2 font-medium">Campagne</th>
                                <th className="px-4 py-2 text-right font-medium">Dépensé</th>
                                <th className="px-4 py-2 text-right font-medium">Leads</th>
                                <th className="px-4 py-2 text-right font-medium">Deals</th>
                                <th className="px-4 py-2 text-right font-medium">Attribué</th>
                                <th className="px-4 py-2 text-right font-medium">ROAS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {campaigns.map((campaign) => {
                                const active = campaignId === campaign.id;

                                return (
                                    <tr
                                        key={campaign.id}
                                        className={
                                            active
                                                ? 'bg-[var(--evo-teal-soft)]'
                                                : 'hover:bg-[var(--evo-hover)]'
                                        }
                                    >
                                        <td className="px-4 py-2.5">
                                            <button
                                                type="button"
                                                className="text-left font-medium text-[var(--evo-teal)] hover:underline"
                                                onClick={() => {
                                                    setCampaignId(active ? null : campaign.id);
                                                }}
                                            >
                                                {campaign.name}
                                            </button>
                                        </td>
                                        <td className="px-4 py-2.5 text-right tabular-nums">
                                            {formatDa(campaign.spend)}
                                        </td>
                                        <td className="px-4 py-2.5 text-right tabular-nums">
                                            {formatCount(campaign.leads)}
                                        </td>
                                        <td className="px-4 py-2.5 text-right tabular-nums">
                                            {formatCount(campaign.deals)}
                                        </td>
                                        <td className="px-4 py-2.5 text-right tabular-nums">
                                            {formatDa(campaign.attributedRevenue)}
                                        </td>
                                        <td className="px-4 py-2.5 text-right tabular-nums">
                                            {formatRoas(campaign.roas)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
