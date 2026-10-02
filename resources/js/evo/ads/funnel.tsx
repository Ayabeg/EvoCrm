import type { AdsFunnelCounts } from '@/evo/ads/types';
import { FunnelChart } from '@/evo/charts';
import { t } from '@/lib/i18n';

export function adsFunnelSteps(funnel: AdsFunnelCounts) {
    return [
        { id: 'impressions', label: t('Impressions'), value: funnel.impressions },
        { id: 'clicks', label: t('Clicks'), value: funnel.clicks },
        {
            id: 'leads',
            label: t('Conversations / Leads'),
            value: funnel.conversations + funnel.form_leads,
            hint: t(':ctwa CTWA · :forms form', {
                ctwa: funnel.conversations,
                forms: funnel.form_leads,
            }),
        },
        { id: 'qualified', label: t('Qualified'), value: funnel.qualified },
        { id: 'deals', label: t('Deals'), value: funnel.deals },
        { id: 'won', label: t('Won'), value: funnel.won },
    ];
}

export function AdsFunnel({
    funnel,
    compact = false,
}: {
    funnel: AdsFunnelCounts;
    compact?: boolean;
}) {
    return <FunnelChart steps={adsFunnelSteps(funnel)} compact={compact} />;
}
