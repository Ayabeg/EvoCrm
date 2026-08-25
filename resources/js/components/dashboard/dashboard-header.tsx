import { Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

type Owner = { id: number; name: string };

type Filters = {
    owner_id?: number | null;
    from?: string;
    to?: string;
};

export function DashboardHeader({
    subtitle,
    owners = [],
    filters,
}: {
    subtitle: string;
    owners?: Owner[];
    filters: Filters;
}) {
    const apply = (next: Partial<Filters>) => {
        router.get(
            '/dashboard',
            {
                owner_id: next.owner_id ?? filters.owner_id ?? '',
                from: next.from ?? filters.from ?? '',
                to: next.to ?? filters.to ?? '',
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <header className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
                <h1 className="text-page-title">Home</h1>
                <p className="mt-0.5 text-ui text-muted-foreground">
                    {subtitle}
                </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <input
                    type="date"
                    value={filters.from ?? ''}
                    onChange={(e) => apply({ from: e.target.value })}
                    className="h-8 rounded-md border border-hairline bg-canvas px-2 text-ui"
                    aria-label="From date"
                />
                <span className="text-ui text-muted-foreground">–</span>
                <input
                    type="date"
                    value={filters.to ?? ''}
                    onChange={(e) => apply({ to: e.target.value })}
                    className="h-8 rounded-md border border-hairline bg-canvas px-2 text-ui"
                    aria-label="To date"
                />
                <select
                    value={filters.owner_id ?? ''}
                    onChange={(e) =>
                        apply({
                            owner_id: e.target.value
                                ? Number(e.target.value)
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
                <Button asChild size="sm">
                    <Link href="/crm/deals">New deal</Link>
                </Button>
            </div>
        </header>
    );
}
