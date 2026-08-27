import { Link } from '@inertiajs/react';
import { FunnelBoard } from '@/components/ads/funnel';
import type { FunnelCounts } from '@/components/ads/funnel';
import { AdsShell } from '@/components/crm/ads-shell';
import { HairlinePanel } from '@/components/surface/hairline-panel';
import {
    HairlineRow,
    HairlineTable,
    HairlineTd,
    HairlineTh,
} from '@/components/surface/hairline-table';
import { SurfaceHeader } from '@/components/surface/surface-header';
import { Badge } from '@/components/ui/badge';
import { formatDzd } from '@/lib/money';

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
    const maxImpressions = Math.max(...daily.map((day) => day.impressions), 1);

    return (
        <AdsShell title={campaign.name}>
            <div className="flex-1 space-y-5 p-6">
                <SurfaceHeader
                    title={campaign.name}
                    description={`${campaign.account?.name ?? 'No account'} · objective ${campaign.objective ?? '-'} · ${meta.connected ? 'Meta connected' : 'demo data'}`}
                >
                    <Badge variant={campaign.status === 'active' ? 'default' : 'outline'}>
                        {campaign.status}
                    </Badge>
                </SurfaceHeader>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                    <HairlinePanel className="space-y-3 p-4">
                        <h2 className="aurora-text-ui font-medium text-ink">Funnel</h2>
                        <FunnelBoard funnel={funnel} />
                        <p className="aurora-text-caption text-mute">
                            Spend {formatDzd(funnel.spend_cents)}
                            {campaign.daily_budget_cents > 0
                                ? ` · budget ${formatDzd(campaign.daily_budget_cents)}/day`
                                : ''}
                            . Bottom-of-funnel counts are CRM truth (threads, form leads, deals).
                        </p>
                    </HairlinePanel>

                    <HairlinePanel className="space-y-3 p-4">
                        <h2 className="aurora-text-ui font-medium text-ink">Last {daily.length} days</h2>
                        {daily.length === 0 ? (
                            <p className="aurora-text-body-sm text-mute">No insights yet.</p>
                        ) : (
                            <div className="flex h-28 items-end gap-1">
                                {daily.map((day) => (
                                    <div
                                        key={day.date}
                                        title={`${day.date} · ${day.impressions.toLocaleString()} impressions · ${day.clicks.toLocaleString()} clicks · ${formatDzd(day.spend_cents)}`}
                                        className="flex-1 rounded-t-sm bg-brand"
                                        style={{
                                            height: `${Math.max((day.impressions / maxImpressions) * 100, 2)}%`,
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </HairlinePanel>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <HairlinePanel>
                        <div className="border-b border-hairline px-4 py-2.5">
                            <h2 className="aurora-text-ui font-medium text-ink">Ad sets & ads</h2>
                        </div>
                        <HairlineTable>
                            <thead>
                                <tr className="border-b border-hairline">
                                    <HairlineTh>Ad set</HairlineTh>
                                    <HairlineTh>Status</HairlineTh>
                                    <HairlineTh>Budget/day</HairlineTh>
                                    <HairlineTh>Ads</HairlineTh>
                                </tr>
                            </thead>
                            <tbody>
                                {campaign.ad_sets.length === 0 ? (
                                    <HairlineRow>
                                        <HairlineTd colSpan={4} className="py-6 text-mute">
                                            No ad sets synced yet.
                                        </HairlineTd>
                                    </HairlineRow>
                                ) : (
                                    campaign.ad_sets.map((set) => (
                                        <HairlineRow key={set.id} className="align-top">
                                            <HairlineTd className="font-medium">{set.name}</HairlineTd>
                                            <HairlineTd>{set.status}</HairlineTd>
                                            <HairlineTd>
                                                {set.daily_budget_cents > 0
                                                    ? formatDzd(set.daily_budget_cents)
                                                    : '-'}
                                            </HairlineTd>
                                            <HairlineTd>
                                                {set.ads.length === 0
                                                    ? '-'
                                                    : set.ads.map((ad) => (
                                                          <span key={ad.id} className="me-2 inline-block">
                                                              {ad.name}
                                                              <span className="text-mute"> · {ad.kind}</span>
                                                          </span>
                                                      ))}
                                            </HairlineTd>
                                        </HairlineRow>
                                    ))
                                )}
                            </tbody>
                        </HairlineTable>
                    </HairlinePanel>

                    <HairlinePanel>
                        <div className="border-b border-hairline px-4 py-2.5">
                            <h2 className="aurora-text-ui font-medium text-ink">
                                Leads from this campaign
                            </h2>
                        </div>
                        <HairlineTable>
                            <thead>
                                <tr className="border-b border-hairline">
                                    <HairlineTh>Contact</HairlineTh>
                                    <HairlineTh>CRM lead</HairlineTh>
                                    <HairlineTh>Deal</HairlineTh>
                                    <HairlineTh>Received</HairlineTh>
                                </tr>
                            </thead>
                            <tbody>
                                {leads.length === 0 ? (
                                    <HairlineRow>
                                        <HairlineTd colSpan={4} className="py-6 text-mute">
                                            No leads attributed yet.
                                        </HairlineTd>
                                    </HairlineRow>
                                ) : (
                                    leads.map((row) => (
                                        <HairlineRow key={row.id}>
                                            <HairlineTd>
                                                {row.contact ? (
                                                    <Link
                                                        href={`/crm/contacts/${row.contact.id}`}
                                                        className="text-brand hover:underline"
                                                    >
                                                        {row.contact.first_name} {row.contact.last_name ?? ''}
                                                    </Link>
                                                ) : (
                                                    '-'
                                                )}
                                            </HairlineTd>
                                            <HairlineTd>
                                                {row.lead ? (
                                                    <Link
                                                        href={`/crm/leads/${row.lead.id}`}
                                                        className="text-brand hover:underline"
                                                    >
                                                        {row.lead.title}
                                                    </Link>
                                                ) : (
                                                    '-'
                                                )}
                                            </HairlineTd>
                                            <HairlineTd>
                                                {row.lead?.deal ? (
                                                    <Link
                                                        href={`/crm/deals/${row.lead.deal.id}`}
                                                        className="text-brand hover:underline"
                                                    >
                                                        {row.lead.deal.title}
                                                    </Link>
                                                ) : (
                                                    '-'
                                                )}
                                            </HairlineTd>
                                            <HairlineTd className="aurora-text-caption text-mute">
                                                {row.created_at}
                                            </HairlineTd>
                                        </HairlineRow>
                                    ))
                                )}
                            </tbody>
                        </HairlineTable>
                    </HairlinePanel>
                </div>

                <HairlinePanel>
                    <div className="border-b border-hairline px-4 py-2.5">
                        <h2 className="aurora-text-ui font-medium text-ink">
                            Click-to-WhatsApp conversations
                        </h2>
                    </div>
                    <HairlineTable>
                        <thead>
                            <tr className="border-b border-hairline">
                                <HairlineTh>Contact</HairlineTh>
                                <HairlineTh>Status</HairlineTh>
                                <HairlineTh>Last message</HairlineTh>
                            </tr>
                        </thead>
                        <tbody>
                            {threads.length === 0 ? (
                                <HairlineRow>
                                    <HairlineTd colSpan={3} className="py-6 text-mute">
                                        No CTWA conversations attributed yet.
                                    </HairlineTd>
                                </HairlineRow>
                            ) : (
                                threads.map((thread) => (
                                    <HairlineRow key={thread.id}>
                                        <HairlineTd>
                                            <Link
                                                href={`/conversations?thread=${thread.id}`}
                                                className="text-brand hover:underline"
                                            >
                                                {thread.contact
                                                    ? `${thread.contact.first_name} ${thread.contact.last_name ?? ''}`
                                                    : '-'}
                                            </Link>
                                        </HairlineTd>
                                        <HairlineTd>{thread.status}</HairlineTd>
                                        <HairlineTd className="aurora-text-caption text-mute">
                                            {thread.last_message_at ?? '-'}
                                        </HairlineTd>
                                    </HairlineRow>
                                ))
                            )}
                        </tbody>
                    </HairlineTable>
                </HairlinePanel>
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
