import { EMPTY_ADS_FUNNEL } from '@/evo/ads/types';
import type { AdsFunnelCounts } from '@/evo/ads/types';
import type { SankeyChartData } from '@/evo/charts';

export type AttributionCampaign = {
    id: number | string;
    name: string;
};

const STAGE_LEADS = 'Leads (CRM)';
const STAGE_QUALIFIED = 'Qualified';
const STAGE_DEALS = 'Deals';
const STAGE_WON = 'Won';

export function attributionSankeyFromFunnels(
    campaigns: AttributionCampaign[],
    funnels: Record<string | number, AdsFunnelCounts>,
): SankeyChartData {
    const nodes = [
        ...campaigns.map((campaign) => ({ name: campaign.name })),
        { name: STAGE_LEADS },
        { name: STAGE_QUALIFIED },
        { name: STAGE_DEALS },
        { name: STAGE_WON },
    ];
    const leadsIndex = campaigns.length;
    const qualifiedIndex = leadsIndex + 1;
    const dealsIndex = leadsIndex + 2;
    const wonIndex = leadsIndex + 3;
    const links: SankeyChartData['links'] = [];

    let qualified = 0;
    let deals = 0;
    let won = 0;

    campaigns.forEach((campaign, index) => {
        const funnel = funnels[campaign.id] ?? EMPTY_ADS_FUNNEL;
        const campaignLeads = funnel.conversations + funnel.form_leads;

        qualified += funnel.qualified;
        deals += funnel.deals;
        won += funnel.won;

        if (campaignLeads > 0) {
            links.push({ source: index, target: leadsIndex, value: campaignLeads });
        }
    });

    if (qualified > 0) {
        links.push({ source: leadsIndex, target: qualifiedIndex, value: qualified });
    }

    if (deals > 0) {
        links.push({ source: qualifiedIndex, target: dealsIndex, value: deals });
    }

    if (won > 0) {
        links.push({ source: dealsIndex, target: wonIndex, value: won });
    }

    if (links.length === 0 && campaigns.length > 0) {
        links.push({ source: 0, target: leadsIndex, value: 0.01 });
    }

    return { nodes, links: links.filter((link) => link.value > 0) };
}

export const ATTRIBUTION_SANKEY_STAGES = {
    leads: STAGE_LEADS,
    qualified: STAGE_QUALIFIED,
    deals: STAGE_DEALS,
    won: STAGE_WON,
} as const;
