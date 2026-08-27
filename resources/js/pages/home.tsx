import { Head, Link } from '@inertiajs/react';
import { CrmKpiStrip } from '@/components/crm/crm-kpi-strip';
import type { KpiTile } from '@/components/crm/crm-kpi-strip';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import type { ActivityFeedItem } from '@/components/dashboard/activity-feed';
import { AttentionList } from '@/components/dashboard/attention-list';
import type { AttentionItem } from '@/components/dashboard/attention-list';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardSection } from '@/components/dashboard/dashboard-section';
import { QuickActions } from '@/components/dashboard/quick-actions';
import type { EvoVizPayload } from '@/evoviz/contract';
import { EvoVizChart } from '@/evoviz/evo-viz-chart';

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

function formatDzd(cents: number): string {
    return new Intl.NumberFormat('fr-DZ', {
        style: 'currency',
        currency: 'DZD',
        maximumFractionDigits: 0,
    }).format(cents / 100);
}

export default function Home({
    window,
    kpis,
    primaryChart,
    pipelineHealth,
    attention,
    activityFeed,
    salesPerformance,
    quickActions,
    owners = [],
    filters = {},
    dataAsOf,
}: Props) {
    const subtitle = `Sales command center · ${window.from} → ${window.to}`;

    return (
        <>
            <Head title="Home" />
            <div className="flex-1">
                <div className="mx-auto w-full max-w-7xl px-5 py-8 md:px-8">
                    <DashboardHeader
                        subtitle={subtitle}
                        owners={owners}
                        filters={filters}
                    />

                    {kpis.length > 0 ? (
                        <section aria-label="Command KPIs" className="mb-8">
                            <CrmKpiStrip kpis={kpis} columns={5} />
                        </section>
                    ) : null}

                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="space-y-6 lg:col-span-2">
                            {primaryChart ? (
                                <DashboardSection
                                    title="Performance"
                                    description="Primary trend for the selected period"
                                >
                                    <EvoVizChart
                                        payload={primaryChart}
                                        framed={false}
                                    />
                                </DashboardSection>
                            ) : null}

                            {pipelineHealth ? (
                                <DashboardSection
                                    title="Pipeline health"
                                    description={`${pipelineHealth.deal_count} open deals · ${formatDzd(pipelineHealth.total_cents)} total`}
                                    action={
                                        <Link
                                            href="/crm/deals/board"
                                            className="text-[12px] text-brand transition-colors hover:underline"
                                        >
                                            Open board
                                        </Link>
                                    }
                                >
                                    {pipelineHealth.chart ? (
                                        <EvoVizChart
                                            payload={pipelineHealth.chart}
                                            framed={false}
                                        />
                                    ) : (
                                        <ul className="space-y-3">
                                            {pipelineHealth.stages.map(
                                                (stage) => (
                                                    <li
                                                        key={stage.name}
                                                        className="flex items-center justify-between gap-3"
                                                    >
                                                        <span className="text-[13px] text-ink">
                                                            {stage.name}
                                                        </span>
                                                        <span className="money text-[12px] text-mute">
                                                            {stage.count} ·{' '}
                                                            {formatDzd(
                                                                stage.amount_cents,
                                                            )}
                                                        </span>
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    )}
                                </DashboardSection>
                            ) : null}

                            {salesPerformance &&
                            salesPerformance.length > 0 ? (
                                <DashboardSection
                                    title="Sales performance"
                                    description="Won deals in period by owner"
                                >
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[320px]">
                                            <thead>
                                                <tr className="border-b border-hairline text-left">
                                                    <th className="px-0 py-2 text-[11px] font-medium text-mute">
                                                        Owner
                                                    </th>
                                                    <th className="px-0 py-2 text-right text-[11px] font-medium text-mute">
                                                        Won
                                                    </th>
                                                    <th className="px-0 py-2 text-right text-[11px] font-medium text-mute">
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
                                                        <td className="px-0 py-2.5 text-[13px] text-ink">
                                                            {row.owner}
                                                        </td>
                                                        <td className="money px-0 py-2.5 text-right text-[13px] text-ink">
                                                            {row.won}
                                                        </td>
                                                        <td className="money px-0 py-2.5 text-right text-[13px] text-ink">
                                                            {formatDzd(
                                                                row.revenue_cents,
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </DashboardSection>
                            ) : null}
                        </div>

                        <div className="space-y-6">
                            <DashboardSection title="Needs attention">
                                <AttentionList items={attention} />
                            </DashboardSection>

                            <DashboardSection
                                title="Recent activity"
                                action={
                                    <Link
                                        href="/crm/activities"
                                        className="text-[12px] text-brand transition-colors hover:underline"
                                    >
                                        View all
                                    </Link>
                                }
                            >
                                <ActivityFeed items={activityFeed} />
                            </DashboardSection>

                            <DashboardSection title="Quick actions">
                                <QuickActions actions={quickActions} />
                            </DashboardSection>
                        </div>
                    </div>

                    <footer className="mt-10 border-t border-hairline pt-4 text-[11px] text-mute">
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
