import { Form, Link } from '@inertiajs/react';
import { AdsShell } from '@/components/crm/ads-shell';
import { EMPTY_FUNNEL, FunnelBoard } from '@/components/ads/funnel';
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
    lead?: { id: number; title: string; status: string } | null;
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

export default function AdsHub({ accounts, campaigns, funnels, totals, leads, meta }: Props) {
    return (
        <AdsShell title="Ads">
            <div className="flex-1 space-y-6 p-6">
                <PageHeader
                    title="Ads Hub"
                    description="Meta ad accounts, campaigns, and the full funnel from impressions to won deals. Official Marketing API only."
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
                            <code>/webhooks/meta/leads</code> and create Contact + Lead; click-to-WhatsApp
                            conversations land in My Inbox via Evolution Cloud.
                        </p>
                    </Card>
                ) : null}

                <div className="grid gap-3 md:grid-cols-6">
                    {[
                        ['Spend', formatDzd(totals.spend_cents)],
                        ['Impressions', totals.impressions.toLocaleString()],
                        ['Clicks', totals.clicks.toLocaleString()],
                        ['Conversations / Leads', String(totals.conversations + totals.form_leads)],
                        ['Deals', String(totals.deals)],
                        ['Won', String(totals.won)],
                    ].map(([label, value]) => (
                        <Card key={label} className="p-3">
                            <p className="text-[11px] uppercase text-muted-foreground">{label}</p>
                            <p className="mt-1 text-lg font-semibold">{value}</p>
                        </Card>
                    ))}
                </div>

                <section className="space-y-3">
                    <h2 className="text-sm font-semibold">Funnel board</h2>
                    {campaigns.length === 0 ? (
                        <Card className="p-6 text-sm text-muted-foreground">
                            No campaigns yet. Run <code>php artisan db:seed</code> for demo data, or connect Meta
                            and sync.
                        </Card>
                    ) : (
                        <div className="grid gap-3 xl:grid-cols-2">
                            {campaigns.map((campaign) => (
                                <Card key={campaign.id} className="space-y-3 p-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Link
                                            href={`/ads/campaigns/${campaign.id}`}
                                            className="font-medium text-brand"
                                        >
                                            {campaign.name}
                                        </Link>
                                        <Badge variant="secondary">{kindOf(campaign)}</Badge>
                                        <Badge variant={campaign.status === 'active' ? 'default' : 'outline'}>
                                            {campaign.status}
                                        </Badge>
                                        <span className="ms-auto text-xs text-muted-foreground">
                                            {campaign.account?.name ?? '—'}
                                        </span>
                                    </div>
                                    <FunnelBoard funnel={funnels[campaign.id] ?? EMPTY_FUNNEL} compact />
                                    <p className="text-xs text-muted-foreground">
                                        Spend {formatDzd((funnels[campaign.id] ?? EMPTY_FUNNEL).spend_cents)} ·{' '}
                                        {campaign.ad_sets_count} ad sets
                                        {campaign.daily_budget_cents > 0
                                            ? ` · budget ${formatDzd(campaign.daily_budget_cents)}/day`
                                            : ''}
                                    </p>
                                </Card>
                            ))}
                        </div>
                    )}
                </section>

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
                                </tr>
                            </thead>
                            <tbody>
                                {leads.length === 0 ? (
                                    <tr>
                                        <td className="px-4 py-6 text-muted-foreground" colSpan={3}>
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
