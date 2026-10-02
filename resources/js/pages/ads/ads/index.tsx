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
import { Status } from '@/evo/ui/status';
import { t } from '@/lib/i18n';

type Ad = {
    id: number;
    name: string;
    status: string;
    kind: string;
    ad_set?: { name: string; campaign?: { id: number; name: string } | null } | null;
};

export default function AdsListIndex({
    ads,
}: {
    ads: Ad[];
    meta: AdsMetaStatus;
}) {
    const [search, setSearch] = useState('');
    const [view, setView] = useState<AdsListViewId>('all');

    const rows = useMemo(
        () =>
            ads.filter((ad) => {
                const haystack = `${ad.name} ${ad.kind} ${ad.ad_set?.name ?? ''} ${ad.ad_set?.campaign?.name ?? ''}`;

                return matchesAdsView(ad.status, view) && matchesSearch(haystack, search);
            }),
        [ads, search, view],
    );

    return (
        <AdsShell title="Ads">
            <div className="space-y-5 p-6">
                <AdsPageHeader title="Ads" description="Synced ads." />
                <AdsListToolbar search={search} onSearchChange={setSearch} view={view} onViewChange={setView} />
                <DataGrid
                    columns={[
                        {
                            id: 'name',
                            header: t('Ad'),
                            accessorFn: (row) => row.name,
                            cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
                        },
                        {
                            id: 'kind',
                            header: t('Kind'),
                            accessorFn: (row) => t(row.kind),
                        },
                        {
                            id: 'ad_set',
                            header: t('Ad set'),
                            accessorFn: (row) => row.ad_set?.name ?? '—',
                        },
                        {
                            id: 'campaign',
                            header: t('Campaign'),
                            accessorFn: (row) => row.ad_set?.campaign?.name ?? '—',
                            cell: ({ row }) =>
                                row.original.ad_set?.campaign ? (
                                    <Link
                                        href={`/ads/campaigns/${row.original.ad_set.campaign.id}`}
                                        className="text-[var(--evo-teal)] hover:underline"
                                    >
                                        {row.original.ad_set.campaign.name}
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
                    ]}
                    data={rows}
                    getRowId={(row) => String(row.id)}
                    density="compact"
                    enableSelection={false}
                    emptyTitle={t('No ads yet')}
                />
            </div>
        </AdsShell>
    );
}

AdsListIndex.layout = {
    breadcrumbs: [
        { title: 'Ads', href: '/ads' },
        { title: 'Ads', href: '/ads/ads' },
    ],
};
