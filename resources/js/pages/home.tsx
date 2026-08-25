import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, Star } from 'lucide-react';
import { useState } from 'react';
import { CrmKpiStrip, type KpiTile } from '@/components/crm/crm-kpi-strip';
import { QuickLaunchGrid } from '@/components/crm/quick-launch-grid';
import { EvoVizChart } from '@/evoviz';
import type { EvoVizPayload } from '@/evoviz';
import type { Auth } from '@/types';

type Task = {
    id: number;
    subject?: string | null;
    body?: string | null;
    due_at?: string | null;
    contact?: {
        id: number;
        first_name: string;
        last_name?: string | null;
    } | null;
    deal?: { id: number; title: string } | null;
};

type Department = {
    key: string;
    name: string;
    href: string;
    value?: number;
    value_label?: string;
    connected?: boolean;
};

type Owner = { id: number; name: string };

type Filters = {
    owner_id?: number | null;
    period?: string;
};

type Props = {
    today: KpiTile[];
    nextSteps: Task[];
    departments: Department[];
    charts: EvoVizPayload[];
    owners?: Owner[];
    filters?: Filters;
    dataAsOf?: string;
};

export default function Home({
    today,
    nextSteps,
    departments,
    charts,
    owners = [],
    filters = {},
    dataAsOf,
}: Props) {
    const [favorite, setFavorite] = useState(true);
    const { auth } = usePage<{ auth: Auth }>().props;
    const firstName = auth.user.name.split(/\s+/)[0] ?? 'there';

    const primaryKpis = today.filter((tile) => tile.value !== null).slice(0, 4);
    const secondaryKpis = today.filter((tile) => tile.value !== null).slice(4);

    const area = charts.find((chart) => chart.id === 'evoviz.area');
    const bar = charts.find((chart) => chart.id === 'evoviz.bar');
    const rest = charts.filter(
        (chart) => chart.id !== 'evoviz.area' && chart.id !== 'evoviz.bar',
    );

    const applyFilters = (next: Partial<Filters>) => {
        router.get(
            '/dashboard',
            {
                owner_id: next.owner_id ?? filters.owner_id ?? '',
                period: next.period ?? filters.period ?? 'today',
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const filterControls = (
        <div className="flex flex-wrap items-center gap-2">
            <select
                value={filters.owner_id ?? ''}
                onChange={(event) =>
                    applyFilters({
                        owner_id: event.target.value
                            ? Number(event.target.value)
                            : null,
                    })
                }
                className="h-8 rounded-md border border-hairline bg-canvas px-2 text-[12px]"
                aria-label="Filter by owner"
            >
                <option value="">All owners</option>
                {owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                        {owner.name}
                    </option>
                ))}
            </select>
            <select
                value={filters.period ?? 'today'}
                onChange={(event) => applyFilters({ period: event.target.value })}
                className="h-8 rounded-md border border-hairline bg-canvas px-2 text-[12px]"
                aria-label="Time period"
            >
                <option value="today">Today</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
            </select>
        </div>
    );

    return (
        <>
            <Head title="Home" />
            <div className="flex-1 bg-canvas-soft text-[13px] text-ink">
                <div className="mx-auto w-full max-w-7xl px-5 py-8">
                {filterControls ? (
                    <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h1 className="text-page-title font-semibold tracking-tight">
                                {`Good ${greeting()}, ${firstName}`}
                            </h1>
                            <p className="mt-1 text-[13px] text-muted-foreground">
                                Your command center — open deals, inbox, pipeline, and where to go next.
                            </p>
                        </div>
                        <div className="shrink-0">{filterControls}</div>
                    </header>
                ) : null}
                <div className="relative mb-6 overflow-hidden rounded-xl border border-hairline bg-canvas p-5">
                        <div
                            className="pointer-events-none absolute inset-0 opacity-[0.04]"
                            style={{
                                background:
                                    'radial-gradient(ellipse 80% 60% at 100% 0%, var(--evosales-mark), transparent)',
                            }}
                            aria-hidden
                        />
                        <div className="relative flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-[13px] font-medium text-ink">
                                    Evotechly CRM
                                </p>
                                <p className="mt-0.5 text-[12px] text-muted-foreground">
                                    Real data only — every number ties to a live record.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFavorite((value) => !value)}
                                className={
                                    favorite
                                        ? 'text-brand'
                                        : 'text-muted-foreground'
                                }
                                title="Favorite this view"
                            >
                                <Star
                                    className="size-4"
                                    fill={favorite ? 'currentColor' : 'none'}
                                />
                            </button>
                        </div>
                    </div>

                <section aria-label="Headline KPIs">
                    <CrmKpiStrip kpis={primaryKpis} columns={4} />
                </section>

                {(area || bar) && (
                    <section
                        aria-label="Trend charts"
                        className="mt-6 grid gap-3 lg:grid-cols-2"
                    >
                        {area ? <EvoVizChart payload={area} /> : null}
                        {bar ? <EvoVizChart payload={bar} /> : null}
                    </section>
                )}

                {rest.length > 0 ? (
                    <section
                        aria-label="Additional charts"
                        className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
                    >
                        {rest.map((chart) => (
                            <EvoVizChart
                                key={`${chart.id}-${chart.title}`}
                                payload={chart}
                            />
                        ))}
                    </section>
                ) : null}

                {secondaryKpis.length > 0 ? (
                    <section aria-label="Secondary metrics" className="mt-6">
                        <h2 className="mb-3 text-[13px] font-medium text-ink">
                            More today
                        </h2>
                        <CrmKpiStrip kpis={secondaryKpis} columns={3} />
                    </section>
                ) : null}

                <section aria-label="Modules" className="mt-8">
                    <h2 className="mb-3 text-[13px] font-medium text-ink">
                        Where to go
                    </h2>
                    <QuickLaunchGrid departments={departments} />
                </section>

                <section
                    aria-label="Next steps"
                    className="mt-8 rounded-lg border border-hairline bg-canvas p-4"
                >
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-[13px] font-medium text-ink">
                            Next steps
                        </h2>
                        <Link
                            href="/crm/deals"
                            className="inline-flex items-center gap-1 text-[12px] text-brand hover:underline"
                        >
                            Open deals
                            <ArrowRight className="size-3" />
                        </Link>
                    </div>
                    {nextSteps.length === 0 ? (
                        <p className="text-[13px] text-muted-foreground">
                            Nothing due — you&apos;re caught up.
                        </p>
                    ) : (
                        <ul className="divide-y divide-hairline">
                            {nextSteps.map((task) => (
                                <li
                                    key={task.id}
                                    className="flex items-start gap-2 py-2.5 first:pt-0 last:pb-0"
                                >
                                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                                    <div className="min-w-0">
                                        <p className="truncate text-[13px] text-ink">
                                            {task.subject ?? task.body ?? 'Task'}
                                        </p>
                                        <p className="truncate text-[11px] text-muted-foreground">
                                            {task.deal?.title ??
                                                [
                                                    task.contact?.first_name,
                                                    task.contact?.last_name,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' ') ??
                                                '—'}
                                            {task.due_at
                                                ? ` · due ${task.due_at}`
                                                : ''}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {dataAsOf ? (
                    <footer className="mt-10 border-t border-hairline pt-4 text-[11px] text-muted-foreground">
                        {`Data as of ${dataAsOf} · Africa/Algiers`}
                    </footer>
                ) : (
                    <footer className="mt-10 border-t border-hairline pt-4 text-[11px] text-muted-foreground">
                        Data as of now · Africa/Algiers
                    </footer>
                )}
                </div>
            </div>
        </>
    );
}

function greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) {
        return 'morning';
    }
    if (hour < 17) {
        return 'afternoon';
    }
    return 'evening';
}

Home.layout = {
    breadcrumbs: [{ title: 'Home', href: '/dashboard' }],
};
