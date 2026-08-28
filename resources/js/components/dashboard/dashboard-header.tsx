import { Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';

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
        <header className="mb-4 flex flex-col gap-3 md:mb-6">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h1 className="text-page-title text-ink">Home</h1>
                    <p className="mt-0.5 text-[12px] leading-5 text-mute">
                        {subtitle}
                    </p>
                </div>
                <Button asChild size="sm" className="shrink-0">
                    <Link href="/crm/deals">New deal</Link>
                </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Input
                    type="date"
                    size="sm"
                    value={filters.from ?? ''}
                    onChange={(e) => apply({ from: e.target.value })}
                    aria-label="From date"
                    className="w-[min(100%,9.5rem)]"
                />
                <span className="text-[12px] text-mute" aria-hidden>
                    -
                </span>
                <Input
                    type="date"
                    size="sm"
                    value={filters.to ?? ''}
                    onChange={(e) => apply({ to: e.target.value })}
                    aria-label="To date"
                    className="w-[min(100%,9.5rem)]"
                />
                <NativeSelect
                    value={filters.owner_id ?? ''}
                    onChange={(e) =>
                        apply({
                            owner_id: e.target.value
                                ? Number(e.target.value)
                                : null,
                        })
                    }
                    aria-label="Filter by owner"
                    className="w-full min-w-0 sm:w-[11rem]"
                >
                    <option value="">All owners</option>
                    {owners.map((owner) => (
                        <option key={owner.id} value={owner.id}>
                            {owner.name}
                        </option>
                    ))}
                </NativeSelect>
            </div>
        </header>
    );
}
