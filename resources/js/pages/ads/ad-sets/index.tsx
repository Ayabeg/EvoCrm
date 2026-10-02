import { Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import {
    AdsListToolbar,
    AdsPageHeader,
    AdsShell,
    campaignStatusTone,
    matchesAdsView,
    matchesSearch,
} from '@/evo/ads';
import type { AdsListViewId, AdsMetaStatus } from '@/evo/ads';
import { DataGrid } from '@/evo/data/data-grid';
import { formatMoneyFromCents, formatNumber } from '@/evo/lib/format';
import { Status } from '@/evo/ui/status';
import { t } from '@/lib/i18n';

type AdSet = {
    id: number;
    name: string;
    status: string;
    daily_budget_cents: number;
    ads_count: number;
    campaign?: { id: number; name: string } | null;
};

export default function AdsAdSetsIndex({
    adSets,
}: {
    adSets: AdSet[];
    meta: AdsMetaStatus;
}) {
    const [search, setSearch] = useState('');
    const [view, setView] = useState<AdsListViewId>('all');

    const rows = useMemo(
        () =>
            adSets.filter((set) => {
                const haystack = `${set.name} ${set.campaign?.name ?? ''}`;

                return matchesAdsView(set.status, view) && matchesSearch(haystack, search);
            }),
        [adSets, search, view],
    );

    return (
        <AdsShell title="Ad sets">
            <div className="space-y-5 p-6">
                <AdsPageHeader title="Ad sets" description="Synced ad sets." />
                <AdsListToolbar search={search} onSearchChange={setSearch} view={view} onViewChange={setView} />
                <DataGrid
                    columns={[
                        {
                            id: 'name',
                            header: t('Ad set'),
                            accessorFn: (row) => row.name,
                            cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
                        },
                        {
                            id: 'campaign',
                            header: t('Campaign'),
                            accessorFn: (row) => row.campaign?.name ?? '—',
                            cell: ({ row }) =>
                                row.original.campaign ? (
                                    <Link
                                        href={`/ads/campaigns/${row.original.campaign.id}`}
                                        className="text-[var(--evo-teal)] hover:underline"
                                    >
                                        {row.original.campaign.name}
                                    </Link>
                                ) : (
                                    '—'
                                ),
                        },
                        {
                            id: 'status',
                            header: t('Status'),
                            accessorFn: (row) => row.status,
                            cell: ({ row }) => (
                                <Status tone={campaignStatusTone(row.original.status)} label={row.original.status} />
                            ),
                        },
                        {
                            id: 'budget',
                            header: t('Budget/day'),
                            accessorFn: (row) => row.daily_budget_cents,
                            cell: ({ row }) => (
                                <span className="tabular-nums">
                                    {row.original.daily_budget_cents
                                        ? formatMoneyFromCents(row.original.daily_budget_cents)
                                        : '—'}
                                </span>
                            ),
                        },
                        {
                            id: 'ads',
                            header: t('Ads'),
                            accessorFn: (row) => row.ads_count,
                            cell: ({ row }) => (
                                <span className="tabular-nums">{formatNumber(row.original.ads_count)}</span>
                            ),
                        },
                    ]}
                    data={rows}
                    getRowId={(row) => String(row.id)}
                    density="compact"
                    enableSelection={false}
                    emptyTitle={t('No ad sets yet')}
                />
            </div>
        </AdsShell>
    );
}

AdsAdSetsIndex.layout = {
    breadcrumbs: [
        { title: 'Ads', href: '/ads' },
        { title: 'Ad sets', href: '/ads/ad-sets' },
    ],
};
