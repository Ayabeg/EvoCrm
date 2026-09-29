import { EvilComposedChart } from '@/components/evilcharts/charts/recharts-composed-chart';
import { Button } from '../components/Button';
import { ChartFrame } from '../components/ChartFrame';
import { FunnelJourney } from '../components/FunnelJourney';
import { LabLink } from '../components/LabLink';
import { KpiMetric, KpiStrip } from '../components/KpiMetric';
import { Module } from '../components/Module';
import { ContextChip, PageHeader } from '../components/PageHeader';
import { PrototypeRoom } from '../components/PrototypeRoom';
import { useLabLoading } from '../components/useLabLoading';
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
    exactRoas,
    getAdsFunnel,
    getAdsTotals,
    getCampaignTotals,
    getDailyAdPerformanceForCampaign,
    getWonDeals,
} from '../data/selectors';

const CHART_MARGIN = { top: 8, right: 12, left: 0, bottom: 4 };

type Props = {
    view?: string;
};

export function AdsHubPage({ view = 'overview' }: Props) {
    if (view !== 'overview' && view !== 'campaigns') {
        const labels: Record<string, string> = {
            accounts: 'Comptes',
            adsets: 'Ensembles',
            creatives: 'Publicités',
            leads: 'Leads pubs',
            audiences: 'Audiences',
            attribution: 'Attribution',
        };

        return (
            <PrototypeRoom
                title={labels[view] ?? 'Pubs'}
                descriptor="Pubs · Meta · septembre 2026"
                rows={[
                    { label: 'Compte', value: 'Compte Meta EO' },
                    { label: 'Période', value: '1–30 sept. 2026' },
                    { label: 'Campagnes actives', value: '4' },
                ]}
                note="Vue de navigation. Les totaux restent ceux du jeu septembre validé."
            />
        );
    }

    const loading = useLabLoading();
    const ads = getAdsTotals();
    const campaigns = getCampaignTotals();
    const daily = getDailyAdPerformanceForCampaign(null).map((row) => ({
        ...row,
        label: formatDayLabel(row.date),
    }));
    const funnel = getAdsFunnel();
    const won = getWonDeals().length;
    const cpl = Math.round(ads.spend / ads.leadsInbox);

    const journey = [
        { label: 'Impressions', value: funnel[0]?.value ?? 0 },
        { label: 'Clics', value: funnel[1]?.value ?? 0 },
        { label: 'Leads', value: funnel[2]?.value ?? 0 },
        { label: 'Affaires', value: funnel[3]?.value ?? 0 },
    ];

    return (
        <div className="space-y-7">
            <PageHeader
                title="Pubs"
                descriptor="Vue d’ensemble · Meta · septembre 2026"
                context={
                    <>
                        <ContextChip active>Compte Meta EO</ContextChip>
                        <ContextChip>1–30 sept. 2026</ContextChip>
                    </>
                }
                actions={
                    <Button variant="primary" disabled title="Prototype — création non branchée">
                        + Campagne
                    </Button>
                }
            />

            <KpiStrip>
                <KpiMetric label="Dépensé" value={formatDa(ads.spend)} />
                <KpiMetric label="Leads Inbox" value={formatCount(ads.leadsInbox)} hint={`CPL ${formatDa(cpl)}`} />
                <KpiMetric label="Affaires créées" value={formatCount(ads.deals)} />
                <KpiMetric
                    label="Pipeline attribué"
                    value={formatDa(ads.attributedRevenue)}
                    hint={`${formatCount(ads.deals)} affaires créées`}
                />
                <KpiMetric
                    label="Valeur / dépenses"
                    value={formatRoas(ads.displayedRoas)}
                    hint={`${formatDa(ads.attributedRevenue)} / ${formatDa(ads.spend)} · exact ${formatExactRoas(ads.exactRoas)}`}
                />
            </KpiStrip>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,0.9fr)]">
                <Module title="Dépenses & leads" hint="Barres = dépensé · ligne = leads" flush>
                    <ChartFrame loading={loading}>
                        <EvilComposedChart
                            data={daily}
                            config={spendLeadsChartConfig}
                            className="h-full w-full"
                            animationType="none"
                            chartProps={{ margin: CHART_MARGIN }}
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
                            <EvilComposedChart.Legend verticalAlign="bottom" align="center" />
                            <EvilComposedChart.Bar dataKey="spend" barProps={{ yAxisId: 'left' }} />
                            <EvilComposedChart.Line dataKey="leads" lineProps={{ yAxisId: 'right' }} />
                        </EvilComposedChart>
                    </ChartFrame>
                </Module>

                <Module
                    title="Parcours pubs"
                    hint="Les pourcentages sont les taux de passage. Les largeurs ne sont pas proportionnelles."
                >
                    <FunnelJourney
                        steps={journey}
                        footnote={`${won} gagnées sur la période — total compte, pas nécessairement attribuable aux pubs.`}
                    />
                </Module>
            </div>

            <Module title="Performance campagnes" hint="Valeur créée, pas CA gagné">
                <table className="w-full min-w-[720px] text-left text-[13px]">
                    <thead className="text-[11px] text-[var(--evo-ink-muted)]">
                        <tr className="border-b border-[var(--evo-hairline)]">
                            <th className="px-4 py-2 font-medium">Campagne</th>
                            <th className="px-4 py-2 text-right font-medium">Dépensé</th>
                            <th className="px-4 py-2 text-right font-medium">Leads</th>
                            <th className="px-4 py-2 text-right font-medium">Affaires</th>
                            <th className="px-4 py-2 text-right font-medium">Attribué</th>
                            <th className="px-4 py-2 text-right font-medium">Valeur / dép.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {campaigns.map((campaign) => (
                            <tr
                                key={campaign.id}
                                className="border-b border-[var(--evo-hairline)] hover:bg-[var(--evo-hover)]"
                            >
                                <td className="px-4 py-2.5">
                                    <LabLink
                                        to={{ name: 'campaign', id: campaign.id }}
                                        className="font-medium text-[var(--evo-teal)] hover:underline"
                                    >
                                        {campaign.name}
                                    </LabLink>
                                </td>
                                <td className="px-4 py-2.5 text-right tabular-nums">{formatDa(campaign.spend)}</td>
                                <td className="px-4 py-2.5 text-right tabular-nums">{formatCount(campaign.leads)}</td>
                                <td className="px-4 py-2.5 text-right tabular-nums">{formatCount(campaign.deals)}</td>
                                <td className="px-4 py-2.5 text-right tabular-nums">
                                    {formatDa(campaign.attributedRevenue)}
                                </td>
                                <td className="px-4 py-2.5 text-right tabular-nums">{formatRoas(campaign.roas)}</td>
                            </tr>
                        ))}
                        <tr className="bg-[var(--evo-canvas)]">
                            <td className="px-4 py-2.5 font-medium">Total</td>
                            <td className="px-4 py-2.5 text-right font-medium tabular-nums">{formatDa(ads.spend)}</td>
                            <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                                {formatCount(ads.leadsInbox)}
                            </td>
                            <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                                {formatCount(ads.deals)}
                            </td>
                            <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                                {formatDa(ads.attributedRevenue)}
                            </td>
                            <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                                {formatExactRoas(exactRoas(ads.attributedRevenue, ads.spend))}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </Module>
        </div>
    );
}
