export type AdsFunnelCounts = {
    impressions: number;
    clicks: number;
    reach?: number;
    spend_cents: number;
    conversations: number;
    form_leads: number;
    qualified: number;
    deals: number;
    won: number;
    revenue_cents?: number;
    ctr?: number | null;
    cpc_cents?: number | null;
    cpm_cents?: number | null;
    cpl_cents?: number | null;
    cpql_cents?: number | null;
    cac_cents?: number | null;
    roas?: number | null;
    revenue_per_lead_cents?: number | null;
};

export const EMPTY_ADS_FUNNEL: AdsFunnelCounts = {
    impressions: 0,
    clicks: 0,
    reach: 0,
    spend_cents: 0,
    conversations: 0,
    form_leads: 0,
    qualified: 0,
    deals: 0,
    won: 0,
    revenue_cents: 0,
    ctr: null,
    cpc_cents: null,
    cpm_cents: null,
    cpl_cents: null,
    cpql_cents: null,
    cac_cents: null,
    roas: null,
    revenue_per_lead_cents: null,
};

export type AdsMetaStatus = {
    connected: boolean;
    reason?: string | null;
    connect_url?: string | null;
};

export type AdsCampaignKindInput = {
    click_to_whatsapp?: boolean;
    lead_form?: boolean;
};

export type AdsListViewId = 'all' | 'active' | 'paused';
