import { Link } from '@inertiajs/react';
import { EMPTY_FUNNEL, FunnelBoard } from '@/components/ads/funnel';
import type { FunnelCounts } from '@/components/ads/funnel';
import { AdsShell } from '@/components/crm/ads-shell';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatDzd } from '@/lib/money';

type Campaign = {
    id: number;
    name: string;
    status: string;
    click_to_whatsapp: boolean;
    lead_form: boolean;
    daily_budget_cents: number;
    ad_sets_count: number;
    account?: { id: number; name: string } | null;
};

type Props = {
    campaigns: Campaign[];
    funnels: Record<number, FunnelCounts>;
    totals: FunnelCounts;
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

export default function AdsAttribution({ campaigns, funnels, totals, meta }: Props) {
    return (
        <AdsShell title="Attribution">
            <div className="flex-1 space-y-6 p-6">
                <PageHeader
                    title="Attribution"
                    description="Full-funnel performance from Meta spend through CRM outcomes — impressions to won deals."
                >
                    <Badge variant={meta.connected ? 'default' : 'secondary'}>
                        {meta.connected ? 'Meta connected' : 'Demo data'}
                    </Badge>
                </PageHeader>

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
                    {meta.reason ? (
                        <Card className="border-hairline bg-canvas p-4 text-sm text-muted-foreground">
                            {meta.reason}
                        </Card>
                    ) : null}
                    {campaigns.length === 0 ? (
                        <Card className="p-6 text-sm text-muted-foreground">
                            No campaigns yet. Connect Meta and sync from the{' '}
                            <Link href="/ads" className="text-brand">
                                Ads overview
                            </Link>
                            .
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
            </div>
        </AdsShell>
    );
}

AdsAttribution.layout = {
    breadcrumbs: [
        { title: 'Ads', href: '/ads' },
        { title: 'Attribution', href: '/ads/attribution' },
    ],
};
