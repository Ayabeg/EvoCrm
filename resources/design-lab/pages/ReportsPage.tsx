import { EvilBarChart } from '@/components/evilcharts/charts/recharts-bar-chart';
import { EvilComposedChart } from '@/components/evilcharts/charts/recharts-composed-chart';
import { EvilLineChart } from '@/components/evilcharts/charts/recharts-line-chart';
import { EvilSankeyChart } from '@/components/evilcharts/charts/recharts-sankey-chart';
import { ChartFrame } from '../components/ChartFrame';
import { LabLink } from '../components/LabLink';
import { KpiMetric, KpiStrip } from '../components/KpiMetric';
import { Module } from '../components/Module';
import { ContextChip, PageHeader } from '../components/PageHeader';
import { PrototypeRoom } from '../components/PrototypeRoom';
import { useLabLoading } from '../components/useLabLoading';
import {
    campaignCompareChartConfig,
    cumulativeChartConfig,
    leadsChartConfig,
    pipelineChartConfig,
    sankeyChartConfig,
    spendLeadsChartConfig,
} from '../data/chart-config';
import {
    formatCompactAxis,
    formatCount,
    formatDa,
    formatDayLabel,
    formatExactRoas,
    formatPercent,
    formatRoas,
} from '../data/format';
import { REPORT_CHILDREN } from '../lib/nav';
import {
    getAdsTotals,
    getCampaignTotals,
    getConversionRate,
    getCumulativeWonRevenue,
    getDailyAdPerformance,
    getLeadSourceChartRows,
    getOpenDealCount,
    getPipelineByStage,
    getSankeyDealFlow,
    getTotalOpenPipeline,
    getWonRevenue,
} from '../data/selectors';

const CHART_MARGIN = { top: 6, right: 8, left: 0, bottom: 0 };

const SHELL_VIEWS = new Set(['desk', 'activity', 'dashboards', 'builder', 'scheduled', 'outbound']);

type Props = {
    view?: string;
};

export function ReportsPage({ view = 'overview' }: Props) {
    if (SHELL_VIEWS.has(view)) {
        const label = REPORT_CHILDREN.find((child) => child.id === view)?.label ?? 'Rapport';

        return (
            <PrototypeRoom
                title={label}
                descriptor="Performance commerciale · septembre 2026"
                rows={[
                    { label: 'Période', value: '1–30 sept. 2026' },
                    { label: 'Source', value: 'Jeu Design Lab validé' },
                    { label: 'État', value: 'Vue prototype' },
                ]}
            />
        );
    }

    const loading = useLabLoading();
    const ads = getAdsTotals();
    const pipeline = getPipelineByStage();
    const sources = getLeadSourceChartRows();
    const campaigns = getCampaignTotals().map((row) => ({
        label: row.name,
        spend: row.spend,
        pipeline: row.attributedRevenue,
    }));
    const daily = getDailyAdPerformance().map((row) => ({
        ...row,
        label: formatDayLabel(row.date),
    }));
    const cumulative = getCumulativeWonRevenue().map((row) => ({
        ...row,
        label: formatDayLabel(row.date),
    }));
    const flow = getSankeyDealFlow();
    const held = pipeline.reduce((max, row) => (row.pipeline > max.pipeline ? row : max), pipeline[0]);

    return (
        <div className="space-y-7">
            <PageHeader
                title="Rapports"
                descriptor="Performance commerciale · septembre 2026"
                context={
                    <>
                        {REPORT_CHILDREN.slice(0, 6).map((child) => (
                            <LabLink key={child.id} to={child.to}>
                                <ContextChip active={view === child.id}>{child.label}</ContextChip>
                            </LabLink>
                        ))}
                    </>
                }
            />

            {(view === 'overview' || view === 'pipeline') && (
                <KpiStrip>
                    <KpiMetric label="CA gagné" value={formatDa(getWonRevenue())} hint="3 affaires gagnées" />
                    <KpiMetric
                        label="Pipeline ouvert"
                        value={formatDa(getTotalOpenPipeline())}
                        hint={`${getOpenDealCount()} affaires`}
                    />
                    <KpiMetric label="Conversion" value={formatPercent(getConversionRate())} hint="3 gagnées · 17 closes" />
                    <KpiMetric
                        label="Valeur / dépenses"
                        value={formatRoas(ads.displayedRoas)}
                        hint={`exact ${formatExactRoas(ads.exactRoas)}`}
                    />
                </KpiStrip>
            )}

            {(view === 'overview' || view === 'pipeline') && (
                <Module
                    question="Comment évolue le CA ?"
                    title="CA cumulé · septembre"
                    hint={`Palier jusqu’à ${formatDa(getWonRevenue())}`}
                    flush
                >
                    <ChartFrame loading={loading} height={320}>
                        <EvilLineChart
                            data={cumulative}
                            config={cumulativeChartConfig}
                            className="h-full w-full"
                            animationType="none"
                            chartProps={{ margin: CHART_MARGIN }}
                        >
                            <EvilLineChart.Grid stroke="var(--evo-hairline)" vertical={false} />
                            <EvilLineChart.XAxis dataKey="label" />
                            <EvilLineChart.YAxis tickFormatter={(value: number) => formatCompactAxis(value)} />
                            <EvilLineChart.Tooltip />
                            <EvilLineChart.Line dataKey="cumulative" curveType="stepAfter" />
                        </EvilLineChart>
                    </ChartFrame>
                </Module>
            )}

            {(view === 'overview' || view === 'pipeline') && (
                <div className="grid gap-6 xl:grid-cols-2">
                    <Module
                        question="Quelle étape retient le plus de valeur ?"
                        title="Pipeline par étape"
                        hint={held ? `${held.label} · ${formatDa(held.pipeline)}` : undefined}
                        flush
                    >
                        <ChartFrame loading={loading} height={280}>
                            <EvilBarChart
                                data={pipeline}
                                config={pipelineChartConfig}
                                className="h-full w-full"
                                animationType="none"
                                chartProps={{ margin: CHART_MARGIN }}
                            >
                                <EvilBarChart.Grid stroke="var(--evo-hairline)" vertical={false} />
                                <EvilBarChart.XAxis dataKey="label" />
                                <EvilBarChart.YAxis tickFormatter={(value: number) => formatCompactAxis(value)} />
                                <EvilBarChart.Tooltip />
                                <EvilBarChart.Bar dataKey="pipeline" enableHoverHighlight />
                            </EvilBarChart>
                        </ChartFrame>
                    </Module>

                    <Module
                        question="D’où vient la valeur créée ?"
                        title="Flux ouvert / gagné / perdu"
                        hint="Les 3 gagnées sont organiques"
                        flush
                    >
                        <ChartFrame loading={loading} height={280}>
                            <EvilSankeyChart data={flow} config={sankeyChartConfig} className="h-full w-full">
                                <EvilSankeyChart.Node>
                                    <EvilSankeyChart.NodeLabel
                                        position="outside"
                                        showValues
                                        valueFormatter={formatCompactAxis}
                                    />
                                </EvilSankeyChart.Node>
                                <EvilSankeyChart.Link />
                                <EvilSankeyChart.Tooltip />
                            </EvilSankeyChart>
                        </ChartFrame>
                    </Module>
                </div>
            )}

            {(view === 'overview' || view === 'leads') && (
                <Module question="Quels canaux génèrent les leads ?" title="Sources de leads" hint="128 leads" flush>
                    <ChartFrame loading={loading} height={280}>
                        <EvilBarChart
                            data={sources}
                            config={leadsChartConfig}
                            className="h-full w-full"
                            layout="horizontal"
                            animationType="none"
                            chartProps={{ margin: { top: 4, right: 12, left: 0, bottom: 0 } }}
                        >
                            <EvilBarChart.Grid stroke="var(--evo-hairline)" vertical={false} />
                            <EvilBarChart.XAxis tickFormatter={(value: number) => formatCount(value)} />
                            <EvilBarChart.YAxis dataKey="source" width={132} />
                            <EvilBarChart.Tooltip />
                            <EvilBarChart.Bar dataKey="leads" enableHoverHighlight />
                        </EvilBarChart>
                    </ChartFrame>
                </Module>
            )}

            {(view === 'overview' || view === 'ads') && (
                <div className="grid gap-6 xl:grid-cols-2">
                    <Module
                        question="Quelles campagnes créent du pipeline ?"
                        title="Pipeline attribué vs dépensé"
                        flush
                    >
                        <ChartFrame loading={loading} height={280}>
                            <EvilBarChart
                                data={campaigns}
                                config={campaignCompareChartConfig}
                                className="h-full w-full"
                                animationType="none"
                                chartProps={{ margin: CHART_MARGIN }}
                            >
                                <EvilBarChart.Grid stroke="var(--evo-hairline)" vertical={false} />
                                <EvilBarChart.XAxis dataKey="label" />
                                <EvilBarChart.YAxis tickFormatter={(value: number) => formatCompactAxis(value)} />
                                <EvilBarChart.Tooltip />
                                <EvilBarChart.Legend verticalAlign="bottom" />
                                <EvilBarChart.Bar dataKey="spend" enableHoverHighlight />
                                <EvilBarChart.Bar dataKey="pipeline" enableHoverHighlight />
                            </EvilBarChart>
                        </ChartFrame>
                    </Module>
                    <Module title="Dépenses & leads" hint="Même série que Pubs" flush>
                        <ChartFrame loading={loading} height={280}>
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
                                <EvilComposedChart.Bar dataKey="spend" barProps={{ yAxisId: 'left' }} />
                                <EvilComposedChart.Line dataKey="leads" lineProps={{ yAxisId: 'right' }} />
                            </EvilComposedChart>
                        </ChartFrame>
                    </Module>
                </div>
            )}
        </div>
    );
}
