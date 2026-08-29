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

type Props = {
    window: { from: string; to: string; days: number; timezone: string };
    kpis: KpiTile[];
    primaryChart: EvoVizPayload | null;
    pipelineHealth: PipelineHealth | null;
    attention: AttentionItem[];
    activityFeed: ActivityFeedItem[];
    salesPerformance: SalesRow[] | null;
    quickActions: { label: string; href: string }[];
    owners?: Owner[];
    filters?: Filters;
    dataAsOf?: string;
    leadOsGraph?: LeadOsGraphPayload | null;
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

export default function Home({
    window,
    kpis,
    primaryChart,
    pipelineHealth,
    attention,
    activityFeed,
    salesPerformance,
    owners = [],
    filters = {},
    dataAsOf,
    leadOsGraph,
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

                {leadOsGraph ? (
                    <div className="border-b border-hairline bg-canvas px-4 py-3 md:px-5">
                        <LeadOsGraphStatus graph={leadOsGraph} compact />
                    </div>
                ) : null}

                <div className="border-b border-hairline bg-canvas px-4 py-3 md:px-5">
                    <DashboardSection title="Needs attention">
                        <AttentionList items={attention} />
                    </DashboardSection>
                </div>

                <div className="grid bg-canvas lg:grid-cols-2 lg:divide-x lg:divide-hairline">
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

                <div className="grid border-t border-hairline bg-canvas lg:grid-cols-2 lg:divide-x lg:divide-hairline">
                    <div className="px-4 py-3 md:px-5">
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

                    {salesPerformance && salesPerformance.length > 0 ? (
                        <div className="border-t border-hairline px-4 py-3 md:px-5 lg:border-t-0">
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
                </div>

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
