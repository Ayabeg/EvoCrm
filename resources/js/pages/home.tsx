import { Head, Link, router, usePage } from '@inertiajs/react';
import { Star } from 'lucide-react';
import { useState } from 'react';
import { CrmKpiStrip, type KpiTile } from '@/components/crm/crm-kpi-strip';
import type { Auth } from '@/types';

type Owner = { id: number; name: string };

type Filters = {
    owner_id?: number | null;
};

type Props = {
    today: KpiTile[];
    owners?: Owner[];
    filters?: Filters;
    dataAsOf?: string;
};

const QUICK_LINKS = [
    ['Activities', '/crm/activities'],
    ['Inbox', '/inbox'],
    ['Deals', '/crm/deals'],
    ['Pipeline', '/crm/deals/board'],
    ['Lead board', '/leads'],
    ['Leads list', '/crm/leads'],
    ['Contacts', '/crm/contacts'],
] as const;

export default function Home({
    today,
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
                                Headline KPIs — open a module below to work the queue.
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
                        {QUICK_LINKS.map(([label, href]) => (
                            <Link
                                key={href}
                                href={href}
                                className="text-brand hover:underline"
                            >
                                {label}
                            </Link>
                        ))}
                    </nav>

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
