import { Head, Link } from '@inertiajs/react';
import { ActivityFeed, type ActivityFeedItem } from '@/components/dashboard/activity-feed';
import {
    AttentionList,
    type AttentionItem,
} from '@/components/dashboard/attention-list';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardSection } from '@/components/dashboard/dashboard-section';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { CrmKpiStrip, type KpiTile } from '@/components/crm/crm-kpi-strip';
import { EvoVizChart } from '@/evoviz/evo-viz-chart';
import type { EvoVizPayload } from '@/evoviz/contract';

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
            <div className="flex-1 bg-canvas-soft text-ui text-ink">
                <div className="mx-auto w-full max-w-7xl px-4 py-4 md:px-5">
                    <DashboardHeader
                        subtitle={subtitle}
                        owners={owners}
                        filters={filters}
                    />

                    {kpis.length > 0 ? (
                        <section aria-label="Command KPIs" className="mb-5">
                            <CrmKpiStrip kpis={kpis} columns={5} />
                        </section>
                    ) : null}

                    <div className="grid gap-5 lg:grid-cols-3">
                        <div className="space-y-5 lg:col-span-2">
                            {primaryChart ? (
                                <DashboardSection
                                    title="Performance"
                                    description="Primary trend for the selected period"
                                >
                                    <EvoVizChart payload={primaryChart} />
                                </DashboardSection>
                            ) : null}

                            {pipelineHealth ? (
                                <DashboardSection
                                    title="Pipeline health"
                                    description={`${pipelineHealth.deal_count} open deals · ${formatDzd(pipelineHealth.total_cents)} total`}
                                    action={
                                        <Link
                                            href="/crm/deals/board"
                                            className="text-ui text-brand hover:underline"
                                        >
                                            Open board
                                        </Link>
                                    }
                                >
                                    {pipelineHealth.chart ? (
                                        <EvoVizChart
                                            payload={pipelineHealth.chart}
                                        />
                                    ) : (
                                        <ul className="space-y-2 rounded-lg border border-hairline bg-canvas p-4">
                                            {pipelineHealth.stages.map(
                                                (stage) => (
                                                    <li
                                                        key={stage.name}
                                                        className="flex items-center justify-between gap-3 text-ui"
                                                    >
                                                        <span>{stage.name}</span>
                                                        <span className="text-muted-foreground">
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
                                    <div className="overflow-x-auto rounded-lg border border-hairline bg-canvas">
                                        <table className="w-full min-w-[320px] text-ui">
                                            <thead>
                                                <tr className="border-b border-hairline text-left text-section-label uppercase tracking-wide text-muted-foreground">
                                                    <th className="px-4 py-2 font-medium">
                                                        Owner
                                                    </th>
                                                    <th className="px-4 py-2 text-right font-medium">
                                                        Won
                                                    </th>
                                                    <th className="px-4 py-2 text-right font-medium">
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
                                                        <td className="px-4 py-2">
                                                            {row.owner}
                                                        </td>
                                                        <td className="money px-4 py-2 text-right">
                                                            {row.won}
                                                        </td>
                                                        <td className="money px-4 py-2 text-right">
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

                        <div className="space-y-5">
                            <DashboardSection title="Needs attention">
                                <AttentionList items={attention} />
                            </DashboardSection>

                            <DashboardSection
                                title="Recent activity"
                                action={
                                    <Link
                                        href="/crm/activities"
                                        className="text-ui text-brand hover:underline"
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

                    <footer className="mt-6 border-t border-hairline pt-3 text-section-label font-normal text-muted-foreground normal-case tracking-normal">
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
