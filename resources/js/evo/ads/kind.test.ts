import { describe, expect, it } from 'vitest';
import { campaignKind, campaignStatusTone, matchesAdsView, matchesSearch } from './kind';

describe('campaignKind', () => {
    it('keeps Meta product names', () => {
        expect(campaignKind({ click_to_whatsapp: true, lead_form: true })).toBe('CTWA + Lead form');
        expect(campaignKind({ click_to_whatsapp: true })).toBe('Click-to-WhatsApp');
        expect(campaignKind({ lead_form: true })).toBe('Lead form');
        expect(campaignKind({})).toBe('Traffic');
    });
});

describe('campaignStatusTone', () => {
    it('maps active to success and paused to warn', () => {
        expect(campaignStatusTone('active')).toBe('success');
        expect(campaignStatusTone('paused')).toBe('warn');
        expect(campaignStatusTone('draft')).toBe('neutral');
    });
});

describe('list filters', () => {
    it('filters views and search without changing source rows', () => {
        expect(matchesAdsView('active', 'active')).toBe(true);
        expect(matchesAdsView('paused', 'active')).toBe(false);
        expect(matchesSearch('WA Cliniques Alger', 'cliniques')).toBe(true);
        expect(matchesSearch('Prospecting Oran', 'alger')).toBe(false);
    });
});
