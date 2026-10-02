import { describe, expect, it } from 'vitest';
import { ATTRIBUTION_SANKEY_STAGES, attributionSankeyFromFunnels } from './sankey';
import { EMPTY_ADS_FUNNEL } from './types';

describe('attributionSankeyFromFunnels', () => {
    it('routes campaign leads into the shared CRM stages', () => {
        const data = attributionSankeyFromFunnels(
            [
                { id: 1, name: 'WA Cliniques Alger' },
                { id: 2, name: 'Retargeting Devis' },
            ],
            {
                1: {
                    ...EMPTY_ADS_FUNNEL,
                    conversations: 4,
                    form_leads: 5,
                    qualified: 6,
                    deals: 3,
                    won: 1,
                },
                2: {
                    ...EMPTY_ADS_FUNNEL,
                    form_leads: 3,
                    qualified: 2,
                    deals: 1,
                    won: 0,
                },
            },
        );

        expect(data.nodes.map((node) => node.name)).toEqual([
            'WA Cliniques Alger',
            'Retargeting Devis',
            ATTRIBUTION_SANKEY_STAGES.leads,
            ATTRIBUTION_SANKEY_STAGES.qualified,
            ATTRIBUTION_SANKEY_STAGES.deals,
            ATTRIBUTION_SANKEY_STAGES.won,
        ]);

        expect(data.links).toContainEqual({ source: 0, target: 2, value: 9 });
        expect(data.links).toContainEqual({ source: 1, target: 2, value: 3 });
        expect(data.links).toContainEqual({ source: 2, target: 3, value: 8 });
        expect(data.links).toContainEqual({ source: 3, target: 4, value: 4 });
        expect(data.links).toContainEqual({ source: 4, target: 5, value: 1 });
    });
});
