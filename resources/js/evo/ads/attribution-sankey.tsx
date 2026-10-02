import { attributionSankeyFromFunnels } from '@/evo/ads/sankey';
import type { AdsFunnelCounts } from '@/evo/ads/types';
import { ChartFrame, SankeyChart } from '@/evo/charts';
import { formatNumber } from '@/evo/lib/format';
import { t } from '@/lib/i18n';

export function AdsAttributionSankey({
    campaigns,
    funnels,
    empty,
    formatValue,
}: {
    campaigns: Array<{ id: number | string; name: string }>;
    funnels?: Record<string | number, AdsFunnelCounts>;
    empty?: boolean;
    formatValue?: (value: number) => string;
}) {
    const raw = funnels
        ? attributionSankeyFromFunnels(campaigns, funnels)
        : { nodes: campaigns.map((campaign) => ({ name: campaign.name })), links: [] };
    const data = {
        ...raw,
        nodes: raw.nodes.map((node) => ({ name: t(node.name) })),
    };

    return (
        <ChartFrame
            height={360}
            label={t('Attribution')}
            empty={empty || data.links.length === 0}
            emptyTitle={t('No campaigns yet')}
            emptyDescription={t('Connect Meta and sync from the Ads overview.')}
        >
            <SankeyChart data={data} height={360} formatValue={formatValue ?? formatNumber} />
        </ChartFrame>
    );
}
