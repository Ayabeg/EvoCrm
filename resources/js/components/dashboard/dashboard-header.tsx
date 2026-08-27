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
        <header className="mb-8 flex flex-col gap-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-[1.75rem] font-semibold tracking-tight text-ink">
                        Home
                    </h1>
                    <p className="mt-1 text-[12px] leading-5 text-mute">
                        {subtitle}
                    </p>
                </div>
                <Button asChild size="sm" className="shrink-0 self-start lg:self-auto">
                    <Link href="/crm/deals">New deal</Link>
                </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-hairline bg-canvas px-4 py-3">
                <Input
                    type="date"
                    size="sm"
                    value={filters.from ?? ''}
                    onChange={(e) => apply({ from: e.target.value })}
                    aria-label="From date"
                    className="w-[9.5rem]"
                />
                <span className="text-[12px] text-mute">-</span>
                <Input
                    type="date"
                    size="sm"
                    value={filters.to ?? ''}
                    onChange={(e) => apply({ to: e.target.value })}
                    aria-label="To date"
                    className="w-[9.5rem]"
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
                    className="w-[11rem]"
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
