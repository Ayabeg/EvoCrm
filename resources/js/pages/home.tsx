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
            <div className="aurora-page-shell flex-1">
                <div className="mx-auto w-full max-w-7xl px-4 py-5 md:px-6">
                    <DashboardHeader
                        subtitle={subtitle}
                        owners={owners}
                        filters={filters}
                    />

                    {kpis.length > 0 ? (
                        <section aria-label="Command KPIs" className="mb-6">
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
                                            className="aurora-text-body-sm transition-colors hover:underline"
                                            style={{ color: 'var(--aurora-accent-primary)' }}
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
                                        <ul
                                            className="space-y-2 rounded-[var(--aurora-radius-1)] border p-4"
                                            style={{
                                                borderColor: 'var(--aurora-border-default)',
                                                background: 'var(--aurora-panel-medium)',
                                            }}
                                        >
                                            {pipelineHealth.stages.map(
                                                (stage) => (
                                                    <li
                                                        key={stage.name}
                                                        className="flex items-center justify-between gap-3"
                                                    >
                                                        <span
                                                            className="aurora-text-body-sm"
                                                            style={{
                                                                color: 'var(--aurora-text-primary)',
                                                            }}
                                                        >
                                                            {stage.name}
                                                        </span>
                                                        <span
                                                            className="aurora-text-caption money"
                                                            style={{
                                                                color: 'var(--aurora-text-muted)',
                                                            }}
                                                        >
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
                                    <div
                                        className="overflow-x-auto rounded-[var(--aurora-radius-1)] border"
                                        style={{
                                            borderColor: 'var(--aurora-border-default)',
                                            background: 'var(--aurora-panel-medium)',
                                        }}
                                    >
                                        <table className="w-full min-w-[320px]">
                                            <thead>
                                                <tr
                                                    className="border-b text-left"
                                                    style={{
                                                        borderColor:
                                                            'var(--aurora-border-default)',
                                                    }}
                                                >
                                                    <th
                                                        className="aurora-text-eyebrow px-4 py-2 font-medium"
                                                        style={{
                                                            color: 'var(--aurora-text-muted)',
                                                        }}
                                                    >
                                                        Owner
                                                    </th>
                                                    <th
                                                        className="aurora-text-eyebrow px-4 py-2 text-right font-medium"
                                                        style={{
                                                            color: 'var(--aurora-text-muted)',
                                                        }}
                                                    >
                                                        Won
                                                    </th>
                                                    <th
                                                        className="aurora-text-eyebrow px-4 py-2 text-right font-medium"
                                                        style={{
                                                            color: 'var(--aurora-text-muted)',
                                                        }}
                                                    >
                                                        Revenue
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {salesPerformance.map((row) => (
                                                    <tr
                                                        key={row.owner}
                                                        className="border-b last:border-0"
                                                        style={{
                                                            borderColor:
                                                                'var(--aurora-border-default)',
                                                        }}
                                                    >
                                                        <td
                                                            className="aurora-text-body-sm px-4 py-2"
                                                            style={{
                                                                color: 'var(--aurora-text-primary)',
                                                            }}
                                                        >
                                                            {row.owner}
                                                        </td>
                                                        <td
                                                            className="money aurora-text-body-sm px-4 py-2 text-right"
                                                            style={{
                                                                color: 'var(--aurora-text-primary)',
                                                            }}
                                                        >
                                                            {row.won}
                                                        </td>
                                                        <td
                                                            className="money aurora-text-body-sm px-4 py-2 text-right"
                                                            style={{
                                                                color: 'var(--aurora-text-primary)',
                                                            }}
                                                        >
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
                                        className="aurora-text-body-sm transition-colors hover:underline"
                                        style={{ color: 'var(--aurora-accent-primary)' }}
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

                    <footer
                        className="aurora-text-caption mt-8 border-t pt-3"
                        style={{
                            borderColor: 'var(--aurora-border-default)',
                            color: 'var(--aurora-text-muted)',
                        }}
                    >
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
