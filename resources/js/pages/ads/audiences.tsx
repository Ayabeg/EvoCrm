import { Form, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import type { AdsMetaStatus } from '@/evo/ads';
import { AdsConnectBanner, AdsPageHeader, AdsShell, campaignStatusTone } from '@/evo/ads';
import { matchesSearch } from '@/evo/ads';
import { DataGrid } from '@/evo/data/data-grid';
import { FilterBar } from '@/evo/data/filters';
import { Badge } from '@/evo/ui/badge';
import { Button } from '@/evo/ui/button';
import { Input } from '@/evo/ui/input';
import { Label } from '@/evo/ui/label';
import { Status } from '@/evo/ui/status';
import { t } from '@/lib/i18n';

type LinkedCampaign = {
    id: number;
    name: string;
    status: string;
};

type Segment = {
    id: number;
    name: string;
    entity: string;
    campaigns: LinkedCampaign[];
};

type Props = {
    segments: Segment[];
    meta: AdsMetaStatus;
};

export default function AdsAudiences({ segments, meta }: Props) {
    const [search, setSearch] = useState('');

    const rows = useMemo(
        () =>
            segments.filter((segment) =>
                matchesSearch(
                    `${segment.name} ${segment.campaigns.map((campaign) => campaign.name).join(' ')}`,
                    search,
                ),
            ),
        [segments, search],
    );

    return (
        <AdsShell title="Audiences">
            <div className="flex-1 space-y-5 p-6">
                <AdsPageHeader
                    title="Audiences"
                    description="CRM contact segments used as ad and outbound audiences. Sync contact segments to Meta Custom Audiences when connected."
                    actions={
                        <>
                            <Badge tone={meta.connected ? 'success' : 'neutral'} fill="soft">
                                {t(meta.connected ? 'Meta connected' : 'Meta not connected')}
                            </Badge>
                            <Link
                                href="/crm/segments"
                                className="text-[13px] font-medium text-[var(--evo-teal)] hover:underline"
                            >
                                {t('Manage segments')}
                            </Link>
                        </>
                    }
                />

                <AdsConnectBanner meta={meta} />

                <FilterBar search={search} onSearchChange={setSearch} />

                <DataGrid
                    columns={[
                        {
                            id: 'name',
                            header: t('Audience'),
                            accessorFn: (row) => row.name,
                            cell: ({ row }) => (
                                <div className="space-y-0.5">
                                    <Link
                                        href={`/crm/contacts?filter_id=${row.original.id}`}
                                        className="font-medium text-[var(--evo-teal)] hover:underline"
                                    >
                                        {row.original.name}
                                    </Link>
                                    <p className="text-[11px] text-[var(--evo-ink-muted)]">
                                        {t('Contact segment · used by :count outbound campaigns', {
                                            count: row.original.campaigns.length,
                                        })}
                                    </p>
                                </div>
                            ),
                        },
                        {
                            id: 'campaigns',
                            header: t('Outbound campaigns'),
                            accessorFn: (row) => row.campaigns.map((campaign) => campaign.name).join(', '),
                            cell: ({ row }) =>
                                row.original.campaigns.length === 0 ? (
                                    <Link
                                        href="/outbound/campaigns"
                                        className="text-[12px] text-[var(--evo-teal)] hover:underline"
                                    >
                                        {t('Create campaign')}
                                    </Link>
                                ) : (
                                    <ul className="flex flex-wrap gap-1">
                                        {row.original.campaigns.map((campaign) => (
                                            <li key={campaign.id}>
                                                <Link
                                                    href={`/outbound/campaigns/${campaign.id}`}
                                                    className="inline-flex items-center gap-1.5 rounded-[var(--evo-radius-pill)] border border-[var(--evo-hairline)] px-2 py-0.5 text-[11px] hover:bg-[var(--evo-surface-subtle)]"
                                                >
                                                    {campaign.name}
                                                    <Status
                                                        tone={campaignStatusTone(campaign.status)}
                                                        label={campaign.status}
                                                    />
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                ),
                        },
                        {
                            id: 'members',
                            header: t('Members'),
                            cell: ({ row }) => (
                                <Link
                                    href={`/crm/contacts?filter_id=${row.original.id}`}
                                    className="text-[12px] font-medium text-[var(--evo-teal)] hover:underline"
                                >
                                    {t('View members')}
                                </Link>
                            ),
                        },
                        {
                            id: 'sync',
                            header: t('Meta Custom Audience'),
                            cell: ({ row }) =>
                                meta.connected ? (
                                    <Form
                                        action={`/crm/segments/${row.original.id}/sync-meta`}
                                        method="post"
                                        className="flex flex-wrap items-end gap-2"
                                    >
                                        <div className="min-w-[160px] flex-1">
                                            <Label htmlFor={`audience-${row.original.id}`}>
                                                {t('Meta Custom Audience ID')}
                                            </Label>
                                            <Input
                                                id={`audience-${row.original.id}`}
                                                name="audience_id"
                                                placeholder="1234567890"
                                                className="mt-1"
                                                required
                                            />
                                        </div>
                                        <Button type="submit" size="sm">
                                            {t('Sync to Meta')}
                                        </Button>
                                    </Form>
                                ) : (
                                    <span className="text-[12px] text-[var(--evo-ink-muted)]">
                                        {t('Connect Meta to sync')}
                                    </span>
                                ),
                        },
                    ]}
                    data={rows}
                    getRowId={(row) => String(row.id)}
                    density="standard"
                    enableSelection={false}
                    emptyTitle={t('No contact segments yet')}
                    emptyDescription={t('Save a filter from Contacts or create one in Segments.')}
                />
            </div>
        </AdsShell>
    );
}

AdsAudiences.layout = {
    breadcrumbs: [
        { title: 'Ads', href: '/ads' },
        { title: 'Audiences', href: '/ads/audiences' },
    ],
};
