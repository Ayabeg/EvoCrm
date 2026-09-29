import { EvilBarChart } from '@/components/evilcharts/charts/recharts-bar-chart';
import { EvilLineChart } from '@/components/evilcharts/charts/recharts-line-chart';
import { ChartFrame } from '../components/ChartFrame';
import { KpiCard } from '../components/KpiCard';
import { LabLink } from '../components/LabLink';
import { useLabLoading } from '../components/useLabLoading';
import { cumulativeChartConfig, leadsChartConfig, pipelineChartConfig } from '../data/chart-config';
import { KNOWN_OBJECT_IDS } from '../data/evocrm-demo-data';
import { contactName, formatCount, formatDa, formatDayLabel, formatPercent } from '../data/format';
import {
    STAGE_LABELS,
    getClosedDeals,
    getCompany,
    getContact,
    getConversionRate,
    getCumulativeWonRevenue,
    getLeadSourceChartRows,
    getLeadSourceTotals,
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

export function AccueilPage() {
    const loading = useLabLoading();
    const quotes = getQuoteTotals();
    const wonCount = getWonDeals().length;
    const closedCount = getClosedDeals().length;
    const leadCount = getLeadSourceTotals().reduce((sum, row) => sum + row.count, 0);
    const pipeline = getPipelineByStage();
    const cumulative = getCumulativeWonRevenue().map((row) => ({
        date: row.date,
        cumulative: row.cumulative,
        label: formatDayLabel(row.date),
    }));
    const sources = getLeadSourceChartRows();
    const deals = getOpenDeals()
        .slice()
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

    return (
        <div className="space-y-5">
            <section className="grid grid-cols-2 border border-[var(--evo-border)] bg-[var(--evo-surface)] lg:grid-cols-4">
                <KpiCard
                    label="CA gagné"
                    value={formatDa(getWonRevenue())}
                    hint={`${wonCount} deals gagnés`}
                />
                <KpiCard
                    label="Pipeline ouvert"
                    value={formatDa(getTotalOpenPipeline())}
                    hint={`${getOpenDealCount()} deals`}
                />
                <KpiCard
                    label="Conversion"
                    value={formatPercent(getConversionRate())}
                    hint={`${wonCount} gagnés / ${closedCount} clos`}
                />
                <KpiCard
                    label="Devis en attente"
                    value={formatCount(quotes.pending)}
                    hint={formatDa(quotes.pendingValue)}
                />
            </section>

            <div className="grid gap-4 xl:grid-cols-2">
                <ChartFrame title="Pipeline par étape" loading={loading} hint="Deals ouverts">
                    <EvilBarChart
                        data={pipeline}
                        config={pipelineChartConfig}
                        className="h-full w-full"
                        animationType="none"
                    >
                        <EvilBarChart.Grid />
                        <EvilBarChart.XAxis dataKey="label" />
                        <EvilBarChart.YAxis
                            tickFormatter={(value: number) => formatCount(value)}
                        />
                        <EvilBarChart.Tooltip />
                        <EvilBarChart.Bar dataKey="pipeline" enableHoverHighlight />
                    </EvilBarChart>
                </ChartFrame>
                <ChartFrame title="CA cumulé septembre" loading={loading} hint="Événements gagnés">
                    <EvilLineChart
                        data={cumulative}
                        config={cumulativeChartConfig}
                        className="h-full w-full"
                        animationType="none"
                    >
                        <EvilLineChart.Grid />
                        <EvilLineChart.XAxis dataKey="label" />
                        <EvilLineChart.YAxis
                            tickFormatter={(value: number) => formatCount(value)}
                        />
                        <EvilLineChart.Tooltip />
                        <EvilLineChart.Line dataKey="cumulative" />
                    </EvilLineChart>
                </ChartFrame>
            </div>

            <ChartFrame title="Sources de leads" loading={loading} hint={`${leadCount} leads`}>
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

            <section className="border border-[var(--evo-border)] bg-[var(--evo-surface)]">
                <header className="border-b border-[var(--evo-border-subtle)] px-4 py-3">
                    <h2 className="text-[15px] font-semibold">Pipeline à suivre</h2>
                </header>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-[13px]">
                        <thead className="text-[11px] tracking-wide text-[var(--evo-ink-muted)]">
                            <tr className="border-b border-[var(--evo-border-subtle)]">
                                <th className="px-4 py-2 font-medium">Deal</th>
                                <th className="px-4 py-2 font-medium">Société</th>
                                <th className="px-4 py-2 font-medium">Contact</th>
                                <th className="px-4 py-2 font-medium">Étape</th>
                                <th className="px-4 py-2 font-medium">Owner</th>
                                <th className="px-4 py-2 text-right font-medium">Valeur</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deals.map((deal) => {
                                const contact = getContact(deal.contactId);
                                const company = getCompany(deal.companyId);

                                return (
                                    <tr
                                        key={deal.id}
                                        className="border-b border-[var(--evo-border-subtle)] last:border-0 hover:bg-[var(--evo-hover)]"
                                    >
                                        <td className="px-4 py-2.5">
                                            <LabLink
                                                to={{ name: 'deal', id: deal.id }}
                                                className="font-medium text-[var(--evo-teal)] hover:underline"
                                            >
                                                {deal.name}
                                            </LabLink>
                                        </td>
                                        <td className="px-4 py-2.5">{company.name}</td>
                                        <td className="px-4 py-2.5">
                                            <LabLink
                                                to={{ name: 'contact', id: contact.id }}
                                                className="hover:underline"
                                            >
                                                {contactName(contact)}
                                            </LabLink>
                                        </td>
                                        <td className="px-4 py-2.5">{STAGE_LABELS[deal.stage]}</td>
                                        <td className="px-4 py-2.5">{getOwner(deal.ownerId).initials}</td>
                                        <td className="px-4 py-2.5 text-right tabular-nums">
                                            {formatDa(deal.value)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="border border-[var(--evo-border)] bg-[var(--evo-surface)] px-4 py-3">
                <h2 className="text-[15px] font-semibold">Travail du jour</h2>
                <ul className="mt-2 space-y-2">
                    {getOpenActivities().map((activity) => (
                        <li key={activity.id} className="text-[13px] text-[var(--evo-ink-secondary)]">
                            {activity.title}
                        </li>
                    ))}
                </ul>
                <p className="mt-3 text-[12px] text-[var(--evo-ink-muted)]">
                    Objet ancré:{' '}
                    <LabLink
                        to={{ name: 'deal', id: KNOWN_OBJECT_IDS.dealModernisationCrm }}
                        className="text-[var(--evo-teal)] hover:underline"
                    >
                        Modernisation CRM
                    </LabLink>
                    {' · '}
                    <LabLink
                        to={{ name: 'devis', id: KNOWN_OBJECT_IDS.quoteDv20260047 }}
                        className="text-[var(--evo-teal)] hover:underline"
                    >
                        DV-2026-0047
                    </LabLink>
                </p>
            </section>
        </div>
    );
}
