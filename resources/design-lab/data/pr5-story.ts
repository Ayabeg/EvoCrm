/**
 * PR5 seed overlay. Does not mutate generated demo arrays.
 * Story: Clinique El Djazair · Équipement bloc opératoire · 1 280 000 DA · quote v2.
 */

import { formatMoney } from '@/evo/lib/format';
import { getKnownObjects } from './selectors';

export const PR5_STORY = {
    title: 'Équipement bloc opératoire',
    company: 'Clinique El Djazair',
    contact: 'Amine Benali',
    owner: 'Sofia Kaci',
    amountDzd: 1_280_000,
    amountCents: 128_000_000,
    quoteVersion: 2,
    stage: 'proposition',
    quoteNumber: 'DV-2026-0047-v2',
} as const;

export function getPr5Story() {
    const known = getKnownObjects().cliniqueElDjazair;

    return {
        ...PR5_STORY,
        amountLabel: formatMoney(PR5_STORY.amountDzd),
        companyRecord: known.company,
        contactRecord: known.contact,
        sourceDeal: known.deal,
        sourceQuote: known.quote,
        items: [
            { name: 'Scialytique LED', quantity: 1, unitDzd: 780_000 },
            { name: 'Table d’opération', quantity: 1, unitDzd: 500_000 },
        ],
        stages: [
            { id: 'nouveau', label: 'Nouveau', value: 3_200_000 },
            { id: 'qualification', label: 'Qualification', value: 2_400_000 },
            { id: 'proposition', label: 'Proposition', value: 1_280_000 },
            { id: 'negociation', label: 'Négociation', value: 860_000 },
            { id: 'gagne', label: 'Gagné', value: 0 },
        ],
    };
}
