import {
    KNOWN_OBJECT_IDS,
    activities,
    campaigns,
    companies,
    contacts,
    conversations,
    dailyAdPerformance,
    deals,
    goals,
    leads,
    outboundSequences,
    owners,
    quotes,
} from './evocrm-demo-data';
import type {Campaign, Company, Contact, Conversation, Deal, DealStage, LeadSource, Quote} from './evocrm-demo-data';

export const STAGE_LABELS: Record<DealStage, string> = {
    nouveau: 'Nouveau',
    qualification: 'Qualification',
    proposition: 'Proposition',
    negociation: 'Négociation',
    gagne: 'Gagné',
    perdu: 'Perdu',
};

export const SOURCE_LABELS: Record<LeadSource, string> = {
    whatsapp: 'WhatsApp',
    site_web: 'Site web',
    instagram: 'Instagram',
    recommandation: 'Recommandation',
    email: 'Email',
    autres: 'Autres',
};

export const QUOTE_STATUS_LABELS = {
    en_attente: 'En attente',
    accepte: 'Accepté',
    refuse: 'Refusé',
    expire: 'Expiré',
} as const;

export function getOwner(id: string) {
    const owner = owners.find((row) => row.id === id);

    if (!owner) {
        throw new Error(`Unknown owner: ${id}`);
    }

    return owner;
}

export function getCompany(id: string): Company {
    const company = companies.find((row) => row.id === id);

    if (!company) {
        throw new Error(`Unknown company: ${id}`);
    }

    return company;
}

export function getContact(id: string): Contact {
    const contact = contacts.find((row) => row.id === id);

    if (!contact) {
        throw new Error(`Unknown contact: ${id}`);
    }

    return contact;
}

export function getDeal(id: string): Deal {
    const deal = deals.find((row) => row.id === id);

    if (!deal) {
        throw new Error(`Unknown deal: ${id}`);
    }

    return deal;
}

export function getQuote(id: string): Quote {
    const quote = quotes.find((row) => row.id === id);

    if (!quote) {
        throw new Error(`Unknown quote: ${id}`);
    }

    return quote;
}

export function getCampaign(id: string): Campaign {
    const campaign = campaigns.find((row) => row.id === id);

    if (!campaign) {
        throw new Error(`Unknown campaign: ${id}`);
    }

    return campaign;
}

export function getOpenDeals(): Deal[] {
    return deals.filter((deal) => deal.status === 'open');
}

export function getWonDeals(): Deal[] {
    return deals
        .filter((deal) => deal.status === 'won')
        .slice()
        .sort((a, b) => (a.wonAt ?? '').localeCompare(b.wonAt ?? ''));
}

export function getLostDeals(): Deal[] {
    return deals.filter((deal) => deal.status === 'lost');
}

export function getClosedDeals(): Deal[] {
    return deals.filter((deal) => deal.status === 'won' || deal.status === 'lost');
}

export function getTotalOpenPipeline(): number {
    return getOpenDeals().reduce((sum, deal) => sum + deal.value, 0);
}

export function getOpenDealCount(): number {
    return getOpenDeals().length;
}

export function getWonRevenue(): number {
    return getWonDeals().reduce((sum, deal) => sum + deal.value, 0);
}

export function getConversionRate(): number {
    const closed = getClosedDeals().length;

    if (closed === 0) {
        return 0;
    }

    return Math.round((100 * getWonDeals().length) / closed);
}

export function getQuoteTotals() {
    const pending = quotes.filter((quote) => quote.status === 'en_attente');

    return {
        sent: quotes.length,
        pending: pending.length,
        pendingValue: pending.reduce((sum, quote) => sum + quote.value, 0),
        accepted: quotes.filter((quote) => quote.status === 'accepte').length,
        refused: quotes.filter((quote) => quote.status === 'refuse').length,
        expired: quotes.filter((quote) => quote.status === 'expire').length,
    };
}

export function getLeadSourceTotals() {
    const sources: LeadSource[] = [
        'whatsapp',
        'site_web',
        'instagram',
        'recommandation',
        'email',
        'autres',
    ];

    return sources.map((source) => ({
        source,
        label: SOURCE_LABELS[source],
        count: leads.filter((lead) => lead.source === source).length,
        adCount: leads.filter((lead) => lead.source === source && lead.sourceCampaignId).length,
    }));
}

export function getAdLeadCount(): number {
    return leads.filter((lead) => lead.sourceCampaignId !== null).length;
}

export function displayedRoas(attributedRevenue: number, spend: number): number {
    if (spend === 0) {
        return 0;
    }

    return Math.round((10 * attributedRevenue) / spend) / 10;
}

export function exactRoas(attributedRevenue: number, spend: number): number {
    if (spend === 0) {
        return 0;
    }

    return attributedRevenue / spend;
}

export function getCampaignTotals() {
    return campaigns.map((campaign) => {
        const campaignDeals = deals.filter((deal) => deal.sourceCampaignId === campaign.id);
        const campaignLeads = leads.filter((lead) => lead.sourceCampaignId === campaign.id);
        const daily = dailyAdPerformance.filter((row) => row.campaignId === campaign.id);
        const spend = daily.reduce((sum, row) => sum + row.spend, 0);
        const attributedRevenue = campaignDeals.reduce((sum, deal) => sum + deal.value, 0);

        return {
            id: campaign.id,
            name: campaign.name,
            channel: campaign.channel,
            spend,
            impressions: daily.reduce((sum, row) => sum + row.impressions, 0),
            clicks: daily.reduce((sum, row) => sum + row.clicks, 0),
            leads: campaignLeads.length,
            deals: campaignDeals.length,
            attributedRevenue,
            roas: displayedRoas(attributedRevenue, spend),
            exactRoas: exactRoas(attributedRevenue, spend),
        };
    });
}

export function getAdsTotals() {
    const campaignRows = getCampaignTotals();
    const spend = campaignRows.reduce((sum, row) => sum + row.spend, 0);
    const attributedRevenue = campaignRows.reduce((sum, row) => sum + row.attributedRevenue, 0);

    return {
        spend,
        leadsInbox: getAdLeadCount(),
        deals: deals.filter((deal) => deal.sourceCampaignId !== null).length,
        attributedRevenue,
        impressions: campaignRows.reduce((sum, row) => sum + row.impressions, 0),
        clicks: campaignRows.reduce((sum, row) => sum + row.clicks, 0),
        exactRoas: exactRoas(attributedRevenue, spend),
        displayedRoas: displayedRoas(attributedRevenue, spend),
    };
}

export function getDailyAdPerformance() {
    const byDate = new Map<
        string,
        { date: string; spend: number; leads: number; impressions: number; clicks: number }
    >();

    for (const row of dailyAdPerformance) {
        const current = byDate.get(row.date) ?? {
            date: row.date,
            spend: 0,
            leads: 0,
            impressions: 0,
            clicks: 0,
        };

        current.spend += row.spend;
        current.leads += row.leads;
        current.impressions += row.impressions;
        current.clicks += row.clicks;
        byDate.set(row.date, current);
    }

    return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function getDailyAdPerformanceForCampaign(campaignId: string | null) {
    if (!campaignId) {
        return getDailyAdPerformance();
    }

    return dailyAdPerformance
        .filter((row) => row.campaignId === campaignId)
        .map((row) => ({
            date: row.date,
            spend: row.spend,
            leads: row.leads,
            impressions: row.impressions,
            clicks: row.clicks,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

export function getCumulativeWonRevenue() {
    const wonByDate = new Map<string, { won: number; dealIds: string[] }>();

    for (const deal of getWonDeals()) {
        const date = deal.wonAt ?? deal.closedAt ?? deal.createdAt;
        const current = wonByDate.get(date) ?? { won: 0, dealIds: [] };

        current.won += deal.value;
        current.dealIds.push(deal.id);
        wonByDate.set(date, current);
    }

    const days = Array.from({ length: 30 }, (_, index) => {
        return `2026-09-${String(index + 1).padStart(2, '0')}`;
    });

    let running = 0;

    return days.map((date) => {
        const day = wonByDate.get(date);
        const won = day?.won ?? 0;

        running += won;

        return {
            date,
            dealIds: day?.dealIds ?? [],
            won,
            cumulative: running,
        };
    });
}

export function getPipelineByStage() {
    const order: DealStage[] = [
        'nouveau',
        'qualification',
        'proposition',
        'negociation',
    ];

    return order.map((stage) => {
        const stageDeals = getOpenDeals().filter((deal) => deal.stage === stage);

        return {
            stage,
            label: STAGE_LABELS[stage],
            count: stageDeals.length,
            pipeline: stageDeals.reduce((sum, deal) => sum + deal.value, 0),
        };
    });
}

export function getAdsFunnel() {
    const ads = getAdsTotals();
    const won = getWonDeals().length;
    const steps = [
        { step: 'Impressions', value: ads.impressions, group: 'top' as const },
        { step: 'Clics', value: ads.clicks, group: 'top' as const },
        { step: 'Leads Inbox', value: ads.leadsInbox, group: 'bottom' as const },
        { step: 'Deals', value: ads.deals, group: 'bottom' as const },
        { step: 'Gagnés (période)', value: won, group: 'bottom' as const },
    ];

    return steps.map((row, index) => {
        const previous = steps[index - 1];
        const conversionFromPrevious =
            previous && previous.value > 0 ? row.value / previous.value : null;

        return {
            ...row,
            conversionFromPrevious,
        };
    });
}


export function getLeadSourceChartRows() {
    return getLeadSourceTotals().map((row) => ({
        source: row.label,
        leads: row.count,
    }));
}

export function getDealsForContact(contactId: string): Deal[] {
    return deals.filter((deal) => deal.contactId === contactId);
}

export function getQuotesForDeal(dealId: string): Quote[] {
    return quotes.filter((quote) => quote.dealId === dealId);
}

export function getQuotesForContact(contactId: string): Quote[] {
    return quotes.filter((quote) => quote.contactId === contactId);
}

export function getConversationForContact(contactId: string): Conversation | undefined {
    return conversations.find((row) => row.contactId === contactId);
}

export function getActivitiesForDeal(dealId: string) {
    return activities.filter((row) => row.dealId === dealId);
}

export function getKnownObjects() {
    const clinique = getCompany(KNOWN_OBJECT_IDS.companyCliniqueElDjazair);
    const amine = getContact(KNOWN_OBJECT_IDS.contactAmineBenali);
    const modernisation = getDeal(KNOWN_OBJECT_IDS.dealModernisationCrm);
    const devis = getQuote(KNOWN_OBJECT_IDS.quoteDv20260047);
    const hopital = getCompany(KNOWN_OBJECT_IDS.companyHopitalIbnSina);
    const lina = getContact(KNOWN_OBJECT_IDS.contactLinaHaddad);
    const crmSupport = getDeal(KNOWN_OBJECT_IDS.dealCrmSupport);
    const cabinet = getCompany(KNOWN_OBJECT_IDS.companyCabinetDrAmrani);
    const samir = getContact(KNOWN_OBJECT_IDS.contactSamirBelkacem);
    const digitalisation = getDeal(KNOWN_OBJECT_IDS.dealDigitalisation);
    const pharmacie = getCompany(KNOWN_OBJECT_IDS.companyPharmacieCentrale);
    const karim = getContact(KNOWN_OBJECT_IDS.contactKarimMansouri);
    const solution = getDeal(KNOWN_OBJECT_IDS.dealSolutionCommerciale);

    return {
        cliniqueElDjazair: {
            company: clinique,
            contact: amine,
            deal: modernisation,
            quote: devis,
        },
        hopitalIbnSina: {
            company: hopital,
            contact: lina,
            deal: crmSupport,
        },
        cabinetDrAmrani: {
            company: cabinet,
            contact: samir,
            deal: digitalisation,
        },
        pharmacieCentrale: {
            company: pharmacie,
            contact: karim,
            deal: solution,
        },
    };
}

export function getGoalProgress() {
    const ads = getAdsTotals();
    const quoteTotals = getQuoteTotals();

    return goals.map((goal) => {
        const current =
            goal.metric === 'won_revenue'
                ? getWonRevenue()
                : goal.metric === 'open_pipeline'
                    ? getTotalOpenPipeline()
                    : goal.metric === 'ads_roas'
                        ? ads.displayedRoas
                        : quoteTotals.sent;

        return {
            ...goal,
            current,
            ratio: goal.target === 0 ? 0 : current / goal.target,
        };
    });
}

export function getSankeyDealFlow() {
    const nodes = [
        { name: 'WA Cliniques Alger' },
        { name: 'Devis CRM Santé' },
        { name: 'Retargeting Devis' },
        { name: 'Prospecting Oran' },
        { name: 'Sources organiques' },
        { name: 'Pipeline ouvert' },
        { name: 'Gagné' },
        { name: 'Perdu' },
    ];
    const index = Object.fromEntries(nodes.map((node, i) => [node.name, i]));
    const links: { source: number; target: number; value: number }[] = [];

    function addLink(sourceName: string, targetName: string, value: number) {
        if (value <= 0) {
            return;
        }

        links.push({
            source: index[sourceName],
            target: index[targetName],
            value,
        });
    }

    for (const campaign of getCampaignTotals()) {
        const campaignDeals = deals.filter((deal) => deal.sourceCampaignId === campaign.id);
        addLink(
            campaign.name,
            'Pipeline ouvert',
            campaignDeals.filter((deal) => deal.status === 'open').reduce((sum, deal) => sum + deal.value, 0),
        );
        addLink(
            campaign.name,
            'Gagné',
            campaignDeals.filter((deal) => deal.status === 'won').reduce((sum, deal) => sum + deal.value, 0),
        );
        addLink(
            campaign.name,
            'Perdu',
            campaignDeals.filter((deal) => deal.status === 'lost').reduce((sum, deal) => sum + deal.value, 0),
        );
    }

    const organic = deals.filter((deal) => deal.sourceCampaignId === null);
    addLink(
        'Sources organiques',
        'Pipeline ouvert',
        organic.filter((deal) => deal.status === 'open').reduce((sum, deal) => sum + deal.value, 0),
    );
    addLink(
        'Sources organiques',
        'Gagné',
        organic.filter((deal) => deal.status === 'won').reduce((sum, deal) => sum + deal.value, 0),
    );
    addLink(
        'Sources organiques',
        'Perdu',
        organic.filter((deal) => deal.status === 'lost').reduce((sum, deal) => sum + deal.value, 0),
    );

    return { nodes, links };
}

export function getInboxConversations(): Conversation[] {
    return conversations
        .slice()
        .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
}

export function getOpenActivities() {
    return activities
        .filter((row) => row.status === 'open')
        .slice()
        .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
}

export function getOutboundSequences() {
    return outboundSequences;
}

export function getAllContacts(): Contact[] {
    return contacts
        .slice()
        .sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, 'fr'));
}

export function getAllDeals(): Deal[] {
    return deals.slice().sort((a, b) => b.value - a.value);
}

export function getAllQuotes(): Quote[] {
    return quotes.slice().sort((a, b) => b.sentAt.localeCompare(a.sentAt));
}
