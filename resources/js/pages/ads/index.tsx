import { Form, Link } from '@inertiajs/react';
import { AdsShell } from '@/components/crm/ads-shell';
import type { FunnelCounts } from '@/components/ads/funnel';
import { formatDzd } from '@/lib/money';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
    funnels: Record<number, FunnelCounts>;
    totals: FunnelCounts;
    leads: AdLeadRow[];
    meta: { connected: boolean; reason: string | null };
};

function kindOf(campaign: Campaign): string {
    if (campaign.click_to_whatsapp && campaign.lead_form) {
        return 'CTWA + Lead form';
    }
    if (campaign.click_to_whatsapp) {
        return 'Click-to-WhatsApp';
    }
    if (campaign.lead_form) {
        return 'Lead form';
    }
    return 'Traffic';
}

export default function AdsHub({ accounts, campaigns, totals, leads, meta }: Props) {
    return (
        <AdsShell title="Ads">
            <div className="flex-1 space-y-6 p-6">
                <PageHeader
                    title="Ads Hub"
                    description="Meta ad accounts, campaigns, and lead intake. Funnel attribution lives on the Attribution tab."
                >
                    <div className="flex items-center gap-2">
                        <Badge variant={meta.connected ? 'default' : 'secondary'}>
                            {meta.connected ? 'Meta connected' : 'Demo data — Meta not connected'}
                        </Badge>
                        <Form action="/ads/sync" method="post">
                            {({ processing }) => (
                                <Button variant="outline" disabled={processing}>
                                    Sync from Meta
                                </Button>
                            )}
                        </Form>
                    </div>
                </PageHeader>

                {meta.reason ? (
                    <Card className="border-hairline bg-canvas p-4 text-sm">
                        <p className="text-brand">{meta.reason}</p>
                        <p className="mt-1 text-muted-foreground">
                            Until then this hub runs on local demo data. Lead forms POST to{' '}
                            <code>/webhooks/meta/leads</code> and create Contact + Lead.
                        </p>
                    </Card>
                ) : null}

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-hairline bg-canvas px-4 py-2.5 text-[13px]">
                    {[
                        ['Spend', formatDzd(totals.spend_cents)],
                        ['Impressions', totals.impressions.toLocaleString()],
                        ['Clicks', totals.clicks.toLocaleString()],
                        ['Conv. / Leads', String(totals.conversations + totals.form_leads)],
                        ['Deals', String(totals.deals)],
                        ['Won', String(totals.won)],
                    ].map(([label, value]) => (
                        <div key={label} className="flex items-baseline gap-2">
                            <span className="text-[11px] uppercase text-muted-foreground">{label}</span>
                            <span className="font-semibold tabular-nums">{value}</span>
                        </div>
                    ))}
                </div>

                <p className="text-[13px] text-muted-foreground">
                    Funnel boards:{' '}
                    <Link href="/ads/attribution" className="font-medium text-brand">
                        Attribution
                    </Link>
                    . Meta audiences:{' '}
                    <Link href="/ads/audiences" className="font-medium text-brand">
                        Audiences
                    </Link>
                    .
                </p>

                <Card className="overflow-hidden">
                    <h2 className="border-b border-hairline px-4 py-2 text-sm font-medium">Campaigns</h2>
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-2">Campaign</th>
                                <th className="px-4 py-2">Account</th>
                                <th className="px-4 py-2">Kind</th>
                                <th className="px-4 py-2">Status</th>
                                <th className="px-4 py-2">Budget/day</th>
                                <th className="px-4 py-2">Ad sets</th>
                            </tr>
                        </thead>
                        <tbody>
                            {campaigns.length === 0 ? (
                                <tr>
                                    <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                                        No campaigns yet — sync from Meta or use demo data.
                                    </td>
                                </tr>
                            ) : (
                                campaigns.map((campaign) => (
                                    <tr key={campaign.id} className="border-t border-hairline">
                                        <td className="px-4 py-2">
                                            <Link
                                                href={`/ads/campaigns/${campaign.id}`}
                                                className="font-medium text-brand hover:underline"
                                            >
                                                {campaign.name}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-2">{campaign.account?.name ?? '—'}</td>
                                        <td className="px-4 py-2">{kindOf(campaign)}</td>
                                        <td className="px-4 py-2">{campaign.status}</td>
                                        <td className="px-4 py-2 money tabular-nums">
                                            {formatDzd(campaign.daily_budget_cents)}
                                        </td>
                                        <td className="px-4 py-2 tabular-nums">{campaign.ad_sets_count}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </Card>

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card className="overflow-hidden">
                        <h2 className="border-b border-hairline px-4 py-2 text-sm font-medium">Ad accounts</h2>
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-left">
                                <tr>
                                    <th className="px-4 py-2">Account</th>
                                    <th className="px-4 py-2">Status</th>
                                    <th className="px-4 py-2">Currency</th>
                                    <th className="px-4 py-2">Campaigns</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.length === 0 ? (
                                    <tr>
                                        <td className="px-4 py-6 text-muted-foreground" colSpan={4}>
                                            No ad accounts yet.
                                        </td>
                                    </tr>
                                ) : (
                                    accounts.map((account) => (
                                        <tr key={account.id} className="border-t border-hairline">
                                            <td className="px-4 py-2 font-medium">{account.name}</td>
                                            <td className="px-4 py-2">{account.status}</td>
                                            <td className="px-4 py-2">{account.currency}</td>
                                            <td className="px-4 py-2">{account.campaigns_count}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </Card>
                    <Card className="overflow-hidden">
                        <h2 className="border-b border-hairline px-4 py-2 text-sm font-medium">
                            Latest form leads
                        </h2>
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-left">
                                <tr>
                                    <th className="px-4 py-2">Contact</th>
                                    <th className="px-4 py-2">Campaign</th>
                                    <th className="px-4 py-2">CRM lead</th>
                                    <th className="px-4 py-2">Deal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leads.length === 0 ? (
                                    <tr>
                                        <td className="px-4 py-6 text-muted-foreground" colSpan={4}>
                                            No form submissions yet.
                                        </td>
                                    </tr>
                                ) : (
                                    leads.map((row) => (
                                        <tr key={row.id} className="border-t border-hairline">
                                            <td className="px-4 py-2">
                                                {row.contact ? (
                                                    <Link
                                                        href={`/crm/contacts/${row.contact.id}`}
                                                        className="text-brand"
                                                    >
                                                        {row.contact.first_name} {row.contact.last_name ?? ''}
                                                    </Link>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td className="px-4 py-2">{row.campaign?.name ?? '—'}</td>
                                            <td className="px-4 py-2">
                                                {row.lead ? (
                                                    <Link href={`/crm/leads/${row.lead.id}`} className="text-brand">
                                                        {row.lead.status}
                                                    </Link>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td className="px-4 py-2">
                                                {row.lead?.deal ? (
                                                    <Link
                                                        href={`/crm/deals/${row.lead.deal.id}`}
                                                        className="text-brand"
                                                    >
                                                        {row.lead.deal.title}
                                                    </Link>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </Card>
                </div>
            </div>
        </AdsShell>
    );
}

AdsHub.layout = {
    breadcrumbs: [{ title: 'Ads Hub', href: '/ads' }],
};
