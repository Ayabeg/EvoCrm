import { Link } from '@inertiajs/react';

import {
    AdsAttributionSankey,
    AdsFunnel,
    AdsPageHeader,
    AdsShell,
    EMPTY_ADS_FUNNEL,
    campaignKind,
    campaignStatusTone,
} from '@/evo/ads';
import type { AdsFunnelCounts, AdsMetaStatus } from '@/evo/ads';
import { formatMoneyFromCents, formatNumber } from '@/evo/lib/format';
import { EmptyState } from '@/evo/patterns/empty-state';
import { CrmKpiStrip } from '@/evo/patterns/kpi';
import { Badge } from '@/evo/ui/badge';
import { Card, CardContent } from '@/evo/ui/card';
import { Status } from '@/evo/ui/status';
import { t } from '@/lib/i18n';

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
    funnels: Record<number, AdsFunnelCounts>;
    totals: AdsFunnelCounts;
    meta: AdsMetaStatus;
};

export default function AdsAttribution({ campaigns, funnels, totals, meta }: Props) {
    return (
        <AdsShell title="Attribution">
            <div className="flex-1 space-y-5 p-6">
                <AdsPageHeader
                    title="Attribution"
                    description="Full-funnel performance from Meta spend through CRM outcomes."
                    actions={
                        <Badge tone={meta.connected ? 'success' : 'neutral'} fill="soft">
                            {t(meta.connected ? 'Meta connected' : 'Demo data')}
                        </Badge>
                    }
                />

                <CrmKpiStrip
                    columns={6}
                    kpis={[
                        { key: 'spend', label: t('Spend (Meta)'), value: formatMoneyFromCents(totals.spend_cents) },
                        {
                            key: 'impressions',
                            label: t('Impressions (Meta)'),
                            value: formatNumber(totals.impressions),
                        },
                        { key: 'clicks', label: t('Clicks (Meta)'), value: formatNumber(totals.clicks) },
                        {
                            key: 'leads',
                            label: t('Leads (CRM)'),
                            value: formatNumber(totals.conversations + totals.form_leads),
                        },
                        { key: 'won', label: t('Won (CRM)'), value: formatNumber(totals.won) },
                        {
                            key: 'roas',
                            label: t('ROAS (calc)'),
                            value: totals.roas == null ? t('Not enough data') : `${totals.roas}x`,
                        },
                    ]}
                />

                {meta.reason ? (
                    <p className="text-[13px] text-[var(--evo-ink-secondary)]">{meta.reason}</p>
                ) : null}

                {campaigns.length === 0 ? (
                    <EmptyState
                        title={t('No campaigns yet')}
                        description={
                            <>
                                {t('Connect Meta and sync from the')}{' '}
                                <Link href="/ads" className="font-medium text-[var(--evo-teal)] hover:underline">
                                    {t('Ads overview')}
                                </Link>
                                .
                            </>
                        }
                        density="panel"
                    />
                ) : (
                    <>
                        <Card>
                            <CardContent className="pt-4">
                                <AdsAttributionSankey campaigns={campaigns} funnels={funnels} />
                            </CardContent>
                        </Card>

                        <div className="grid gap-3 xl:grid-cols-2">
                            {campaigns.map((campaign) => {
                                const funnel = funnels[campaign.id] ?? EMPTY_ADS_FUNNEL;

                                return (
                                    <Card key={campaign.id}>
                                        <CardContent className="space-y-3 pt-4">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Link
                                                    href={`/ads/campaigns/${campaign.id}`}
                                                    className="text-[13px] font-medium text-[var(--evo-teal)] hover:underline"
                                                >
                                                    {campaign.name}
                                                </Link>
                                                <Badge variant="secondary">{t(campaignKind(campaign))}</Badge>
                                                <Status
                                                    tone={campaignStatusTone(campaign.status)}
                                                    label={campaign.status}
                                                />
                                                <span className="ms-auto text-[11px] text-[var(--evo-ink-muted)]">
                                                    {campaign.account?.name ?? '—'}
                                                </span>
                                            </div>
                                            <AdsFunnel funnel={funnel} compact />
                                            <p className="text-[11px] text-[var(--evo-ink-muted)]">
                                                {t('Spend')} {formatMoneyFromCents(funnel.spend_cents)} ·{' '}
                                                {funnel.cpl_cents == null
                                                    ? t('CPL unavailable')
                                                    : `${t('CPL')} ${formatMoneyFromCents(funnel.cpl_cents)}`}{' '}
                                                ·{' '}
                                                {funnel.roas == null
                                                    ? t('ROAS unavailable')
                                                    : `${t('ROAS')} ${funnel.roas}x`}{' '}
                                                · {campaign.ad_sets_count} {t('ad sets')}
                                                {campaign.daily_budget_cents > 0
                                                    ? ` · ${t('budget')} ${formatMoneyFromCents(campaign.daily_budget_cents)}/${t('day')}`
                                                    : ''}
                                            </p>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </>
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
