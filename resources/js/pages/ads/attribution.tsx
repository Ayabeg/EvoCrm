import { Link } from '@inertiajs/react';
import { EMPTY_FUNNEL, FunnelBoard } from '@/components/ads/funnel';
import type { FunnelCounts } from '@/components/ads/funnel';
import { AdsShell } from '@/components/crm/ads-shell';
import { HairlinePanel } from '@/components/surface/hairline-panel';
import { KpiMeter } from '@/components/surface/kpi-meter';
import { SurfaceHeader } from '@/components/surface/surface-header';
import { Badge } from '@/components/ui/badge';
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
            <div className="flex-1 space-y-5 p-6">
                <SurfaceHeader
                    title="Attribution"
                    description="Full-funnel performance from Meta spend through CRM outcomes."
                >
                    <Badge variant={meta.connected ? 'default' : 'secondary'}>
                        {meta.connected ? 'Meta connected' : 'Demo data'}
                    </Badge>
                </SurfaceHeader>

                <KpiMeter
                    items={[
                        { label: 'Spend (Meta)', value: formatDzd(totals.spend_cents) },
                        { label: 'Impressions (Meta)', value: totals.impressions.toLocaleString() },
                        { label: 'Clicks (Meta)', value: totals.clicks.toLocaleString() },
                        {
                            label: 'Leads (CRM)',
                            value: String(totals.conversations + totals.form_leads),
                        },
                        { label: 'Won (CRM)', value: String(totals.won) },
                        {
                            label: 'ROAS (calc)',
                            value: totals.roas == null ? 'Not enough data' : `${totals.roas}x`,
                        },
                    ]}
                />

                {meta.reason ? (
                    <HairlinePanel className="px-4 py-3">
                        <p className="aurora-text-body-sm text-mute">{meta.reason}</p>
                    </HairlinePanel>
                ) : null}

                {campaigns.length === 0 ? (
                    <HairlinePanel className="px-4 py-6">
                        <p className="aurora-text-body-sm text-mute">
                            No campaigns yet. Connect Meta and sync from the{' '}
                            <Link href="/ads" className="font-medium text-brand hover:underline">
                                Ads overview
                            </Link>
                            .
                        </p>
                    </HairlinePanel>
                ) : (
                    <div className="grid gap-3 xl:grid-cols-2">
                        {campaigns.map((campaign) => {
                            const funnel = funnels[campaign.id] ?? EMPTY_FUNNEL;

                            return (
                            <HairlinePanel key={campaign.id} className="space-y-3 p-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Link
                                        href={`/ads/campaigns/${campaign.id}`}
                                        className="aurora-text-body-sm font-medium text-brand hover:underline"
                                    >
                                        {campaign.name}
                                    </Link>
                                    <Badge variant="secondary">{kindOf(campaign)}</Badge>
                                    <Badge variant={campaign.status === 'active' ? 'default' : 'outline'}>
                                        {campaign.status}
                                    </Badge>
                                    <span className="aurora-text-caption ms-auto text-mute">
                                        {campaign.account?.name ?? '-'}
                                    </span>
                                </div>
                                <FunnelBoard funnel={funnel} compact />
                                <p className="aurora-text-caption text-mute">
                                    Spend {formatDzd(funnel.spend_cents)} ·{' '}
                                    {funnel.cpl_cents == null
                                        ? 'CPL unavailable'
                                        : `CPL ${formatDzd(funnel.cpl_cents)}`}{' '}
                                    ·{' '}
                                    {funnel.roas == null ? 'ROAS unavailable' : `ROAS ${funnel.roas}x`} ·{' '}
                                    {campaign.ad_sets_count} ad sets
                                    {campaign.daily_budget_cents > 0
                                        ? ` · budget ${formatDzd(campaign.daily_budget_cents)}/day`
                                        : ''}
                                </p>
                            </HairlinePanel>
                            );
                        })}
                    </div>
                )}
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
