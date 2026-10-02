import { Form, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import {
    AdsConnectBanner,
    AdsFunnel,
    AdsListToolbar,
    AdsPageHeader,
    AdsShell,
    EMPTY_ADS_FUNNEL,
    campaignKind,
    campaignStatusTone,
    matchesAdsView,
    matchesSearch,
} from '@/evo/ads';
import type { AdsFunnelCounts, AdsListViewId, AdsMetaStatus } from '@/evo/ads';
import { DataGrid } from '@/evo/data/data-grid';
import { formatMoneyFromCents, formatNumber } from '@/evo/lib/format';
import { CrmKpiStrip } from '@/evo/patterns/kpi';
import { Badge } from '@/evo/ui/badge';
import { Button } from '@/evo/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/evo/ui/card';
import { Status } from '@/evo/ui/status';
import { t } from '@/lib/i18n';

type Account = {
    id: number;
    name: string;
    status: string;
    currency: string;
    campaigns_count: number;
};

type Campaign = {
    id: number;
    name: string;
    objective?: string | null;
    status: string;
    click_to_whatsapp: boolean;
    lead_form: boolean;
    daily_budget_cents: number;
    ad_sets_count: number;
    account?: { id: number; name: string } | null;
};

type AdLeadRow = {
    id: number;
    form_id?: string | null;
    created_at: string;
    contact?: { id: number; first_name: string; last_name?: string | null } | null;
    lead?: {
        id: number;
        title?: string;
        status: string;
        deal?: { id: number; title: string } | null;
    } | null;
    campaign?: { id: number; name: string } | null;
};

type Props = {
    accounts: Account[];
    campaigns: Campaign[];
    funnels: Record<number, AdsFunnelCounts>;
    totals: AdsFunnelCounts;
    leads: AdLeadRow[];
    meta: AdsMetaStatus;
};

export default function AdsHub({ accounts, campaigns, totals, leads, meta }: Props) {
    const [search, setSearch] = useState('');
    const [view, setView] = useState<AdsListViewId>('all');

    const rows = useMemo(
        () =>
            campaigns.filter((campaign) => {
                const haystack = `${campaign.name} ${campaign.account?.name ?? ''} ${campaignKind(campaign)}`;

                return matchesAdsView(campaign.status, view) && matchesSearch(haystack, search);
            }),
        [campaigns, search, view],
    );

    return (
        <AdsShell title="Ads">
            <div className="flex-1 space-y-5 p-6">
                <AdsPageHeader
                    title="Overview"
                    description="Meta ad accounts, campaigns, and lead intake. Funnel attribution lives on the Attribution tab."
                    actions={
                        <>
                            <Badge tone={meta.connected ? 'success' : 'neutral'} fill="soft">
                                {t(meta.connected ? 'Meta connected' : 'Demo data')}
                            </Badge>
                            <Form action="/ads/sync" method="post">
                                {({ processing }) => (
                                    <Button type="submit" size="sm" disabled={processing} loading={processing}>
                                        {t('Sync from Meta')}
                                    </Button>
                                )}
                            </Form>
                        </>
                    }
                />

                <AdsConnectBanner meta={meta} />

                <CrmKpiStrip
                    columns={6}
                    kpis={[
                        { key: 'spend', label: t('Spend'), value: formatMoneyFromCents(totals.spend_cents) },
                        { key: 'impressions', label: t('Impressions'), value: formatNumber(totals.impressions) },
                        { key: 'clicks', label: t('Clicks'), value: formatNumber(totals.clicks) },
                        {
                            key: 'leads',
                            label: t('Conversations / Leads'),
                            value: formatNumber(totals.conversations + totals.form_leads),
                        },
                        { key: 'deals', label: t('Deals'), value: formatNumber(totals.deals) },
                        { key: 'won', label: t('Won'), value: formatNumber(totals.won) },
                    ]}
                />

                <p className="text-[13px] text-[var(--evo-ink-secondary)]">
                    {t('Funnel boards:')}{' '}
                    <Link href="/ads/attribution" className="font-medium text-[var(--evo-teal)] hover:underline">
                        {t('Attribution')}
                    </Link>
                    . {t('Meta audiences:')}{' '}
                    <Link href="/ads/audiences" className="font-medium text-[var(--evo-teal)] hover:underline">
                        {t('Audiences')}
                    </Link>
                    .
                </p>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('Campaigns')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <AdsListToolbar
                            search={search}
                            onSearchChange={setSearch}
                            view={view}
                            onViewChange={setView}
                        />
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
                                    id: 'kind',
                                    header: t('Kind'),
                                    accessorFn: (row) => t(campaignKind(row)),
                                },
                                {
                                    id: 'status',
                                    header: t('Status'),
                                    accessorFn: (row) => row.status,
                                    cell: ({ row }) => (
                                        <Status
                                            tone={campaignStatusTone(row.original.status)}
                                            label={row.original.status}
                                        />
                                    ),
                                },
                                {
                                    id: 'budget',
                                    header: t('Budget/day'),
                                    accessorFn: (row) => row.daily_budget_cents,
                                    cell: ({ row }) => (
                                        <span className="tabular-nums">
                                            {formatMoneyFromCents(row.original.daily_budget_cents)}
                                        </span>
                                    ),
                                },
                                {
                                    id: 'ad_sets',
                                    header: t('Ad sets'),
                                    accessorFn: (row) => row.ad_sets_count,
                                    cell: ({ row }) => (
                                        <span className="tabular-nums">{formatNumber(row.original.ad_sets_count)}</span>
                                    ),
                                },
                            ]}
                            data={rows}
                            getRowId={(row) => String(row.id)}
                            density="compact"
                            enableSelection={false}
                            emptyTitle={t('No campaigns yet')}
                            emptyDescription={t('Sync from Meta or use demo data.')}
                        />
                    </CardContent>
                </Card>

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('Ad accounts')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <DataGrid
                                columns={[
                                    { id: 'name', header: t('Account'), accessorFn: (row) => row.name },
                                    {
                                        id: 'status',
                                        header: t('Status'),
                                        accessorFn: (row) => row.status,
                                        cell: ({ row }) => (
                                            <Status
                                                tone={campaignStatusTone(row.original.status)}
                                                label={row.original.status}
                                            />
                                        ),
                                    },
                                    { id: 'currency', header: t('Currency'), accessorFn: (row) => row.currency },
                                    {
                                        id: 'campaigns',
                                        header: t('Campaigns'),
                                        accessorFn: (row) => row.campaigns_count,
                                        cell: ({ row }) => (
                                            <span className="tabular-nums">
                                                {formatNumber(row.original.campaigns_count)}
                                            </span>
                                        ),
                                    },
                                ]}
                                data={accounts}
                                getRowId={(row) => String(row.id)}
                                density="compact"
                                enableSelection={false}
                                emptyTitle={t('No ad accounts yet')}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('Latest form leads')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <DataGrid
                                columns={[
                                    {
                                        id: 'contact',
                                        header: t('Contact'),
                                        accessorFn: (row) =>
                                            row.contact
                                                ? `${row.contact.first_name} ${row.contact.last_name ?? ''}`
                                                : '—',
                                        cell: ({ row }) =>
                                            row.original.contact ? (
                                                <Link
                                                    href={`/crm/contacts/${row.original.contact.id}`}
                                                    className="text-[var(--evo-teal)] hover:underline"
                                                >
                                                    {row.original.contact.first_name}{' '}
                                                    {row.original.contact.last_name ?? ''}
                                                </Link>
                                            ) : (
                                                '—'
                                            ),
                                    },
                                    {
                                        id: 'campaign',
                                        header: t('Campaign'),
                                        accessorFn: (row) => row.campaign?.name ?? '—',
                                    },
                                    {
                                        id: 'lead',
                                        header: t('CRM lead'),
                                        accessorFn: (row) => row.lead?.status ?? '—',
                                        cell: ({ row }) =>
                                            row.original.lead ? (
                                                <Link
                                                    href={`/crm/leads/${row.original.lead.id}`}
                                                    className="text-[var(--evo-teal)] hover:underline"
                                                >
                                                    {row.original.lead.status}
                                                </Link>
                                            ) : (
                                                '—'
                                            ),
                                    },
                                    {
                                        id: 'deal',
                                        header: t('Deal'),
                                        accessorFn: (row) => row.lead?.deal?.title ?? '—',
                                        cell: ({ row }) =>
                                            row.original.lead?.deal ? (
                                                <Link
                                                    href={`/crm/deals/${row.original.lead.deal.id}`}
                                                    className="text-[var(--evo-teal)] hover:underline"
                                                >
                                                    {row.original.lead.deal.title}
                                                </Link>
                                            ) : (
                                                '—'
                                            ),
                                    },
                                ]}
                                data={leads}
                                getRowId={(row) => String(row.id)}
                                density="compact"
                                enableSelection={false}
                                emptyTitle={t('No form submissions yet')}
                            />
                        </CardContent>
                    </Card>
                </div>

                {campaigns[0] ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('Workspace funnel')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AdsFunnel funnel={totals ?? EMPTY_ADS_FUNNEL} />
                        </CardContent>
                    </Card>
                ) : null}
            </div>
        </AdsShell>
    );
}

AdsHub.layout = {
    breadcrumbs: [{ title: 'Ads Hub', href: '/ads' }],
};
