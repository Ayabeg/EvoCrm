import { EvilAreaChart } from '@/components/evilcharts/charts/recharts-area-chart';
import { EvilBarChart } from '@/components/evilcharts/charts/recharts-bar-chart';
import { EvilComposedChart } from '@/components/evilcharts/charts/recharts-composed-chart';
import { EvilLineChart } from '@/components/evilcharts/charts/recharts-line-chart';
import { EvilSankeyChart } from '@/components/evilcharts/charts/recharts-sankey-chart';
import { ChartFrame } from '../components/ChartFrame';
import { KpiCard } from '../components/KpiCard';
import { useLabLoading } from '../components/useLabLoading';
import {
    campaignCompareChartConfig,
    cumulativeChartConfig,
    leadsChartConfig,
    sankeyChartConfig,
    spendChartConfig,
    spendLeadsChartConfig,
} from '../data/chart-config';
import { formatCount, formatDa, formatDayLabel, formatPercent, formatRoas } from '../data/format';
import {
    getAdsTotals,
    getCampaignTotals,
    getConversionRate,
    getCumulativeWonRevenue,
    getDailyAdPerformance,
    getGoalProgress,
    getLeadSourceChartRows,
    getOpenDealCount,
    getQuoteTotals,
    getSankeyDealFlow,
    getTotalOpenPipeline,
    getWonRevenue,
} from '../data/selectors';

export function ReportsPage() {
    const loading = useLabLoading();
    const ads = getAdsTotals();
    const quotes = getQuoteTotals();
    const daily = getDailyAdPerformance().map((row) => ({
        ...row,
        label: formatDayLabel(row.date),
    }));
    const cumulative = getCumulativeWonRevenue().map((row) => ({
        date: row.date,
        label: formatDayLabel(row.date),
        cumulative: row.cumulative,
        won: row.won,
    }));
    const campaigns = getCampaignTotals().map((row) => ({
        label: row.name,
        spend: row.spend,
        pipeline: row.attributedRevenue,
    }));
    const sources = getLeadSourceChartRows();
    const flow = getSankeyDealFlow();
    const goals = getGoalProgress();

    return (
        <div className="space-y-5">
            <section className="grid grid-cols-2 border border-[var(--evo-border)] bg-[var(--evo-surface)] lg:grid-cols-4">
                <KpiCard label="CA gagné" value={formatDa(getWonRevenue())} />
                <KpiCard
                    label="Pipeline ouvert"
                    value={formatDa(getTotalOpenPipeline())}
                    hint={`${getOpenDealCount()} deals`}
                />
                <KpiCard label="Conversion" value={formatPercent(getConversionRate())} />
                <KpiCard
                    label="ROAS Ads"
                    value={formatRoas(ads.displayedRoas)}
                    hint={`${formatDa(ads.attributedRevenue)} / ${formatDa(ads.spend)}`}
                />
            </section>

            <div className="grid gap-4 xl:grid-cols-2">
                <ChartFrame title="Tendance CA cumulé" loading={loading}>
                    <EvilLineChart
                        data={cumulative}
                        config={cumulativeChartConfig}
                        className="h-full w-full"
                        animationType="none"
                    >
                        <EvilLineChart.Grid />
                        <EvilLineChart.XAxis dataKey="label" />
                        <EvilLineChart.YAxis tickFormatter={(value: number) => formatCount(value)} />
                        <EvilLineChart.Tooltip />
                        <EvilLineChart.Line dataKey="cumulative" />
                    </EvilLineChart>
                </ChartFrame>
                <ChartFrame title="Dépensé Ads dans le mois" loading={loading}>
                    <EvilAreaChart
                        data={daily}
                        config={spendChartConfig}
                        className="h-full w-full"
                        animationType="none"
                    >
                        <EvilAreaChart.Grid />
                        <EvilAreaChart.XAxis dataKey="label" />
                        <EvilAreaChart.YAxis tickFormatter={(value: number) => formatCount(value)} />
                        <EvilAreaChart.Tooltip />
                        <EvilAreaChart.Area dataKey="spend" />
                    </EvilAreaChart>
                </ChartFrame>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <ChartFrame title="Comparaison campagnes" loading={loading} hint="Valeur de deals créés">
                    <EvilBarChart
                        data={campaigns}
                        config={campaignCompareChartConfig}
                        className="h-full w-full"
                        animationType="none"
                    >
                        <EvilBarChart.Grid />
                        <EvilBarChart.XAxis dataKey="label" />
                        <EvilBarChart.YAxis tickFormatter={(value: number) => formatCount(value)} />
                        <EvilBarChart.Tooltip />
                        <EvilBarChart.Legend />
                        <EvilBarChart.Bar dataKey="spend" enableHoverHighlight />
                        <EvilBarChart.Bar dataKey="pipeline" enableHoverHighlight />
                    </EvilBarChart>
                </ChartFrame>
                <ChartFrame title="Dépensé et leads, jour par jour" loading={loading}>
                    <EvilComposedChart
                        data={daily}
                        config={spendLeadsChartConfig}
                        className="h-full w-full"
                        animationType="none"
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
                        <EvilComposedChart.Legend />
                        <EvilComposedChart.Bar dataKey="spend" barProps={{ yAxisId: 'left' }} />
                        <EvilComposedChart.Line dataKey="leads" lineProps={{ yAxisId: 'right' }} />
                    </EvilComposedChart>
                </ChartFrame>
            </div>

            <ChartFrame
                title="Flux de valeur des deals"
                loading={loading}
                hint="Sources → ouvert / gagné / perdu"
            >
                <EvilSankeyChart
                    data={flow}
                    config={sankeyChartConfig}
                    className="h-full w-full"
                >
                    <EvilSankeyChart.Node>
                        <EvilSankeyChart.NodeLabel
                            position="outside"
                            showValues
                            valueFormatter={formatCount}
                        />
                    </EvilSankeyChart.Node>
                    <EvilSankeyChart.Link />
                    <EvilSankeyChart.Tooltip />
                </EvilSankeyChart>
            </ChartFrame>

            <ChartFrame title="Sources, volume de leads" loading={loading}>
                <EvilBarChart
                    data={sources}
                    config={leadsChartConfig}
                    className="h-full w-full"
                    layout="horizontal"
                    animationType="none"
                >
                    <EvilBarChart.Grid />
                    <EvilBarChart.XAxis tickFormatter={(value: number) => formatCount(value)} />
                    <EvilBarChart.YAxis dataKey="source" width={120} />
                    <EvilBarChart.Tooltip />
                    <EvilBarChart.Bar dataKey="leads" enableHoverHighlight />
                </EvilBarChart>
            </ChartFrame>

            <section className="border border-[var(--evo-border)] bg-[var(--evo-surface)] px-4 py-4">
                <h2 className="text-[15px] font-semibold">Objectifs septembre</h2>
                <ul className="mt-3 grid gap-3 md:grid-cols-2">
                    {goals.map((goal) => (
                        <li key={goal.id} className="text-[13px]">
                            <p className="font-medium">{goal.name}</p>
                            <p className="text-[var(--evo-ink-muted)]">
                                {goal.metric === 'ads_roas'
                                    ? `${formatRoas(goal.current)} / ${formatRoas(goal.target)}`
                                    : goal.metric === 'quotes_sent'
                                        ? `${formatCount(goal.current)} / ${formatCount(goal.target)}`
                                        : `${formatDa(goal.current)} / ${formatDa(goal.target)}`}
                            </p>
                        </li>
                    ))}
                </ul>
                <p className="mt-4 text-[12px] text-[var(--evo-ink-muted)]">
                    Devis envoyés {formatCount(quotes.sent)} · en attente {formatCount(quotes.pending)} (
                    {formatDa(quotes.pendingValue)}).
                </p>
            </section>
        </div>
    );
}
