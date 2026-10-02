import type { AdsCampaignKindInput } from '@/evo/ads/types';
import type { BadgeTone } from '@/evo/ui/badge';

export function campaignKind(campaign: AdsCampaignKindInput): string {
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

export function campaignStatusTone(status: string): BadgeTone {
    const value = status.toLowerCase();

    if (value === 'active' || value === 'enabled') {
        return 'success';
    }

    if (value === 'paused' || value === 'demo') {
        return 'warn';
    }

    if (value === 'deleted' || value === 'archived' || value === 'error') {
        return 'error';
    }

    return 'neutral';
}

export function matchesAdsView(status: string, view: string): boolean {
    if (view === 'active') {
        return status.toLowerCase() === 'active';
    }

    if (view === 'paused') {
        return status.toLowerCase() === 'paused';
    }

    return true;
}

export function matchesSearch(haystack: string, query: string): boolean {
    if (query.trim() === '') {
        return true;
    }

    return haystack.toLocaleLowerCase('fr-DZ').includes(query.trim().toLocaleLowerCase('fr-DZ'));
}
