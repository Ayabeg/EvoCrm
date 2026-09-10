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
import type { EvoVizPayload } from '@/evoviz/contract';
import { EvoVizChart } from '@/evoviz/evo-viz-chart';
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

function PipelineSummary({ pipeline }: { pipeline: PipelineHealth }) {
    const total = pipeline.total_cents;

    return (
        <ul className="space-y-2">
            {pipeline.stages.map((stage) => {
                const share = total > 0 ? (stage.amount_cents / total) * 100 : 0;

                return (
                    <li key={stage.name} className="min-w-0">
                        <div className="flex items-baseline justify-between gap-3">
                            <span className="truncate text-[13px] text-ink">
                                {stage.name}
                            </span>
                            <span className="money shrink-0 text-[12px] text-mute">
                                {stage.count} · {formatCompactDzd(stage.amount_cents)}
                            </span>
                        </div>
                        <div
                            className="mt-1 h-1 overflow-hidden rounded-full bg-hairline"
                            aria-hidden
                        >
                            <div
                                className="h-full rounded-full bg-ink"
                                style={{ width: `${Math.max(share, stage.count > 0 ? 2 : 0)}%` }}
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
        return 'Hit';
    }
    if (status === 'on_track') {
        return 'On track';
    }
    if (status === 'behind') {
        return 'Behind pace';
    }

    return 'No target';
}

function MonthlyQuota({ quota }: { quota: Quota }) {
    const hasTarget = quota.target_cents !== null;
    const barPct = Math.min(100, quota.attainment_pct ?? 0);
    const showTable = quota.owners.length > 0;

    if (!hasTarget && !showTable && !quota.can_manage) {
        return null;
    }

    return (
        <div
            className="border-b border-hairline bg-canvas px-4 py-3 md:px-5"
            data-testid="monthly-quota"
        >
            <DashboardSection
                title={`Quota · ${quota.label}`}
                description={`Closed-won vs monthly DZD target · day ${quota.day} of ${quota.days} (${quota.elapsed_pct}% elapsed)`}
                action={
                    quota.can_manage ? (
                        <Link
                            href={quota.settings_href}
                            className="text-[12px] text-mute transition-colors hover:text-ink"
                        >
                            Edit quotas
                        </Link>
                    ) : null
                }
            >
                {hasTarget ? (
                    <div className="mb-3">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className="text-[13px] text-ink">
                                <span className="money font-semibold">
                                    {formatDzd(quota.won_cents)}
                                </span>
                                <span className="text-mute">
                                    {' '}
                                    of {formatDzd(quota.target_cents)} ·{' '}
                                    {quota.attainment_pct}%
                                </span>
                            </p>
                            <p className="text-[12px] text-mute">
                                {quotaStatusLabel(quota.status)}
                                {quota.remaining_cents !== null &&
                                quota.status !== 'hit'
                                    ? ` · ${formatCompactDzd(quota.remaining_cents)} remaining`
                                    : ''}
                            </p>
                        </div>
                        <div
                            className="mt-2 h-1.5 overflow-hidden rounded-full bg-hairline"
                            aria-hidden
                        >
                            <div
                                className="h-full rounded-full bg-ink"
                                style={{
                                    width: `${Math.max(barPct, quota.won_cents > 0 ? 2 : 0)}%`,
                                }}
                            />
                        </div>
                    </div>
                ) : quota.can_manage ? (
                    <p className="mb-3 text-[13px] text-mute">
                        No workspace target this month.{' '}
                        <Link
                            href={quota.settings_href}
                            className="text-ink underline-offset-2 hover:underline"
                        >
                            Set monthly quotas
                        </Link>
                        .
                    </p>
                ) : null}

                {showTable ? (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-hairline text-left">
                                <th className="px-0 py-1.5 text-[11px] font-medium text-mute">
                                    Owner
                                </th>
                                <th className="px-0 py-1.5 text-right text-[11px] font-medium text-mute">
                                    Won
                                </th>
                                <th className="px-0 py-1.5 text-right text-[11px] font-medium text-mute">
                                    Quota
                                </th>
                                <th className="px-0 py-1.5 text-right text-[11px] font-medium text-mute">
                                    Attainment
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {quota.owners.map((row) => (
                                <tr
                                    key={row.user_id ?? 'unassigned'}
                                    className="border-b border-hairline last:border-0"
                                >
                                    <td className="px-0 py-1.5 text-[13px] text-ink">
                                        {row.name}
                                    </td>
                                    <td className="money px-0 py-1.5 text-right text-[13px] text-ink">
                                        {formatDzd(row.won_cents)}
                                    </td>
                                    <td className="money px-0 py-1.5 text-right text-[13px] text-ink">
                                        {row.target_cents
                                            ? formatDzd(row.target_cents)
                                            : '—'}
                                    </td>
                                    <td className="px-0 py-1.5 text-right text-[13px] text-ink">
                                        {row.attainment_pct !== null
                                            ? `${row.attainment_pct}%`
                                            : '—'}
                                        <span className="ml-2 text-[11px] text-mute">
                                            {quotaStatusLabel(row.status)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : null}
            </DashboardSection>
        </div>
    );
}

function PlacesRunCard({
    run,
    brief,
}: {
    run: PlacesRun | null;
    brief: ResearchBrief | null;
}) {
    const when = run?.created_at
        ? run.created_at.replace('T', ' ').slice(0, 16)
        : null;
    const href = brief?.href ?? run?.href ?? null;

    return (
        <DashboardSection
            title="Places"
            description={
                run
                    ? `Last Google Places run · ${run.status}${when ? ` · ${when}` : ''}`
                    : 'No Google Places run yet. Enrich a company to pull Algerian address and phone.'
            }
            action={
                href ? (
                    <Link
                        href={href}
                        className="text-[12px] text-mute transition-colors hover:text-ink"
                    >
                        Open record
                    </Link>
                ) : null
            }
        >
            {run ? (
                <div data-testid="places-run">
                    <p className="truncate text-[13px] text-ink">
                        {run.target_type} · {run.field}
                        {run.value ? ` · ${run.value}` : ''}
                    </p>
                    {run.error ? (
                        <p className="mt-1 text-[12px] text-mute">{run.error}</p>
                    ) : null}
                </div>
            ) : (
                <p className="text-[13px] text-mute" data-testid="places-run">
                    Waiting on the first Places lookup.
                </p>
            )}
            {brief?.answer ? (
                <p className="mt-2 text-[12px] leading-5 text-ink" data-testid="research-brief">
                    {brief.answer}
                </p>
            ) : (
                <p className="mt-2 text-[12px] text-mute" data-testid="research-brief">
                    No research brief yet.
                </p>
            )}
        </DashboardSection>
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
    const subtitle = `Sales command center · ${window.from} → ${window.to}`;

    return (
        <>
            <Head title="Home" />
            <div className="flex-1 bg-canvas-soft" data-home="workspace">
                <div className="border-b border-hairline bg-canvas px-4 py-3 md:px-5 md:py-4">
                    <DashboardHeader
                        subtitle={subtitle}
                        owners={owners}
                        filters={filters}
                    />
                </div>

                {kpis.length > 0 ? <HomeKpiStrip kpis={kpis} /> : null}

                {quota ? <MonthlyQuota quota={quota} /> : null}

                <div
                    data-testid="home-health"
                    className="grid border-b border-hairline bg-canvas lg:grid-cols-2 lg:divide-x lg:divide-hairline"
                >
                    <div className="px-4 py-3 md:px-5">
                        <LeadOsGraphStatus graph={leadOsGraph} compact />
                    </div>
                    <div className="border-t border-hairline px-4 py-3 md:px-5 lg:border-t-0">
                        <PlacesRunCard run={placesRun} brief={researchBrief} />
                    </div>
                </div>

                <div
                    data-home-guided
                    className="grid border-b border-hairline bg-canvas lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.9fr)] lg:divide-x lg:divide-hairline"
                >
                    <div className="space-y-6 px-4 py-3 md:px-5">
                        <CaughtUpStrip caughtUp={caughtUp} />
                        <GuidedActions actions={guidedActions} />
                        {attention.length > 0 ? (
                            <DashboardSection title="Needs attention">
                                <AttentionList items={attention} />
                            </DashboardSection>
                        ) : null}
                    </div>
                    <div className="border-t border-hairline px-4 py-3 md:px-5 lg:border-t-0">
                        <DashboardSection
                            title="Activity"
                            action={
                                <Link
                                    href="/crm/activities"
                                    className="text-[12px] text-mute transition-colors hover:text-ink"
                                >
                                    View all
                                </Link>
                            }
                        >
                            <ActivityFeed items={activityFeed} />
                        </DashboardSection>
                    </div>
                </div>

                <div className="grid border-t border-hairline bg-canvas lg:grid-cols-2 lg:divide-x lg:divide-hairline">
                    {pipelineHealth ? (
                        <div className="px-4 py-3 md:px-5">
                            <DashboardSection
                                title="Pipeline"
                                description={`${formatCompactDzd(pipelineHealth.total_cents)} open opportunity value · ${pipelineHealth.deal_count} deals`}
                                action={
                                    <Link
                                        href="/crm/deals/board"
                                        className="text-[12px] text-mute transition-colors hover:text-ink"
                                    >
                                        Open board
                                    </Link>
                                }
                            >
                                <PipelineSummary pipeline={pipelineHealth} />
                            </DashboardSection>
                        </div>
                    ) : null}

                    {primaryChart ? (
                        <div className="border-t border-hairline px-4 py-3 md:px-5 lg:border-t-0">
                            <DashboardSection
                                title="Performance"
                                description="Revenue won over time"
                            >
                                <div className="[&_svg]:h-24 md:[&_svg]:h-28">
                                    <EvoVizChart
                                        payload={primaryChart}
                                        framed={false}
                                    />
                                </div>
                            </DashboardSection>
                        </div>
                    ) : null}
                </div>

                {salesPerformance && salesPerformance.length > 0 ? (
                    <div className="border-t border-hairline bg-canvas px-4 py-3 md:px-5">
                        <DashboardSection
                            title="Won by owner"
                            description="Closed-won in the selected period"
                        >
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-hairline text-left">
                                            <th className="px-0 py-1.5 text-[11px] font-medium text-mute">
                                                Owner
                                            </th>
                                            <th className="px-0 py-1.5 text-right text-[11px] font-medium text-mute">
                                                Won
                                            </th>
                                            <th className="px-0 py-1.5 text-right text-[11px] font-medium text-mute">
                                                Revenue
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
                            </DashboardSection>
                    </div>
                ) : null}

                <footer className="border-t border-hairline bg-canvas px-4 py-2.5 text-[11px] text-mute md:px-5">
                    {dataAsOf
                        ? `Data as of ${dataAsOf} · ${window.timezone}`
                        : `Data as of now · ${window.timezone}`}
                </footer>
            </div>
        </>
    );
}

Home.layout = {
    breadcrumbs: [{ title: 'Home', href: '/dashboard' }],
};
