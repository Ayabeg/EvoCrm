import { Head, Link, router, usePage } from '@inertiajs/react';
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
    ['Companies', '/crm/companies'],
    ['Outbound', '/outbound'],
    ['Reports', '/crm/reports'],
] as const;

export default function Home({
    today,
    owners = [],
    filters = {},
    dataAsOf,
}: Props) {
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
            <div className="flex-1 bg-canvas-soft text-ui text-ink">
                <div className="mx-auto w-full max-w-7xl px-4 py-4 md:px-5">
                    <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-page-title">
                                {`Good ${greeting()}, ${firstName}`}
                            </h1>
                            <p className="mt-0.5 text-muted-foreground">
                                Today&apos;s queue — open a module to work records.
                            </p>
                        </div>
                        <select
                            value={filters.owner_id ?? ''}
                            onChange={(event) =>
                                applyFilters({
                                    owner_id: event.target.value
                                        ? Number(event.target.value)
                                        : null,
                                })
                            }
                            className="h-8 rounded-md border border-hairline bg-canvas px-2 text-ui"
                            aria-label="Filter by owner"
                        >
                            <option value="">All owners</option>
                            {owners.map((owner) => (
                                <option key={owner.id} value={owner.id}>
                                    {owner.name}
                                </option>
                            ))}
                        </select>
                    </header>

                    <section aria-label="Headline KPIs" className="mb-3">
                        <CrmKpiStrip kpis={kpis} columns={6} />
                    </section>

                    <nav
                        aria-label="Quick links"
                        className="flex flex-wrap gap-x-3 gap-y-1 border-t border-hairline pt-3"
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

                    <footer className="mt-6 border-t border-hairline pt-3 text-section-label font-normal text-muted-foreground normal-case tracking-normal">
                        {dataAsOf
                            ? `Data as of ${dataAsOf} · Africa/Algiers`
                            : 'Data as of now · Africa/Algiers'}
                    </footer>
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
