import { useEffect, useMemo, useState } from 'react';

import {
    BarChart,
    ChartFrame,
    ComposedChart,
    FunnelChart,
    HorizontalBarChart,
    LineChart,
    SankeyChart,
} from '@/evo/charts';
import { Moon, Sun } from '@/evo/icons';
import { outboundMessages } from '@/evo/outbound/messages';
import { OutboundReports } from '@/evo/outbound/Reports';
import { CrossObjectReportPanel, ReportBuilderForm, reportsMessages } from '@/evo/reports';
import { hydrateI18n } from '@/lib/i18n';
import { KpiMetric, KpiStrip } from '../components/KpiMetric';
import { LabLink } from '../components/LabLink';
import { Module } from '../components/Module';
import { ContextChip, PageHeader } from '../components/PageHeader';
import { PrototypeRoom } from '../components/PrototypeRoom';
import { useLabLoading } from '../components/useLabLoading';
import {
    formatCompactAxis,
    formatCount,
    formatDa,
    formatDayLabel,
    formatExactRoas,
    formatPercent,
    formatRoas,
} from '../data/format';
import { getOutboundLabFixtures } from '../data/outbound';
import {
    getAdsFunnel,
    getAdsTotals,
    getCampaignTotals,
    getConversionRate,
    getCumulativeWonRevenue,
    getDailyAdPerformance,
    getKnownObjects,
    getLeadSourceChartRows,
    getOpenDealCount,
    getPipelineByStage,
    getSankeyDealFlow,
    getTotalOpenPipeline,
    getWonRevenue,
} from '../data/selectors';
import { REPORT_CHILDREN } from '../lib/nav';

hydrateI18n('fr', { ...outboundMessages, ...reportsMessages });

function applyTheme(theme: 'light' | 'dark') {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
}

function readThemeParam(): 'light' | 'dark' {
    if (typeof window === 'undefined') {
        return 'light';
    }

    return new URLSearchParams(window.location.search).get('theme') === 'dark' ? 'dark' : 'light';
}

const SHELL_VIEWS = new Set(['desk', 'activity', 'dashboards', 'scheduled']);

type Props = {
    view?: string;
};

export function ReportsPage({ view = 'overview' }: Props) {
    const [theme, setTheme] = useState<'light' | 'dark'>(readThemeParam);
    const loading = useLabLoading();
    const known = getKnownObjects();
    const outbound = useMemo(() => getOutboundLabFixtures().reports, []);

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    const themeToggle = (
        <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-[var(--evo-hairline)] bg-[var(--evo-surface)] px-3 text-[12px] font-medium"
            onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
        >
            {theme === 'dark' ? <Sun className="size-3.5" weight="regular" /> : <Moon className="size-3.5" weight="regular" />}
            {theme === 'dark' ? 'Clair' : 'Sombre'}
        </button>
    );

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
        label: formatDayLabel(row.date),
        cumulative: row.cumulative,
    }));
    const flow = getSankeyDealFlow();
    const funnel = getAdsFunnel();
    const held = pipeline.reduce((max, row) => (row.pipeline > max.pipeline ? row : max), pipeline[0]);

    const crossObject = useMemo(
        () => ({
            metric: 'reply_rate',
            groups: [
                { label: 'Alger', value: 28, count: 86 },
                { label: 'Oran', value: 22, count: 41 },
                { label: 'Constantine', value: 19, count: 24 },
                { label: 'Blida', value: 16, count: 18 },
            ],
        }),
        [],
    );

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

    if (view === 'builder') {
        return (
            <div className="space-y-7">
                <PageHeader
                    title="Générateur de rapports"
                    descriptor="Rapports ad hoc · Clinique El Djazair"
                    actions={themeToggle}
                />
                <ReportBuilderForm
                    preview
                    reports={[
                        {
                            id: 1,
                            name: 'Pipeline El Djazair',
                            entity: 'deal',
                            metric: 'sum_amount',
                            group_by: 'stage',
                        },
                    ]}
                    result={{ metric: 'sum_amount', value: 1280000, groups: [{ label: 'Gagné', value: 1280000 }] }}
                    activeReport={{
                        id: 1,
                        name: 'Pipeline El Djazair',
                        entity: 'deal',
                        metric: 'sum_amount',
                        group_by: 'stage',
                    }}
                />
            </div>
        );
    }

    if (view === 'cross-object') {
        return (
            <div className="space-y-7">
                <PageHeader
                    title="Rapport cross-objet"
                    descriptor="Taux de réponse par wilaya · Hôpital Ibn Sina / Cabinet Dr. Amrani"
                    actions={themeToggle}
                />
                <CrossObjectReportPanel report={crossObject} />
            </div>
        );
    }

    if (view === 'outbound') {
        return (
            <div className="space-y-7">
                <PageHeader
                    title="Rapports outbound"
                    descriptor="Pharmacie Centrale · septembre 2026"
                    context={
                        <ContextChip active>
                            {known.pharmacieCentrale?.company.name ?? 'Pharmacie Centrale'}
                        </ContextChip>
                    }
                    actions={themeToggle}
                />
                <OutboundReports {...outbound} />
            </div>
        );
    }

    if (view === 'funnels') {
        return (
            <div className="space-y-7">
                <PageHeader
                    title="Entonnoir de conversion"
                    descriptor="Pharmacie Centrale · septembre 2026"
                    context={
                        <ContextChip active>
                            {known.pharmacieCentrale?.company.name ?? 'Pharmacie Centrale'}
                        </ContextChip>
                    }
                    actions={themeToggle}
                />
                <KpiStrip>
                    <KpiMetric label="Visites" value={formatCount(funnel[0]?.value ?? 0)} />
                    <KpiMetric label="Leads" value={formatCount(funnel[1]?.value ?? 0)} />
                    <KpiMetric label="Commandes" value={formatCount(funnel[funnel.length - 1]?.value ?? 0)} />
                </KpiStrip>
                <Module title="Étapes" flush>
                    <div className="p-4">
                        <FunnelChart
                            steps={funnel.map((step) => ({
                                id: step.step,
                                label: step.step,
                                value: step.value,
                            }))}
                        />
                    </div>
                </Module>
            </div>
        );
    }

    return (
        <div className="space-y-7">
            <PageHeader
                title="Rapports"
                descriptor="Performance commerciale · septembre 2026"
                context={
                    <>
                        {REPORT_CHILDREN.slice(0, 8).map((child) => (
                            <LabLink key={child.id} to={child.to}>
                                <ContextChip active={view === child.id}>{child.label}</ContextChip>
                            </LabLink>
                        ))}
                    </>
                }
                actions={themeToggle}
            />

            {(view === 'overview' || view === 'pipeline') && (
                <KpiStrip>
                    <KpiMetric label="CA gagné" value={formatDa(getWonRevenue())} hint="3 affaires gagnées" />
                    <KpiMetric
                        label="Pipeline ouvert"
                        value={formatDa(getTotalOpenPipeline())}
                        hint={`${getOpenDealCount()} affaires`}
                    />
                    <KpiMetric
                        label="Conversion"
                        value={formatPercent(getConversionRate())}
                        hint="3 gagnées · 17 closes"
                    />
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
                    <ChartFrame loading={loading} height={320} label="CA cumulé">
                        <LineChart
                            data={cumulative}
                            series={[{ dataKey: 'cumulative', name: 'CA cumulé' }]}
                            height={320}
                            showLegend={false}
                            yTickFormatter={formatCompactAxis}
                        />
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
                        <ChartFrame loading={loading} height={280} label="Pipeline par étape">
                            <BarChart
                                data={pipeline}
                                series={[{ dataKey: 'pipeline', name: 'Pipeline' }]}
                                height={280}
                                yTickFormatter={formatCompactAxis}
                            />
                        </ChartFrame>
                    </Module>

                    <Module
                        question="D’où vient la valeur créée ?"
                        title="Flux ouvert / gagné / perdu"
                        hint="Les 3 gagnées sont organiques"
                        flush
                    >
                        <ChartFrame loading={loading} height={280} label="Flux d’affaires">
                            <SankeyChart data={flow} height={280} formatValue={formatCompactAxis} />
                        </ChartFrame>
                    </Module>
                </div>
            )}

            {(view === 'overview' || view === 'leads') && (
                <Module question="Quels canaux génèrent les leads ?" title="Sources de leads" hint="128 leads" flush>
                    <ChartFrame loading={loading} height={280} label="Sources de leads">
                        <HorizontalBarChart
                            data={sources.map((row) => ({ label: row.source, leads: row.leads }))}
                            series={[{ dataKey: 'leads', name: 'Leads' }]}
                            height={280}
                            yTickFormatter={formatCount}
                        />
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
                        <ChartFrame loading={loading} height={280} label="Pipeline vs dépensé">
                            <BarChart
                                data={campaigns}
                                series={[
                                    { dataKey: 'spend', name: 'Dépensé' },
                                    { dataKey: 'pipeline', name: 'Pipeline' },
                                ]}
                                height={280}
                                showLegend
                                yTickFormatter={formatCompactAxis}
                            />
                        </ChartFrame>
                    </Module>
                    <Module title="Dépenses & leads" hint="Même série que Pubs" flush>
                        <ChartFrame loading={loading} height={280} label="Dépenses et leads">
                            <ComposedChart
                                data={daily}
                                height={280}
                                yTickFormatter={formatCompactAxis}
                                series={[
                                    { type: 'bar', dataKey: 'spend', name: 'Dépensé', yAxisId: 'left' },
                                    { type: 'line', dataKey: 'leads', name: 'Leads', yAxisId: 'right' },
                                ]}
                            />
                        </ChartFrame>
                    </Module>
                </div>
            )}
        </div>
    );
}
