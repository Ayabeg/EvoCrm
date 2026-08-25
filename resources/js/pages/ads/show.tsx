import { Link } from '@inertiajs/react';
import { AdsShell } from '@/components/crm/ads-shell';
import { FunnelBoard } from '@/components/ads/funnel';
import type { FunnelCounts } from '@/components/ads/funnel';
import { formatDzd } from '@/lib/money';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

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
    funnel: FunnelCounts;
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
    meta: { connected: boolean };
};

export default function CampaignShow({ campaign, funnel, daily, leads, threads, meta }: Props) {
    const maxImpressions = Math.max(...daily.map((d) => d.impressions), 1);

    return (
        <AdsShell title={campaign.name}>
            <div className="flex-1 space-y-6 p-6">
                <PageHeader
                    title={campaign.name}
                    description={`${campaign.account?.name ?? 'No account'} · objective ${campaign.objective ?? '—'} · ${meta.connected ? 'Meta connected' : 'demo data'}`}
                >
                    <Badge variant={campaign.status === 'active' ? 'default' : 'outline'}>{campaign.status}</Badge>
                </PageHeader>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                    <Card className="space-y-3 p-4">
                        <h2 className="text-sm font-medium">Funnel</h2>
                        <FunnelBoard funnel={funnel} />
                        <p className="text-xs text-muted-foreground">
                            Spend {formatDzd(funnel.spend_cents)}
                            {campaign.daily_budget_cents > 0
                                ? ` · budget ${formatDzd(campaign.daily_budget_cents)}/day`
                                : ''}
                            . Bottom-of-funnel counts are CRM truth (threads, form leads, deals).
                        </p>
                    </Card>

                    <Card className="space-y-3 p-4">
                        <h2 className="text-sm font-medium">Last {daily.length} days</h2>
                        {daily.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No insights yet.</p>
                        ) : (
                            <div className="flex h-28 items-end gap-1">
                                {daily.map((day) => (
                                    <div
                                        key={day.date}
                                        title={`${day.date} · ${day.impressions.toLocaleString()} impressions · ${day.clicks.toLocaleString()} clicks · ${formatDzd(day.spend_cents)}`}
                                        className="flex-1 rounded-t-sm bg-brand"
                                        style={{ height: `${Math.max((day.impressions / maxImpressions) * 100, 2)}%` }}
                                    />
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card className="overflow-hidden">
                        <h2 className="border-b border-hairline px-4 py-2 text-sm font-medium">Ad sets & ads</h2>
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-left">
                                <tr>
                                    <th className="px-4 py-2">Ad set</th>
                                    <th className="px-4 py-2">Status</th>
                                    <th className="px-4 py-2">Budget/day</th>
                                    <th className="px-4 py-2">Ads</th>
                                </tr>
                            </thead>
                            <tbody>
                                {campaign.ad_sets.length === 0 ? (
                                    <tr>
                                        <td className="px-4 py-6 text-muted-foreground" colSpan={4}>
                                            No ad sets synced yet.
                                        </td>
                                    </tr>
                                ) : (
                                    campaign.ad_sets.map((set) => (
                                        <tr key={set.id} className="border-t border-hairline align-top">
                                            <td className="px-4 py-2 font-medium">{set.name}</td>
                                            <td className="px-4 py-2">{set.status}</td>
                                            <td className="px-4 py-2">
                                                {set.daily_budget_cents > 0 ? formatDzd(set.daily_budget_cents) : '—'}
                                            </td>
                                            <td className="px-4 py-2">
                                                {set.ads.length === 0
                                                    ? '—'
                                                    : set.ads.map((ad) => (
                                                          <span key={ad.id} className="me-2 inline-block">
                                                              {ad.name}
                                                              <span className="text-muted-foreground"> · {ad.kind}</span>
                                                          </span>
                                                      ))}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </Card>

                    <Card className="overflow-hidden">
                        <h2 className="border-b border-hairline px-4 py-2 text-sm font-medium">
                            Leads from this campaign
                        </h2>
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-left">
                                <tr>
                                    <th className="px-4 py-2">Contact</th>
                                    <th className="px-4 py-2">CRM lead</th>
                                    <th className="px-4 py-2">Deal</th>
                                    <th className="px-4 py-2">Received</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leads.length === 0 ? (
                                    <tr>
                                        <td className="px-4 py-6 text-muted-foreground" colSpan={4}>
                                            No leads attributed yet.
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
                                            <td className="px-4 py-2">
                                                {row.lead ? (
                                                    <Link href={`/crm/leads/${row.lead.id}`} className="text-brand">
                                                        {row.lead.title}
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
                                            <td className="px-4 py-2 text-xs text-muted-foreground">
                                                {row.created_at}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </Card>
                </div>

                <Card className="overflow-hidden">
                    <h2 className="border-b border-hairline px-4 py-2 text-sm font-medium">
                        Click-to-WhatsApp conversations
                    </h2>
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-2">Contact</th>
                                <th className="px-4 py-2">Status</th>
                                <th className="px-4 py-2">Last message</th>
                            </tr>
                        </thead>
                        <tbody>
                            {threads.length === 0 ? (
                                <tr>
                                    <td className="px-4 py-6 text-muted-foreground" colSpan={3}>
                                        No CTWA conversations attributed yet.
                                    </td>
                                </tr>
                            ) : (
                                threads.map((thread) => (
                                    <tr key={thread.id} className="border-t border-hairline">
                                        <td className="px-4 py-2">
                                            <Link href={`/conversations?thread=${thread.id}`} className="text-brand">
                                                {thread.contact
                                                    ? `${thread.contact.first_name} ${thread.contact.last_name ?? ''}`
                                                    : '—'}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-2">{thread.status}</td>
                                        <td className="px-4 py-2 text-xs text-muted-foreground">
                                            {thread.last_message_at ?? '—'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
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
