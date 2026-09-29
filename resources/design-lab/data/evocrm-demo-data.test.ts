import { describe, expect, it } from 'vitest';
import {
    KNOWN_OBJECT_IDS,
    campaigns,
    contacts,
    deals,
    leads,
    quotes,
} from './evocrm-demo-data';
import {
    displayedRoas,
    exactRoas,
    getAdsTotals,
    getCampaignTotals,
    getClosedDeals,
    getCompany,
    getContact,
    getConversionRate,
    getDeal,
    getKnownObjects,
    getLeadSourceTotals,
    getLostDeals,
    getCumulativeWonRevenue,
    getOpenDealCount,
    getOpenDeals,
    getPipelineByStage,
    getQuote,
    getQuoteTotals,
    getSankeyDealFlow,
    getTotalOpenPipeline,
    getWonDeals,
    getWonRevenue,
} from './selectors';

describe('EvoCRM demo data integrity', () => {
    it('sums campaign spend to 420000 from daily rows', () => {
        const totals = getCampaignTotals();

        expect(totals.reduce((sum, row) => sum + row.spend, 0)).toBe(420000);
    });

    it('sums campaign leads to 86', () => {
        expect(getCampaignTotals().reduce((sum, row) => sum + row.leads, 0)).toBe(86);
        expect(getAdsTotals().leadsInbox).toBe(86);
    });

    it('sums campaign deals to 19', () => {
        expect(getCampaignTotals().reduce((sum, row) => sum + row.deals, 0)).toBe(19);
        expect(getAdsTotals().deals).toBe(19);
    });

    it('keeps owner-locked per-campaign deal counts 9 / 6 / 3 / 1', () => {
        const byName = Object.fromEntries(
            getCampaignTotals().map((row) => [row.name, row.deals]),
        );

        expect(byName['WA Cliniques Alger']).toBe(9);
        expect(byName['Devis CRM Santé']).toBe(6);
        expect(byName['Retargeting Devis']).toBe(3);
        expect(byName['Prospecting Oran']).toBe(1);
    });

    it('sums campaign attributed revenue to 820000', () => {
        expect(getCampaignTotals().reduce((sum, row) => sum + row.attributedRevenue, 0)).toBe(
            820000,
        );
        expect(getAdsTotals().attributedRevenue).toBe(820000);
    });

    it('keeps owner-locked per-campaign attributed revenue 432000 / 252000 / 112000 / 24000', () => {
        const byName = Object.fromEntries(
            getCampaignTotals().map((row) => [row.name, row.attributedRevenue]),
        );

        expect(byName['WA Cliniques Alger']).toBe(432000);
        expect(byName['Devis CRM Santé']).toBe(252000);
        expect(byName['Retargeting Devis']).toBe(112000);
        expect(byName['Prospecting Oran']).toBe(24000);
    });

    it('sums lead sources to 128', () => {
        const sources = getLeadSourceTotals();

        expect(sources.reduce((sum, row) => sum + row.count, 0)).toBe(128);
        expect(leads).toHaveLength(128);
    });

    it('maps the 86 ad leads as a subset of the 128 sources', () => {
        const sources = getLeadSourceTotals();
        const bySource = Object.fromEntries(sources.map((row) => [row.source, row]));

        expect(bySource.whatsapp.count).toBe(42);
        expect(bySource.whatsapp.adCount).toBe(42);
        expect(bySource.site_web.count).toBe(28);
        expect(bySource.site_web.adCount).toBe(28);
        expect(bySource.instagram.count).toBe(18);
        expect(bySource.instagram.adCount).toBe(12);
        expect(bySource.recommandation.count).toBe(16);
        expect(bySource.recommandation.adCount).toBe(0);
        expect(bySource.email.count).toBe(14);
        expect(bySource.email.adCount).toBe(0);
        expect(bySource.autres.count).toBe(10);
        expect(bySource.autres.adCount).toBe(4);
        expect(sources.reduce((sum, row) => sum + row.adCount, 0)).toBe(86);
    });

    it('computes won revenue as 1280000 from three won deals', () => {
        expect(getWonDeals()).toHaveLength(3);
        expect(getWonRevenue()).toBe(1280000);
    });

    it('computes quote totals from quote rows', () => {
        const totals = getQuoteTotals();

        expect(quotes).toHaveLength(42);
        expect(totals.sent).toBe(42);
        expect(totals.pending).toBe(12);
        expect(totals.pendingValue).toBe(1150000);
    });

    it('computes 25 open deals and 2550000 open pipeline', () => {
        expect(getOpenDealCount()).toBe(25);
        expect(getTotalOpenPipeline()).toBe(2550000);
    });

    it('gives the 21 leftover open deals 40000–80000 DA totaling 1260000', () => {
        const leftover = getOpenDeals().filter(
            (deal) =>
                deal.id !== KNOWN_OBJECT_IDS.dealModernisationCrm &&
                deal.id !== KNOWN_OBJECT_IDS.dealCrmSupport &&
                deal.id !== KNOWN_OBJECT_IDS.dealDigitalisation &&
                deal.id !== KNOWN_OBJECT_IDS.dealSolutionCommerciale,
        );

        expect(leftover).toHaveLength(21);
        expect(leftover.reduce((sum, deal) => sum + deal.value, 0)).toBe(1260000);

        for (const deal of leftover) {
            expect(deal.value).toBeGreaterThanOrEqual(40000);
            expect(deal.value).toBeLessThanOrEqual(80000);
        }
    });

    it('computes 17 closed deals as 3 won and 14 lost', () => {
        expect(getClosedDeals()).toHaveLength(17);
        expect(getWonDeals()).toHaveLength(3);
        expect(getLostDeals()).toHaveLength(14);
        expect(getLostDeals().every((deal) => deal.sourceCampaignId !== null)).toBe(true);
        expect(getWonDeals().every((deal) => deal.sourceCampaignId === null)).toBe(true);
    });

    it('keeps pipeline stages totaling 25 deals and 2550000 DA', () => {
        const stages = getPipelineByStage();
        const byStage = Object.fromEntries(stages.map((row) => [row.stage, row]));

        expect(stages.reduce((sum, row) => sum + row.count, 0)).toBe(25);
        expect(stages.reduce((sum, row) => sum + row.pipeline, 0)).toBe(2550000);
        expect(byStage.nouveau.count).toBe(7);
        expect(byStage.nouveau.pipeline).toBe(455000);
        expect(byStage.qualification.count).toBe(6);
        expect(byStage.qualification.pipeline).toBe(615000);
        expect(byStage.proposition.count).toBe(6);
        expect(byStage.proposition.pipeline).toBe(560000);
        expect(byStage.negociation.count).toBe(6);
        expect(byStage.negociation.pipeline).toBe(920000);
    });

    it('routes Sankey campaign membership into open / won / lost without leftover value', () => {
        const { links } = getSankeyDealFlow();
        const byPair = Object.fromEntries(
            links.map((link) => [`${link.source}->${link.target}`, link.value]),
        );

        expect(byPair['0->5']).toBe(320000);
        expect(byPair['0->7']).toBe(112000);
        expect(byPair['1->5']).toBe(180000);
        expect(byPair['1->7']).toBe(72000);
        expect(byPair['2->5']).toBe(60000);
        expect(byPair['2->7']).toBe(52000);
        expect(byPair['3->7']).toBe(24000);
        expect(byPair['4->5']).toBe(1990000);
        expect(byPair['4->6']).toBe(1280000);
        expect(links.some((link) => link.source === 3 && link.target === 5)).toBe(false);
        expect(links.reduce((sum, link) => sum + link.value, 0)).toBe(820000 + 1990000 + 1280000);
    });

    it('rounds conversion 3/17 to 18 percent', () => {
        expect(3 / 17).toBeCloseTo(0.17647, 5);
        expect(getConversionRate()).toBe(18);
    });

    it('computes each campaign ROAS as attributedRevenue / spend', () => {
        for (const row of getCampaignTotals()) {
            expect(row.exactRoas).toBeCloseTo(row.attributedRevenue / row.spend, 10);
            expect(row.roas).toBe(displayedRoas(row.attributedRevenue, row.spend));
        }

        const expected = [
            { name: 'WA Cliniques Alger', roas: 2.4 },
            { name: 'Devis CRM Santé', roas: 1.8 },
            { name: 'Retargeting Devis', roas: 1.6 },
            { name: 'Prospecting Oran', roas: 0.8 },
        ];

        for (const item of expected) {
            const row = getCampaignTotals().find((campaign) => campaign.name === item.name);

            expect(row?.roas).toBe(item.roas);
        }
    });

    it('displays overall ROAS as 2.0x from 820000 / 420000 = 1.95', () => {
        const ads = getAdsTotals();

        expect(ads.exactRoas).toBeCloseTo(820000 / 420000, 10);
        expect(ads.exactRoas).toBeCloseTo(1.95238, 5);
        expect(displayedRoas(820000, 420000)).toBe(2);
        expect(ads.displayedRoas).toBe(2);
        expect(exactRoas(820000, 420000)).toBeCloseTo(1.95, 2);
    });

    it('keeps the four known objects identical everywhere they are read', () => {
        const known = getKnownObjects();

        expect(known.cliniqueElDjazair.company).toEqual(
            getCompany(KNOWN_OBJECT_IDS.companyCliniqueElDjazair),
        );
        expect(known.cliniqueElDjazair.contact).toEqual(
            getContact(KNOWN_OBJECT_IDS.contactAmineBenali),
        );
        expect(known.cliniqueElDjazair.deal).toEqual(
            getDeal(KNOWN_OBJECT_IDS.dealModernisationCrm),
        );
        expect(known.cliniqueElDjazair.quote).toEqual(
            getQuote(KNOWN_OBJECT_IDS.quoteDv20260047),
        );

        expect(known.cliniqueElDjazair.company.name).toBe('Clinique El Djazair');
        expect(known.cliniqueElDjazair.contact.firstName).toBe('Amine');
        expect(known.cliniqueElDjazair.contact.lastName).toBe('Benali');
        expect(known.cliniqueElDjazair.deal.name).toBe('Modernisation CRM');
        expect(known.cliniqueElDjazair.deal.value).toBe(320000);
        expect(known.cliniqueElDjazair.deal.stage).toBe('qualification');
        expect(known.cliniqueElDjazair.deal.ownerId).toBe('owner-eo');
        expect(known.cliniqueElDjazair.deal.sourceCampaignId).toBe(
            'campaign-wa-cliniques-alger',
        );
        expect(known.cliniqueElDjazair.quote.number).toBe('DV-2026-0047');
        expect(known.cliniqueElDjazair.quote.status).toBe('en_attente');
        expect(known.cliniqueElDjazair.quote.value).toBe(320000);

        expect(known.hopitalIbnSina.company.name).toBe('Hôpital Ibn Sina');
        expect(known.hopitalIbnSina.contact.firstName).toBe('Lina');
        expect(known.hopitalIbnSina.contact.lastName).toBe('Haddad');
        expect(known.hopitalIbnSina.deal.name).toBe('CRM & Support');
        expect(known.hopitalIbnSina.deal.value).toBe(540000);
        expect(known.hopitalIbnSina.deal.stage).toBe('negociation');
        expect(known.hopitalIbnSina.deal.ownerId).toBe('owner-rc');

        expect(known.cabinetDrAmrani.company.name).toBe('Cabinet Dr. Amrani');
        expect(known.cabinetDrAmrani.contact.firstName).toBe('Samir');
        expect(known.cabinetDrAmrani.contact.lastName).toBe('Belkacem');
        expect(known.cabinetDrAmrani.deal.name).toBe('Digitalisation');
        expect(known.cabinetDrAmrani.deal.value).toBe(280000);
        expect(known.cabinetDrAmrani.deal.stage).toBe('proposition');
        expect(known.cabinetDrAmrani.deal.ownerId).toBe('owner-mt');

        expect(known.pharmacieCentrale.company.name).toBe('Pharmacie Centrale');
        expect(known.pharmacieCentrale.contact.firstName).toBe('Karim');
        expect(known.pharmacieCentrale.contact.lastName).toBe('Mansouri');
        expect(known.pharmacieCentrale.deal.name).toBe('Solution commerciale');
        expect(known.pharmacieCentrale.deal.value).toBe(150000);
        expect(known.pharmacieCentrale.deal.stage).toBe('negociation');
        expect(known.pharmacieCentrale.deal.ownerId).toBe('owner-sk');

        const amineFromList = contacts.find((row) => row.id === KNOWN_OBJECT_IDS.contactAmineBenali);
        const dealFromList = deals.find((row) => row.id === KNOWN_OBJECT_IDS.dealModernisationCrm);
        const quoteFromList = quotes.find((row) => row.id === KNOWN_OBJECT_IDS.quoteDv20260047);

        expect(amineFromList).toEqual(known.cliniqueElDjazair.contact);
        expect(dealFromList).toEqual(known.cliniqueElDjazair.deal);
        expect(quoteFromList).toEqual(known.cliniqueElDjazair.quote);
    });

    it('builds a 30-day cumulative CA series from the three won events', () => {
        const series = getCumulativeWonRevenue();

        expect(series).toHaveLength(30);
        expect(series[0]?.date).toBe('2026-09-01');
        expect(series[0]?.cumulative).toBe(0);
        expect(series[9]?.cumulative).toBe(0);
        expect(series[10]?.date).toBe('2026-09-11');
        expect(series[10]?.won).toBe(620000);
        expect(series[10]?.cumulative).toBe(620000);
        expect(series[17]?.date).toBe('2026-09-18');
        expect(series[17]?.won).toBe(460000);
        expect(series[17]?.cumulative).toBe(1080000);
        expect(series[24]?.date).toBe('2026-09-25');
        expect(series[24]?.won).toBe(200000);
        expect(series[29]?.date).toBe('2026-09-30');
        expect(series[29]?.cumulative).toBe(1280000);
    });

    it('does not treat campaign identity rows as the spend source of truth', () => {
        expect(campaigns).toHaveLength(4);
        expect(getCampaignTotals().map((row) => row.name)).toEqual([
            'WA Cliniques Alger',
            'Devis CRM Santé',
            'Retargeting Devis',
            'Prospecting Oran',
        ]);
    });
});
