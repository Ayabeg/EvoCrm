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
        <header className="mb-6 flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="aurora-text-display-1">Home</h1>
                    <p
                        className="aurora-text-lead mt-1"
                        style={{ color: 'var(--aurora-text-muted)' }}
                    >
                        {subtitle}
                    </p>
                </div>
                <Button asChild size="sm" className="shrink-0 self-start lg:self-auto">
                    <Link href="/crm/deals">New deal</Link>
                </Button>
            </div>

            <div
                className="flex flex-wrap items-center gap-2 rounded-[var(--aurora-radius-2)] border p-3"
                style={{
                    borderColor: 'var(--aurora-border-default)',
                    background:
                        'linear-gradient(180deg, var(--aurora-panel-medium-top), var(--aurora-panel-medium))',
                    boxShadow:
                        'var(--aurora-shadow-medium), var(--aurora-highlight-medium)',
                }}
            >
                <Input
                    type="date"
                    size="sm"
                    value={filters.from ?? ''}
                    onChange={(e) => apply({ from: e.target.value })}
                    aria-label="From date"
                    className="w-[9.5rem]"
                />
                <span
                    className="aurora-text-caption"
                    style={{ color: 'var(--aurora-text-muted)' }}
                >
                    –
                </span>
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
