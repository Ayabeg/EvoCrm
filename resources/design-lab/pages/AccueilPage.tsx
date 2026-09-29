import { EvilBarChart } from '@/components/evilcharts/charts/recharts-bar-chart';
import { EvilLineChart } from '@/components/evilcharts/charts/recharts-line-chart';
import { useState } from 'react';
import { Button } from '../components/Button';
import { ChartFrame } from '../components/ChartFrame';
import { LabLink } from '../components/LabLink';
import { KpiMetric, KpiStrip } from '../components/KpiMetric';
import { Module } from '../components/Module';
import { ContextChip, PageHeader } from '../components/PageHeader';
import { ProgressRow } from '../components/ProgressRow';
import { useLabLoading } from '../components/useLabLoading';
import { cumulativeChartConfig, leadsChartConfig, pipelineChartConfig } from '../data/chart-config';
import {
    contactName,
    formatCompactAxis,
    formatCount,
    formatDa,
    formatDayLabel,
    formatPercent,
    formatRoas,
} from '../data/format';
import {
    STAGE_LABELS,
    getClosedDeals,
    getCompany,
    getContact,
    getConversionRate,
    getCumulativeWonRevenue,
    getGoalProgress,
    getLeadSourceChartRows,
    getOpenActivities,
    getOpenDealCount,
    getOpenDeals,
    getOwner,
    getPipelineByStage,
    getQuoteTotals,
    getTotalOpenPipeline,
    getWonDeals,
    getWonRevenue,
} from '../data/selectors';

const CHART_MARGIN = { top: 6, right: 8, left: 0, bottom: 0 };

export function AccueilPage() {
    const loading = useLabLoading();
    const [done, setDone] = useState<Record<string, boolean>>({});
    const quotes = getQuoteTotals();
    const won = getWonDeals();
    const closed = getClosedDeals();
    const pipeline = getPipelineByStage().map((row) => ({
        ...row,
        axis: `${row.label} · ${row.count}`,
    }));
    const cumulative = getCumulativeWonRevenue().map((row) => ({
        ...row,
        label: formatDayLabel(row.date),
    }));
    const sources = getLeadSourceChartRows();
    const goals = getGoalProgress();
    const deals = getOpenDeals()
        .slice()
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);
    const activities = getOpenActivities();

    return (
        <div className="space-y-7">
            <PageHeader
                title="Accueil"
                descriptor="Vue d’ensemble · septembre 2026"
                context={
                    <>
                        <ContextChip active>1–30 sept. 2026</ContextChip>
                        <ContextChip>Équipe commerciale</ContextChip>
                    </>
                }
                actions={
                    <Button variant="primary" disabled title="Prototype — création non branchée">
                        + Affaire
                    </Button>
                }
            />

            <KpiStrip>
                <KpiMetric
                    label="CA gagné"
                    value={formatDa(getWonRevenue())}
                    hint={`${won.length} affaires gagnées`}
                />
                <KpiMetric
                    label="Pipeline ouvert"
                    value={formatDa(getTotalOpenPipeline())}
                    hint={`${getOpenDealCount()} affaires`}
                />
                <KpiMetric
                    label="Conversion"
                    value={formatPercent(getConversionRate())}
                    hint={`${won.length} gagnées · ${closed.length} closes`}
                />
                <KpiMetric
                    label="Devis en attente"
                    value={formatCount(quotes.pending)}
                    hint={formatDa(quotes.pendingValue)}
                />
            </KpiStrip>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                <Module
                    title="Pipeline ouvert"
                    hint={`${getOpenDealCount()} affaires · ${formatDa(getTotalOpenPipeline())}`}
                    flush
                >
                    <ChartFrame loading={loading}>
                        <EvilBarChart
                            data={pipeline}
                            config={pipelineChartConfig}
                            className="h-full w-full"
                            animationType="none"
                            chartProps={{ margin: CHART_MARGIN }}
                        >
                            <EvilBarChart.Grid stroke="var(--evo-hairline)" vertical={false} />
                            <EvilBarChart.XAxis dataKey="axis" />
                            <EvilBarChart.YAxis tickFormatter={(value: number) => formatCompactAxis(value)} />
                            <EvilBarChart.Tooltip />
                            <EvilBarChart.Bar dataKey="pipeline" enableHoverHighlight />
                        </EvilBarChart>
                    </ChartFrame>
                </Module>

                <Module title="CA gagné · septembre" hint={`Fin de période ${formatDa(getWonRevenue())}`} flush>
                    <ChartFrame loading={loading}>
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
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                <Module title="Sources de leads" hint="128 leads au total" flush>
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

                <Module title="Objectifs" hint="Septembre 2026" padded>
                    <div className="space-y-4 py-1">
                        {goals.map((goal) => (
                            <ProgressRow
                                key={goal.id}
                                label={
                                    goal.metric === 'won_revenue'
                                        ? 'CA'
                                        : goal.metric === 'open_pipeline'
                                            ? 'Pipeline'
                                            : goal.metric === 'ads_roas'
                                                ? 'Valeur / dépenses'
                                                : 'Devis envoyés'
                                }
                                current={
                                    goal.metric === 'ads_roas'
                                        ? formatRoas(goal.current)
                                        : goal.metric === 'quotes_sent'
                                            ? formatCount(goal.current)
                                            : formatDa(goal.current)
                                }
                                target={
                                    goal.metric === 'ads_roas'
                                        ? formatRoas(goal.target)
                                        : goal.metric === 'quotes_sent'
                                            ? formatCount(goal.target)
                                            : formatDa(goal.target)
                                }
                                ratio={goal.ratio}
                            />
                        ))}
                    </div>
                </Module>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                <Module title="Affaires à suivre" hint="Les plus importantes encore ouvertes">
                    <table className="w-full text-left text-[13px]">
                        <thead className="text-[11px] text-[var(--evo-ink-muted)]">
                            <tr className="border-b border-[var(--evo-hairline)]">
                                <th className="px-4 py-2 font-medium">Affaire</th>
                                <th className="px-4 py-2 font-medium">Société</th>
                                <th className="px-4 py-2 font-medium">Étape</th>
                                <th className="px-4 py-2 text-right font-medium">Valeur</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deals.map((deal) => (
                                <tr
                                    key={deal.id}
                                    className="border-b border-[var(--evo-hairline)] last:border-0 hover:bg-[var(--evo-hover)]"
                                >
                                    <td className="px-4 py-2.5">
                                        <LabLink
                                            to={{ name: 'deal', id: deal.id }}
                                            className="font-medium text-[var(--evo-teal)] hover:underline"
                                        >
                                            {deal.name}
                                        </LabLink>
                                        <p className="text-[12px] text-[var(--evo-ink-muted)]">
                                            {contactName(getContact(deal.contactId))} · {getOwner(deal.ownerId).initials}
                                        </p>
                                    </td>
                                    <td className="px-4 py-2.5">{getCompany(deal.companyId).name}</td>
                                    <td className="px-4 py-2.5">{STAGE_LABELS[deal.stage]}</td>
                                    <td className="px-4 py-2.5 text-right tabular-nums">{formatDa(deal.value)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Module>

                <Module title="À faire aujourd’hui" hint={`${activities.length} ouvertes`}>
                    <ul>
                        {activities.map((activity) => {
                            const checked = Boolean(done[activity.id]);
                            const deal = deals.find((row) => row.id === activity.dealId) ?? null;

                            return (
                                <li
                                    key={activity.id}
                                    className="flex items-start gap-3 border-b border-[var(--evo-hairline)] px-4 py-3 last:border-0"
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => {
                                            setDone((current) => ({
                                                ...current,
                                                [activity.id]: !current[activity.id],
                                            }));
                                        }}
                                        className="mt-0.5 size-3.5 accent-[var(--evo-teal)]"
                                        aria-label={activity.title}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p
                                            className={
                                                checked
                                                    ? 'text-[13px] text-[var(--evo-ink-muted)] line-through'
                                                    : 'text-[13px] font-medium'
                                            }
                                        >
                                            {activity.title}
                                        </p>
                                        <p className="mt-0.5 text-[12px] text-[var(--evo-ink-muted)]">
                                            {activity.dealId ? (
                                                <LabLink
                                                    to={{ name: 'deal', id: activity.dealId }}
                                                    className="hover:underline"
                                                >
                                                    {deal?.name ?? 'Affaire liée'}
                                                </LabLink>
                                            ) : (
                                                'Sans affaire'
                                            )}
                                            {' · '}
                                            {new Intl.DateTimeFormat('fr-DZ', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            }).format(new Date(activity.dueAt))}
                                        </p>
                                    </div>
                                    <span className="text-[11px] text-[var(--evo-ink-faint)]">
                                        {getOwner(activity.ownerId).initials}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </Module>
            </div>
        </div>
    );
}
