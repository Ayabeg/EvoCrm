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

type AdLeadRow = {
    id: number;
    contact?: { id: number; first_name: string; last_name?: string | null } | null;
    lead?: {
        id: number;
        status: string;
        deal?: { id: number; title: string } | null;
    } | null;
    campaign?: { id: number; name: string } | null;
};

type Props = {
    accounts: Account[];
    totals: FunnelCounts;
    leads: AdLeadRow[];
    meta: { connected: boolean; reason: string | null };
};

export default function AdsHub({ accounts, totals, leads, meta }: Props) {
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
                    </Card>
                ) : null}

                <div className="grid gap-3 md:grid-cols-6">
                    {[
                        ['Spend', formatDzd(totals.spend_cents)],
                        ['Impressions', totals.impressions.toLocaleString()],
                        ['Clicks', totals.clicks.toLocaleString()],
                        ['Conv. / Leads', String(totals.conversations + totals.form_leads)],
                        ['Deals', String(totals.deals)],
                        ['Won', String(totals.won)],
                    ].map(([label, value]) => (
                        <Card key={label} className="p-3">
                            <p className="text-[11px] uppercase text-muted-foreground">{label}</p>
                            <p className="mt-1 text-lg font-semibold">{value}</p>
                        </Card>
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

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card className="overflow-hidden">
                        <h2 className="border-b border-hairline px-4 py-2 text-sm font-medium">Ad accounts</h2>
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-left">
                                <tr>
                                    <th className="px-4 py-2">Account</th>
                                    <th className="px-4 py-2">Status</th>
                                    <th className="px-4 py-2">Campaigns</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.map((account) => (
                                    <tr key={account.id} className="border-t border-hairline">
                                        <td className="px-4 py-2 font-medium">{account.name}</td>
                                        <td className="px-4 py-2">{account.status}</td>
                                        <td className="px-4 py-2">{account.campaigns_count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                    <Card className="overflow-hidden">
                        <h2 className="border-b border-hairline px-4 py-2 text-sm font-medium">Latest form leads</h2>
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-left">
                                <tr>
                                    <th className="px-4 py-2">Contact</th>
                                    <th className="px-4 py-2">Campaign</th>
                                    <th className="px-4 py-2">Lead</th>
                                    <th className="px-4 py-2">Deal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leads.map((row) => (
                                    <tr key={row.id} className="border-t border-hairline">
                                        <td className="px-4 py-2">
                                            {row.contact ? (
                                                <Link href={`/crm/contacts/${row.contact.id}`} className="text-brand">
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
                                                <Link href={`/crm/deals/${row.lead.deal.id}`} className="text-brand">
                                                    {row.lead.deal.title}
                                                </Link>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                </div>
            </div>
        </AdsShell>
    );
}

AdsHub.layout = { breadcrumbs: [{ title: 'Ads Hub', href: '/ads' }] };
