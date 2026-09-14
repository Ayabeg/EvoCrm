import { Head, Link } from '@inertiajs/react';
import type { KpiTile } from '@/components/crm/crm-kpi-strip';
import LeadOsGraphStatus from '@/components/crm/lead-os-graph-status';
import type { LeadOsGraphPayload } from '@/components/crm/lead-os-graph-status';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import type { ActivityFeedItem } from '@/components/dashboard/activity-feed';
import { AttentionList } from '@/components/dashboard/attention-list';
import type { AttentionItem } from '@/components/dashboard/attention-list';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardSection } from '@/components/dashboard/dashboard-section';
import { CaughtUpStrip, GuidedActions } from '@/components/dashboard/guided-actions';
import type { GuidedAction } from '@/components/dashboard/guided-actions';
import { HomeKpiStrip } from '@/components/dashboard/home-kpi-strip';
import { HomeWidget, HomeWidgetEmpty } from '@/components/dashboard/home-widget';
import type { EvoVizPayload } from '@/evoviz/contract';
import { EvoVizChart } from '@/evoviz/evo-viz-chart';
import { t } from '@/lib/i18n';
import { formatCompactDzd, formatDzd } from '@/lib/money';

type Owner = { id: number; name: string };

type Filters = {
    owner_id?: number | null;
    from?: string;
    to?: string;
};

type PipelineHealth = {
    total_cents: number;
    deal_count: number;
    stages: { name: string; count: number; amount_cents: number }[];
    chart: EvoVizPayload | null;
};

type SalesRow = {
    owner: string;
    won: number;
    revenue_cents: number;
};

type QuotaOwner = {
    user_id: number | null;
    name: string;
    target_cents: number | null;
    won_cents: number;
    won_count: number;
    remaining_cents: number | null;
    attainment_pct: number | null;
    expected_cents: number | null;
    status: 'hit' | 'on_track' | 'behind' | 'no_target' | string;
};

type Quota = {
    month: string;
    label: string;
    timezone: string;
    day: number;
    days: number;
    elapsed_pct: number;
    target_cents: number | null;
    won_cents: number;
    won_count: number;
    remaining_cents: number | null;
    attainment_pct: number | null;
    expected_cents: number | null;
    status: string;
    can_manage: boolean;
    settings_href: string;
    owners: QuotaOwner[];
};

type PlacesRun = {
    id: number;
    target_type: string;
    target_id: number;
    field: string;
    value: string | null;
    status: string;
    error: string | null;
    confidence: number | null;
    created_at: string | null;
    href: string | null;
};

type ResearchBrief = {
    id: number;
    subject_type: string;
    subject_id: number;
    answer?: string | null;
    source: string;
    created_at?: string | null;
    href: string | null;
};

type Props = {
    window: { from: string; to: string; days: number; timezone: string };
    kpis: KpiTile[];
    primaryChart: EvoVizPayload | null;
    pipelineHealth: PipelineHealth | null;
    attention: AttentionItem[];
    guidedActions?: GuidedAction[];
    caughtUp?: boolean;
    activityFeed: ActivityFeedItem[];
    salesPerformance: SalesRow[] | null;
    quota?: Quota | null;
    quickActions: { label: string; href: string }[];
    owners?: Owner[];
    filters?: Filters;
    dataAsOf?: string;
    leadOsGraph?: LeadOsGraphPayload | null;
    placesRun?: PlacesRun | null;
    researchBrief?: ResearchBrief | null;
};

function PipelineBars({ pipeline }: { pipeline: PipelineHealth }) {
    const max = Math.max(...pipeline.stages.map((stage) => stage.count), 1);

    if (pipeline.stages.length === 0) {
        return (
            <HomeWidgetEmpty
                title={t('No open deals')}
                body={t('Stages chart here once a deal is in the pipeline.')}
                action={
                    <Link
                        href="/crm/deals?create=1"
                        className="text-[12px] font-medium text-brand hover:underline"
                    >
                        {t('Create deal')}
                    </Link>
                }
            />
        );
    }

    return (
        <ul className="space-y-2">
            {pipeline.stages.map((stage) => {
                const width = Math.max((stage.count / max) * 100, stage.count > 0 ? 6 : 0);

                return (
                    <li key={stage.name} className="min-w-0">
                        <div className="flex items-baseline justify-between gap-3">
                            <span className="truncate text-[12px] text-ink">{stage.name}</span>
                            <span className="money shrink-0 text-[11px] text-mute">
                                {stage.count} · {formatCompactDzd(stage.amount_cents)}
                            </span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden bg-canvas-soft" aria-hidden>
                            <div
                                className="h-full bg-brand"
                                style={{ width: `${width}%` }}
                            />
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}

function quotaStatusLabel(status: string): string {
    if (status === 'hit') {
        return t('Hit');
    }

    if (status === 'on_track') {
        return t('On track');
    }

    if (status === 'behind') {
        return t('Behind pace');
    }

    return t('No target');
}

function MonthlyQuota({ quota }: { quota: Quota }) {
    const hasTarget = quota.target_cents !== null;
    const barPct = Math.min(100, quota.attainment_pct ?? 0);
    const showTable = quota.owners.length > 0;

    if (!hasTarget && !showTable && !quota.can_manage) {
        return (
            <HomeWidgetEmpty
                title={t('No quota this month')}
                body={t('Set a DZD target to track closed-won against pace.')}
            />
        );
    }

    return (
        <div data-testid="monthly-quota">
            {hasTarget ? (
                <div className="mb-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-[13px] text-ink">
                            <span className="money font-semibold">
                                {formatDzd(quota.won_cents)}
                            </span>
                            <span className="text-mute">
                                {' '}
                                {t('of :amount · :pct%', {
                                    amount: formatDzd(quota.target_cents),
                                    pct: quota.attainment_pct ?? 0,
                                })}
                            </span>
                        </p>
                        <p className="text-[12px] text-mute">
                            {quotaStatusLabel(quota.status)}
                            {quota.remaining_cents !== null && quota.status !== 'hit'
                                ? ` · ${formatCompactDzd(quota.remaining_cents)} ${t('remaining')}`
                                : ''}
                        </p>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden bg-canvas-soft" aria-hidden>
                        <div
                            className="h-full bg-brand"
                            style={{
                                width: `${Math.max(barPct, quota.won_cents > 0 ? 2 : 0)}%`,
                            }}
                        />
                    </div>
                </div>
            ) : quota.can_manage ? (
                <p className="mb-3 text-[13px] text-mute">
                    {t('No workspace target this month.')}{' '}
                    <Link
                        href={quota.settings_href}
                        className="text-brand underline-offset-2 hover:underline"
                    >
                        {t('Set monthly quotas')}
                    </Link>
                    .
                </p>
            ) : null}

            {showTable ? (
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-hairline text-left">
                            <th className="px-0 py-1.5 text-[11px] font-medium text-mute">
                                {t('Owner')}
                            </th>
                            <th className="px-0 py-1.5 text-right text-[11px] font-medium text-mute">
                                {t('Won')}
                            </th>
                            <th className="px-0 py-1.5 text-right text-[11px] font-medium text-mute">
                                {t('Quota')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {quota.owners.map((row) => (
                            <tr
                                key={row.user_id ?? 'unassigned'}
                                className="border-b border-hairline last:border-0"
                            >
                                <td className="px-0 py-1.5 text-[13px] text-ink">{row.name}</td>
                                <td className="money px-0 py-1.5 text-right text-[13px] text-ink">
                                    {formatDzd(row.won_cents)}
                                </td>
                                <td className="money px-0 py-1.5 text-right text-[13px] text-ink">
                                    {row.target_cents ? formatDzd(row.target_cents) : '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : null}
        </div>
    );
}

export default function Home({
    window,
    kpis,
    primaryChart,
    pipelineHealth,
    attention,
    guidedActions = [],
    caughtUp = true,
    activityFeed,
    salesPerformance,
    quota = null,
    owners = [],
    filters = {},
    dataAsOf,
    leadOsGraph,
    placesRun = null,
    researchBrief = null,
}: Props) {
    const subtitle = t('Welcome back · :from → :to', {
        from: window.from,
        to: window.to,
    });
    const pipelineEmpty = !pipelineHealth || pipelineHealth.stages.length === 0;
    const attentionEmpty = attention.length === 0 && guidedActions.length === 0 && caughtUp;
    const recentEmpty = activityFeed.length === 0;

    return (
        <>
            <Head title={t('Home')} />
            <div className="flex-1 bg-canvas-soft" data-home="workspace">
                <div className="px-4 py-3 md:px-5 md:py-4">
                    <DashboardHeader
                        subtitle={subtitle}
                        owners={owners}
                        filters={filters}
                    />
                </div>

                {kpis.length > 0 ? <HomeKpiStrip kpis={kpis} /> : null}

                <div className="grid gap-3 px-4 pb-4 md:px-5 lg:grid-cols-12">
                    <HomeWidget
                        title={t('Pipeline')}
                        description={
                            pipelineHealth
                                ? t(':amount open · :count deals', {
                                      amount: formatCompactDzd(pipelineHealth.total_cents),
                                      count: pipelineHealth.deal_count,
                                  })
                                : t('Open opportunity value by stage')
                        }
                        action={
                            <Link
                                href="/crm/deals/board"
                                className="text-[12px] font-medium text-brand hover:underline"
                            >
                                {t('Open board')}
                            </Link>
                        }
                        className="lg:col-span-6"
                        empty={pipelineEmpty}
                    >
                        {pipelineHealth ? (
                            <PipelineBars pipeline={pipelineHealth} />
                        ) : (
                            <HomeWidgetEmpty
                                title={t('No pipeline yet')}
                                body={t('Deals will stack by stage once the first opportunity lands.')}
                                action={
                                    <Link
                                        href="/crm/deals?create=1"
                                        className="text-[12px] font-medium text-brand hover:underline"
                                    >
                                        {t('Create deal')}
                                    </Link>
                                }
                            />
                        )}
                    </HomeWidget>

                    <HomeWidget
                        title={t('Needs attention')}
                        description={t('Leads, tasks, and next moves')}
                        action={
                            <Link
                                href="/crm/activities"
                                className="text-[12px] font-medium text-brand hover:underline"
                            >
                                {t('View all')}
                            </Link>
                        }
                        className="lg:col-span-6"
                        empty={attentionEmpty}
                    >
                        <div data-home-guided className="space-y-4">
                            <CaughtUpStrip caughtUp={caughtUp} />
                            <GuidedActions actions={guidedActions} />
                            {attention.length > 0 ? (
                                <DashboardSection title={t('Needs attention')}>
                                    <AttentionList items={attention} />
                                </DashboardSection>
                            ) : null}
                        </div>
                    </HomeWidget>

                    <HomeWidget
                        title={t('Recent records')}
                        description={t('Latest activity across contacts and deals')}
                        action={
                            <Link
                                href="/crm/activities"
                                className="text-[12px] font-medium text-brand hover:underline"
                            >
                                {t('View all')}
                            </Link>
                        }
                        className="lg:col-span-7"
                        empty={recentEmpty}
                    >
                        {recentEmpty ? (
                            <HomeWidgetEmpty
                                title={t('Nothing recent')}
                                body={t('New contacts, notes, and deals will list here.')}
                                action={
                                    <Link
                                        href="/crm/contacts?create=1"
                                        className="text-[12px] font-medium text-brand hover:underline"
                                    >
                                        {t('Create contact')}
                                    </Link>
                                }
                            />
                        ) : (
                            <ActivityFeed items={activityFeed} />
                        )}
                    </HomeWidget>

                    <HomeWidget
                        title={quota ? t('Quota · :label', { label: quota.label }) : t('Quota')}
                        description={
                            quota
                                ? t('Day :day of :days · :pct% elapsed', {
                                      day: quota.day,
                                      days: quota.days,
                                      pct: quota.elapsed_pct,
                                  })
                                : t('Closed-won versus monthly DZD target')
                        }
                        action={
                            quota?.can_manage ? (
                                <Link
                                    href={quota.settings_href}
                                    className="text-[12px] font-medium text-brand hover:underline"
                                >
                                    {t('Edit quotas')}
                                </Link>
                            ) : null
                        }
                        className="lg:col-span-5"
                    >
                        {quota ? (
                            <MonthlyQuota quota={quota} />
                        ) : (
                            <HomeWidgetEmpty
                                title={t('No quota loaded')}
                                body={t('Workspace targets appear here when a monthly quota is set.')}
                            />
                        )}
                    </HomeWidget>

                    {primaryChart ? (
                        <HomeWidget
                            title={t('Performance')}
                            description={t('Revenue won over time')}
                            className="lg:col-span-7"
                        >
                            <div className="[&_svg]:h-24 md:[&_svg]:h-28">
                                <EvoVizChart payload={primaryChart} framed={false} />
                            </div>
                        </HomeWidget>
                    ) : null}

                    <HomeWidget
                        title={t('Workspace pulse')}
                        description={t('Lead OS and Places')}
                        className={primaryChart ? 'lg:col-span-5' : 'lg:col-span-12'}
                    >
                        <div data-testid="home-health" className="space-y-4">
                            <LeadOsGraphStatus graph={leadOsGraph} compact />
                            <DashboardSection
                                title={t('Places')}
                                description={
                                    placesRun
                                        ? t('Last Google Places run · :status', {
                                              status: placesRun.status,
                                          })
                                        : t('No Google Places run yet.')
                                }
                            >
                                {placesRun ? (
                                    <p className="truncate text-[13px] text-ink" data-testid="places-run">
                                        {placesRun.target_type} · {placesRun.field}
                                        {placesRun.value ? ` · ${placesRun.value}` : ''}
                                    </p>
                                ) : (
                                    <p className="text-[13px] text-mute" data-testid="places-run">
                                        {t('Waiting on the first Places lookup.')}
                                    </p>
                                )}
                                {researchBrief?.answer ? (
                                    <p className="mt-2 text-[12px] leading-5 text-ink" data-testid="research-brief">
                                        {researchBrief.answer}
                                    </p>
                                ) : (
                                    <p className="mt-2 text-[12px] text-mute" data-testid="research-brief">
                                        {t('No research brief yet.')}
                                    </p>
                                )}
                            </DashboardSection>
                        </div>
                    </HomeWidget>

                    {salesPerformance && salesPerformance.length > 0 ? (
                        <HomeWidget
                            title={t('Won by owner')}
                            description={t('Closed-won in the selected period')}
                            className="lg:col-span-12"
                        >
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-hairline text-left">
                                        <th className="px-0 py-1.5 text-[11px] font-medium text-mute">
                                            {t('Owner')}
                                        </th>
                                        <th className="px-0 py-1.5 text-right text-[11px] font-medium text-mute">
                                            {t('Won')}
                                        </th>
                                        <th className="px-0 py-1.5 text-right text-[11px] font-medium text-mute">
                                            {t('Revenue')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salesPerformance.map((row) => (
                                        <tr
                                            key={row.owner}
                                            className="border-b border-hairline last:border-0"
                                        >
                                            <td className="px-0 py-1.5 text-[13px] text-ink">
                                                {row.owner}
                                            </td>
                                            <td className="money px-0 py-1.5 text-right text-[13px] text-ink">
                                                {row.won}
                                            </td>
                                            <td className="money px-0 py-1.5 text-right text-[13px] text-ink">
                                                {formatDzd(row.revenue_cents)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </HomeWidget>
                    ) : null}
                </div>

                <footer className="border-t border-hairline px-4 py-2.5 text-[11px] text-mute md:px-5">
                    {dataAsOf
                        ? t('Data as of :when · :tz', { when: dataAsOf, tz: window.timezone })
                        : t('Data as of now · :tz', { tz: window.timezone })}
                </footer>
            </div>
        </>
    );
}

Home.layout = {
    breadcrumbs: [{ title: 'Home', href: '/dashboard' }],
};
