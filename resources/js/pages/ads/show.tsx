import { Link } from '@inertiajs/react';

import { AdsFunnel, AdsPageHeader, AdsShell, campaignStatusTone } from '@/evo/ads';
import type { AdsFunnelCounts, AdsMetaStatus } from '@/evo/ads';
import { BarChart, ChartFrame } from '@/evo/charts';
import { DataGrid } from '@/evo/data/data-grid';
import { formatDate, formatDateTime, formatMoneyFromCents, formatNumber } from '@/evo/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/evo/ui/card';
import { Status } from '@/evo/ui/status';
import { t } from '@/lib/i18n';

type AdRow = { id: number; name: string; status: string; kind: string };
type AdSetRow = {
    id: number;
    name: string;
    status: string;
    daily_budget_cents: number;
    ads: AdRow[];
};

type Props = {
    campaign: {
        id: number;
        name: string;
        objective?: string | null;
        status: string;
        click_to_whatsapp: boolean;
        lead_form: boolean;
        daily_budget_cents: number;
        account?: { id: number; name: string; status: string } | null;
        ad_sets: AdSetRow[];
    };
    funnel: AdsFunnelCounts;
    daily: { date: string; impressions: number; clicks: number; spend_cents: number }[];
    leads: {
        id: number;
        created_at: string;
        contact?: { id: number; first_name: string; last_name?: string | null } | null;
        lead?: {
            id: number;
            title: string;
            status: string;
            deal?: { id: number; title: string } | null;
        } | null;
    }[];
    threads: {
        id: number;
        status: string;
        last_message_at?: string | null;
        contact?: { id: number; first_name: string; last_name?: string | null } | null;
    }[];
    meta: AdsMetaStatus;
};

function contactName(contact?: { first_name: string; last_name?: string | null } | null): string {
    if (!contact) {
        return '—';
    }

    return `${contact.first_name} ${contact.last_name ?? ''}`.trim();
}

export default function CampaignShow({ campaign, funnel, daily, leads, threads, meta }: Props) {
    const chartRows = daily.map((day) => ({
        ...day,
        label: formatDate(day.date, { year: undefined }),
        spend: Math.round(day.spend_cents / 100),
    }));

    return (
        <AdsShell title={campaign.name}>
            <div className="flex-1 space-y-5 p-6">
                <AdsPageHeader
                    title={campaign.name}
                    description={
                        <>
                            {campaign.account?.name ?? t('No account')} · {t('objective')}{' '}
                            {campaign.objective ?? '—'} · {t(meta.connected ? 'Meta connected' : 'demo data')}
                        </>
                    }
                    actions={
                        <Status tone={campaignStatusTone(campaign.status)} label={campaign.status} />
                    }
                />

                <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('Funnel')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <AdsFunnel funnel={funnel} />
                            <p className="text-[11px] text-[var(--evo-ink-muted)]">
                                {t('Spend')} {formatMoneyFromCents(funnel.spend_cents)}
                                {campaign.daily_budget_cents > 0
                                    ? ` · ${t('budget')} ${formatMoneyFromCents(campaign.daily_budget_cents)}/${t('day')}`
                                    : ''}
                                . {t('Bottom-of-funnel counts are CRM truth (threads, form leads, deals).')}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('Last :days days', { days: daily.length })}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ChartFrame
                                height={160}
                                empty={daily.length === 0}
                                emptyTitle={t('No insights yet')}
                                label={t('Impressions')}
                            >
                                <BarChart
                                    data={chartRows}
                                    xKey="label"
                                    height={160}
                                    showLegend={false}
                                    series={[
                                        { dataKey: 'impressions', name: t('Impressions') },
                                    ]}
                                    yTickFormatter={(value) => formatNumber(value)}
                                />
                            </ChartFrame>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('Ad sets & ads')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <DataGrid
                                columns={[
                                    {
                                        id: 'ad_set',
                                        header: t('Ad set'),
                                        accessorFn: (row) => row.name,
                                        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
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
                                                {row.original.daily_budget_cents > 0
                                                    ? formatMoneyFromCents(row.original.daily_budget_cents)
                                                    : '—'}
                                            </span>
                                        ),
                                    },
                                    {
                                        id: 'ads',
                                        header: t('Ads'),
                                        accessorFn: (row) => row.ads.map((ad) => ad.name).join(', '),
                                        cell: ({ row }) =>
                                            row.original.ads.length === 0 ? (
                                                '—'
                                            ) : (
                                                <span>
                                                    {row.original.ads.map((ad) => (
                                                        <span key={ad.id} className="me-2 inline-block">
                                                            {ad.name}
                                                            <span className="text-[var(--evo-ink-muted)]">
                                                                {' '}
                                                                · {ad.kind}
                                                            </span>
                                                        </span>
                                                    ))}
                                                </span>
                                            ),
                                    },
                                ]}
                                data={campaign.ad_sets}
                                getRowId={(row) => String(row.id)}
                                density="compact"
                                enableSelection={false}
                                emptyTitle={t('No ad sets synced yet')}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('Leads from this campaign')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <DataGrid
                                columns={[
                                    {
                                        id: 'contact',
                                        header: t('Contact'),
                                        accessorFn: (row) => contactName(row.contact),
                                        cell: ({ row }) =>
                                            row.original.contact ? (
                                                <Link
                                                    href={`/crm/contacts/${row.original.contact.id}`}
                                                    className="text-[var(--evo-teal)] hover:underline"
                                                >
                                                    {contactName(row.original.contact)}
                                                </Link>
                                            ) : (
                                                '—'
                                            ),
                                    },
                                    {
                                        id: 'lead',
                                        header: t('CRM lead'),
                                        accessorFn: (row) => row.lead?.title ?? '—',
                                        cell: ({ row }) =>
                                            row.original.lead ? (
                                                <Link
                                                    href={`/crm/leads/${row.original.lead.id}`}
                                                    className="text-[var(--evo-teal)] hover:underline"
                                                >
                                                    {row.original.lead.title}
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
                                    {
                                        id: 'received',
                                        header: t('Received'),
                                        accessorFn: (row) => row.created_at,
                                        cell: ({ row }) => (
                                            <span className="text-[11px] text-[var(--evo-ink-muted)]">
                                                {formatDateTime(row.original.created_at)}
                                            </span>
                                        ),
                                    },
                                ]}
                                data={leads}
                                getRowId={(row) => String(row.id)}
                                density="compact"
                                enableSelection={false}
                                emptyTitle={t('No leads attributed yet')}
                            />
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('Click-to-WhatsApp conversations')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DataGrid
                            columns={[
                                {
                                    id: 'contact',
                                    header: t('Contact'),
                                    accessorFn: (row) => contactName(row.contact),
                                    cell: ({ row }) => (
                                        <Link
                                            href={`/conversations?thread=${row.original.id}`}
                                            className="text-[var(--evo-teal)] hover:underline"
                                        >
                                            {contactName(row.original.contact)}
                                        </Link>
                                    ),
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
                                    id: 'last',
                                    header: t('Last message'),
                                    accessorFn: (row) => row.last_message_at ?? '',
                                    cell: ({ row }) => (
                                        <span className="text-[11px] text-[var(--evo-ink-muted)]">
                                            {row.original.last_message_at
                                                ? formatDateTime(row.original.last_message_at)
                                                : '—'}
                                        </span>
                                    ),
                                },
                            ]}
                            data={threads}
                            getRowId={(row) => String(row.id)}
                            density="compact"
                            enableSelection={false}
                            emptyTitle={t('No CTWA conversations attributed yet')}
                        />
                    </CardContent>
                </Card>
            </div>
        </AdsShell>
    );
}

CampaignShow.layout = {
    breadcrumbs: [
        { title: 'Ads Hub', href: '/ads' },
        { title: 'Campaign', href: '#' },
    ],
};
