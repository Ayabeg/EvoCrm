import { Head, Link } from '@inertiajs/react';
import type { KpiTile } from '@/components/crm/crm-kpi-strip';
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
};

function PipelineSummary({ pipeline }: { pipeline: PipelineHealth }) {
    const total = pipeline.total_cents;

    return (
        <ul className="space-y-2.5">
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
}: Props) {
    const subtitle = `Sales command center · ${window.from} → ${window.to}`;

    return (
        <>
            <Head title="Home" />
            <div className="flex-1">
                <div className="mx-auto w-full max-w-6xl px-4 py-4 md:px-6 md:py-6">
                    <DashboardHeader
                        subtitle={subtitle}
                        owners={owners}
                        filters={filters}
                    />

                    {kpis.length > 0 ? (
                        <div className="mb-4 md:mb-6">
                            <HomeKpiStrip kpis={kpis} />
                        </div>
                    ) : null}

                    <div className="mb-4 md:mb-6">
                        <DashboardSection
                            title="Needs attention"
                            surface="panel"
                        >
                            <AttentionList items={attention} />
                        </DashboardSection>
                    </div>

                    <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
                        {pipelineHealth ? (
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
                        ) : null}

                        {primaryChart ? (
                            <DashboardSection
                                title="Performance"
                                description="Revenue won over time"
                            >
                                <div className="[&_svg]:h-28 md:[&_svg]:h-32">
                                    <EvoVizChart
                                        payload={primaryChart}
                                        framed={false}
                                    />
                                </div>
                            </DashboardSection>
                        ) : null}
                    </div>

                    <div className="mt-4 grid gap-4 md:mt-6 md:gap-6 lg:grid-cols-2">
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

                        {salesPerformance && salesPerformance.length > 0 ? (
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
                                                <td className="px-0 py-2 text-[13px] text-ink">
                                                    {row.owner}
                                                </td>
                                                <td className="money px-0 py-2 text-right text-[13px] text-ink">
                                                    {row.won}
                                                </td>
                                                <td className="money px-0 py-2 text-right text-[13px] text-ink">
                                                    {formatDzd(row.revenue_cents)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </DashboardSection>
                        ) : null}
                    </div>

                    <footer className="mt-6 border-t border-hairline pt-3 text-[11px] text-mute">
                        {dataAsOf
                            ? `Data as of ${dataAsOf} · ${window.timezone}`
                            : `Data as of now · ${window.timezone}`}
                    </footer>
                </div>
            </div>
        </>
    );
}

Home.layout = {
    breadcrumbs: [{ title: 'Home', href: '/dashboard' }],
};
