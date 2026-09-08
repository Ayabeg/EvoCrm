import { Form, Link } from '@inertiajs/react';
import type { FunnelCounts } from '@/components/ads/funnel';
import { BrandConnectButtons } from '@/components/connectors/brand-connect';
import { AdsShell } from '@/components/crm/ads-shell';
import { HairlinePanel } from '@/components/surface/hairline-panel';
import {
    HairlineRow,
    HairlineTable,
    HairlineTd,
    HairlineTh,
} from '@/components/surface/hairline-table';
import { KpiMeter } from '@/components/surface/kpi-meter';
import { SurfaceHeader } from '@/components/surface/surface-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDzd } from '@/lib/money';

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
    meta: {
        connected: boolean;
        reason: string | null;
        connect_url?: string | null;
    };
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
            <div className="flex-1 space-y-5 p-6">
                <SurfaceHeader
                    title="Overview"
                    description="Meta ad accounts, campaigns, and lead intake. Funnel attribution lives on the Attribution tab."
                >
                    <Badge variant={meta.connected ? 'default' : 'secondary'}>
                        {meta.connected ? 'Meta connected' : 'Demo data'}
                    </Badge>
                    <Form action="/ads/sync" method="post">
                        {({ processing }) => (
                            <Button size="sm" disabled={processing}>
                                Sync from Meta
                            </Button>
                        )}
                    </Form>
                </SurfaceHeader>

                {meta.reason || !meta.connected ? (
                    <HairlinePanel className="space-y-3 px-4 py-3">
                        {meta.reason ? (
                            <p className="aurora-text-body-sm text-brand">{meta.reason}</p>
                        ) : null}
                        <BrandConnectButtons facebookUrl={meta.connect_url ?? '/auth/meta?popup=1'} />
                        <p className="aurora-text-caption text-mute">
                            Log in with Facebook in the popup. Lead forms POST to{' '}
                            <code>/webhooks/meta/leads/{'{webhookKey}'}</code> and create Contact +
                            Lead in the resolved workspace.
                        </p>
                    </HairlinePanel>
                ) : null}

                <KpiMeter
                    items={[
                        { label: 'Spend', value: formatDzd(totals.spend_cents) },
                        { label: 'Impressions', value: totals.impressions.toLocaleString() },
                        { label: 'Clicks', value: totals.clicks.toLocaleString() },
                        {
                            label: 'Conv. / Leads',
                            value: String(totals.conversations + totals.form_leads),
                        },
                        { label: 'Deals', value: String(totals.deals) },
                        { label: 'Won', value: String(totals.won) },
                    ]}
                />

                <p className="aurora-text-body-sm text-mute">
                    Funnel boards:{' '}
                    <Link href="/ads/attribution" className="font-medium text-brand hover:underline">
                        Attribution
                    </Link>
                    . Meta audiences:{' '}
                    <Link href="/ads/audiences" className="font-medium text-brand hover:underline">
                        Audiences
                    </Link>
                    .
                </p>

                <HairlinePanel>
                    <div className="border-b border-hairline px-4 py-2.5">
                        <h2 className="aurora-text-ui font-medium text-ink">Campaigns</h2>
                    </div>
                    <HairlineTable>
                        <thead>
                            <tr className="border-b border-hairline">
                                <HairlineTh>Campaign</HairlineTh>
                                <HairlineTh>Account</HairlineTh>
                                <HairlineTh>Kind</HairlineTh>
                                <HairlineTh>Status</HairlineTh>
                                <HairlineTh>Budget/day</HairlineTh>
                                <HairlineTh align="right">Ad sets</HairlineTh>
                            </tr>
                        </thead>
                        <tbody>
                            {campaigns.length === 0 ? (
                                <HairlineRow>
                                    <HairlineTd colSpan={6} className="py-6 text-mute">
                                        No campaigns yet - sync from Meta or use demo data.
                                    </HairlineTd>
                                </HairlineRow>
                            ) : (
                                campaigns.map((campaign) => (
                                    <HairlineRow key={campaign.id}>
                                        <HairlineTd>
                                            <Link
                                                href={`/ads/campaigns/${campaign.id}`}
                                                className="font-medium text-brand hover:underline"
                                            >
                                                {campaign.name}
                                            </Link>
                                        </HairlineTd>
                                        <HairlineTd className="text-mute">
                                            {campaign.account?.name ?? '-'}
                                        </HairlineTd>
                                        <HairlineTd>{kindOf(campaign)}</HairlineTd>
                                        <HairlineTd>{campaign.status}</HairlineTd>
                                        <HairlineTd className="money tabular-nums">
                                            {formatDzd(campaign.daily_budget_cents)}
                                        </HairlineTd>
                                        <HairlineTd align="right" className="tabular-nums">
                                            {campaign.ad_sets_count}
                                        </HairlineTd>
                                    </HairlineRow>
                                ))
                            )}
                        </tbody>
                    </HairlineTable>
                </HairlinePanel>

                <div className="grid gap-4 lg:grid-cols-2">
                    <HairlinePanel>
                        <div className="border-b border-hairline px-4 py-2.5">
                            <h2 className="aurora-text-ui font-medium text-ink">Ad accounts</h2>
                        </div>
                        <HairlineTable>
                            <thead>
                                <tr className="border-b border-hairline">
                                    <HairlineTh>Account</HairlineTh>
                                    <HairlineTh>Status</HairlineTh>
                                    <HairlineTh>Currency</HairlineTh>
                                    <HairlineTh align="right">Campaigns</HairlineTh>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.length === 0 ? (
                                    <HairlineRow>
                                        <HairlineTd colSpan={4} className="py-6 text-mute">
                                            No ad accounts yet.
                                        </HairlineTd>
                                    </HairlineRow>
                                ) : (
                                    accounts.map((account) => (
                                        <HairlineRow key={account.id}>
                                            <HairlineTd className="font-medium">{account.name}</HairlineTd>
                                            <HairlineTd>{account.status}</HairlineTd>
                                            <HairlineTd>{account.currency}</HairlineTd>
                                            <HairlineTd align="right">{account.campaigns_count}</HairlineTd>
                                        </HairlineRow>
                                    ))
                                )}
                            </tbody>
                        </HairlineTable>
                    </HairlinePanel>

                    <HairlinePanel>
                        <div className="border-b border-hairline px-4 py-2.5">
                            <h2 className="aurora-text-ui font-medium text-ink">Latest form leads</h2>
                        </div>
                        <HairlineTable>
                            <thead>
                                <tr className="border-b border-hairline">
                                    <HairlineTh>Contact</HairlineTh>
                                    <HairlineTh>Campaign</HairlineTh>
                                    <HairlineTh>CRM lead</HairlineTh>
                                    <HairlineTh>Deal</HairlineTh>
                                </tr>
                            </thead>
                            <tbody>
                                {leads.length === 0 ? (
                                    <HairlineRow>
                                        <HairlineTd colSpan={4} className="py-6 text-mute">
                                            No form submissions yet.
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
                                            <HairlineTd className="text-mute">
                                                {row.campaign?.name ?? '-'}
                                            </HairlineTd>
                                            <HairlineTd>
                                                {row.lead ? (
                                                    <Link
                                                        href={`/crm/leads/${row.lead.id}`}
                                                        className="text-brand hover:underline"
                                                    >
                                                        {row.lead.status}
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
                                        </HairlineRow>
                                    ))
                                )}
                            </tbody>
                        </HairlineTable>
                    </HairlinePanel>
                </div>
            </div>
        </AdsShell>
    );
}

AdsHub.layout = {
    breadcrumbs: [{ title: 'Ads Hub', href: '/ads' }],
};
