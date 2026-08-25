import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, Inbox, Star } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { CrmKpiStrip, type KpiTile } from '@/components/crm/crm-kpi-strip';
import { formatDzd } from '@/lib/money';
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

type InboxThread = {
    id: number;
    subject?: string | null;
    unread_count: number;
    last_message_at?: string | null;
    contact?: {
        id: number;
        first_name: string;
        last_name?: string | null;
    } | null;
    channel?: { name: string } | null;
};

type RecentDeal = {
    id: number;
    title: string;
    amount_cents: number;
    last_activity_at?: string | null;
    contact?: { first_name: string; last_name?: string | null } | null;
    stage?: { name: string } | null;
    owner?: { name: string } | null;
};

type Owner = { id: number; name: string };

type Filters = {
    owner_id?: number | null;
};

type Props = {
    today: KpiTile[];
    nextSteps: Task[];
    inboxPreview: InboxThread[];
    recentDeals: RecentDeal[];
    owners?: Owner[];
    filters?: Filters;
    dataAsOf?: string;
};

export default function Home({
    today,
    nextSteps,
    inboxPreview,
    recentDeals,
    owners = [],
    filters = {},
    dataAsOf,
}: Props) {
    const [favorite, setFavorite] = useState(true);
    const { auth } = usePage<{ auth: Auth }>().props;
    const firstName = auth.user.name.split(/\s+/)[0] ?? 'there';

    const kpis = today.filter((tile) => tile.value !== null);

    const applyFilters = (next: Partial<Filters>) => {
        router.get(
            '/dashboard',
            {
                owner_id: next.owner_id ?? filters.owner_id ?? '',
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <>
            <Head title="Home" />
            <div className="flex-1 bg-canvas-soft text-[13px] text-ink">
                <div className="mx-auto w-full max-w-7xl px-5 py-8">
                    <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h1 className="text-page-title font-semibold tracking-tight">
                                {`Good ${greeting()}, ${firstName}`}
                            </h1>
                            <p className="mt-1 text-[13px] text-muted-foreground">
                                Tasks, inbox, and pipeline — what needs you right now.
                            </p>
                        </div>
                        <div className="shrink-0">
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
                        </div>
                    </header>

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
                        <CrmKpiStrip kpis={kpis} columns={6} />
                    </section>

                    <nav
                        aria-label="Quick links"
                        className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[12px]"
                    >
                        {[
                            ['Activities', '/crm/activities'],
                            ['Inbox', '/inbox'],
                            ['Deals', '/crm/deals'],
                            ['Pipeline', '/crm/deals/board'],
                            ['Leads', '/crm/leads'],
                            ['Contacts', '/crm/contacts'],
                        ].map(([label, href]) => (
                            <Link
                                key={href}
                                href={href}
                                className="text-brand hover:underline"
                            >
                                {label}
                            </Link>
                        ))}
                    </nav>

                    <div className="mt-8 grid gap-6 lg:grid-cols-3">
                        <OperationalTable
                            title="Tasks & next steps"
                            href="/crm/activities"
                            linkLabel="All activities"
                            empty="Nothing due — you're caught up."
                        >
                            {nextSteps.length === 0 ? null : (
                                <ul className="divide-y divide-hairline">
                                    {nextSteps.map((task) => (
                                        <li
                                            key={task.id}
                                            className="flex items-start gap-2 py-2.5 first:pt-0 last:pb-0"
                                        >
                                            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                                            <div className="min-w-0">
                                                <p className="truncate text-[13px] text-ink">
                                                    {task.subject ??
                                                        task.body ??
                                                        'Task'}
                                                </p>
                                                <p className="truncate text-[11px] text-muted-foreground">
                                                    {task.deal?.title ??
                                                        [
                                                            task.contact
                                                                ?.first_name,
                                                            task.contact
                                                                ?.last_name,
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
                        </OperationalTable>

                        <OperationalTable
                            title="Unread inbox"
                            href="/inbox"
                            linkLabel="Open desk"
                            empty="Inbox clear — no unread threads."
                        >
                            {inboxPreview.length === 0 ? null : (
                                <ul className="divide-y divide-hairline">
                                    {inboxPreview.map((thread) => (
                                        <li
                                            key={thread.id}
                                            className="flex items-start gap-2 py-2.5 first:pt-0 last:pb-0"
                                        >
                                            <Inbox className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                                            <div className="min-w-0">
                                                <p className="truncate text-[13px] text-ink">
                                                    {thread.contact
                                                        ? [
                                                              thread.contact
                                                                  .first_name,
                                                              thread.contact
                                                                  .last_name,
                                                          ]
                                                              .filter(Boolean)
                                                              .join(' ')
                                                        : (thread.subject ??
                                                          'Conversation')}
                                                </p>
                                                <p className="truncate text-[11px] text-muted-foreground">
                                                    {thread.channel?.name ??
                                                        'Channel'}
                                                    {thread.unread_count > 0
                                                        ? ` · ${thread.unread_count} unread`
                                                        : ''}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </OperationalTable>

                        <OperationalTable
                            title="Recent pipeline"
                            href="/crm/deals"
                            linkLabel="All deals"
                            empty="No recent deal activity."
                        >
                            {recentDeals.length === 0 ? null : (
                                <ul className="divide-y divide-hairline">
                                    {recentDeals.map((deal) => (
                                        <li
                                            key={deal.id}
                                            className="py-2.5 first:pt-0 last:pb-0"
                                        >
                                            <Link
                                                href={`/crm/deals/${deal.id}`}
                                                className="block truncate text-[13px] font-medium text-ink hover:text-brand"
                                            >
                                                {deal.title}
                                            </Link>
                                            <p className="truncate text-[11px] text-muted-foreground">
                                                {deal.stage?.name ?? '—'}
                                                {' · '}
                                                {formatDzd(deal.amount_cents)}
                                                {deal.owner?.name
                                                    ? ` · ${deal.owner.name}`
                                                    : ''}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </OperationalTable>
                    </div>

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

function OperationalTable({
    title,
    href,
    linkLabel,
    empty,
    children,
}: {
    title: string;
    href: string;
    linkLabel: string;
    empty: string;
    children: ReactNode;
}) {
    return (
        <section
            aria-label={title}
            className="rounded-lg border border-hairline bg-canvas p-4"
        >
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[13px] font-medium text-ink">{title}</h2>
                <Link
                    href={href}
                    className="inline-flex items-center gap-1 text-[12px] text-brand hover:underline"
                >
                    {linkLabel}
                    <ArrowRight className="size-3" />
                </Link>
            </div>
            {children ?? (
                <p className="text-[13px] text-muted-foreground">{empty}</p>
            )}
        </section>
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
