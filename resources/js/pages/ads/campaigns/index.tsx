import { Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import {
    AdsListToolbar,
    AdsPageHeader,
    AdsShell,
    EMPTY_ADS_FUNNEL,
    campaignStatusTone,
    matchesAdsView,
    matchesSearch,
} from '@/evo/ads';
import type { AdsFunnelCounts, AdsListViewId, AdsMetaStatus } from '@/evo/ads';
import { DataGrid } from '@/evo/data/data-grid';
import { formatMoneyFromCents } from '@/evo/lib/format';
import { Status } from '@/evo/ui/status';
import { t } from '@/lib/i18n';

type Campaign = {
    id: number;
    name: string;
    status: string;
    account?: { name: string } | null;
};

export default function AdsCampaignsIndex({
    campaigns,
    funnels,
}: {
    campaigns: Campaign[];
    funnels: Record<number, AdsFunnelCounts>;
    meta: AdsMetaStatus;
}) {
    const [search, setSearch] = useState('');
    const [view, setView] = useState<AdsListViewId>('all');

    const rows = useMemo(
        () =>
            campaigns.filter((campaign) => {
                const haystack = `${campaign.name} ${campaign.account?.name ?? ''}`;

                return matchesAdsView(campaign.status, view) && matchesSearch(haystack, search);
            }),
        [campaigns, search, view],
    );

    return (
        <AdsShell title="Campaigns">
            <div className="space-y-5 p-6">
                <AdsPageHeader
                    title="Campaigns"
                    description="Meta campaigns synced into this workspace."
                />
                <AdsListToolbar search={search} onSearchChange={setSearch} view={view} onViewChange={setView} />
                <DataGrid
                    columns={[
                        {
                            id: 'name',
                            header: t('Campaign'),
                            accessorFn: (row) => row.name,
                            cell: ({ row }) => (
                                <Link
                                    href={`/ads/campaigns/${row.original.id}`}
                                    className="font-medium text-[var(--evo-teal)] hover:underline"
                                >
                                    {row.original.name}
                                </Link>
                            ),
                        },
                        {
                            id: 'account',
                            header: t('Account'),
                            accessorFn: (row) => row.account?.name ?? '—',
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
                            id: 'spend',
                            header: t('Spend'),
                            accessorFn: (row) => (funnels[row.id] ?? EMPTY_ADS_FUNNEL).spend_cents,
                            cell: ({ row }) => (
                                <span className="tabular-nums">
                                    {formatMoneyFromCents((funnels[row.original.id] ?? EMPTY_ADS_FUNNEL).spend_cents)}
                                </span>
                            ),
                        },
                    ]}
                    data={rows}
                    getRowId={(row) => String(row.id)}
                    density="compact"
                    enableSelection={false}
                    emptyTitle={t('No campaigns yet')}
                    onRowClick={(row) => router.visit(`/ads/campaigns/${row.id}`)}
                />
            </div>
        </AdsShell>
    );
}

AdsCampaignsIndex.layout = {
    breadcrumbs: [
        { title: 'Ads', href: '/ads' },
        { title: 'Campaigns', href: '/ads/campaigns' },
    ],
};
