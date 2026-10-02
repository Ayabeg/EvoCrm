import { describe, expect, it } from 'vitest';
import { formatMoney, formatPhone, WEEK_STARTS_ON } from '@/evo/lib/format';
import { getOutboundLabFixtures, PHARMACIE_QUOTE_DZD } from './outbound';

describe('outbound lab fixtures', () => {
    it('uses Pharmacie Centrale with fr-DZ money, +213 phone, Saturday week start', () => {
        const data = getOutboundLabFixtures();

        expect(data.company.name).toBe('Pharmacie Centrale');
        expect(data.karim.firstName).toBe('Karim');
        expect(data.karim.phone).toBe('+213 555 448 671');
        expect(formatPhone(data.karim.phone)).toContain('213');
        expect(PHARMACIE_QUOTE_DZD).toBe(1_280_000);
        expect(formatMoney(PHARMACIE_QUOTE_DZD)).toMatch(/1\s280\s000\sDA/);
        expect(data.quote).toMatch(/1\s280\s000\sDA/);
        expect(WEEK_STARTS_ON).toBe(6);
        expect(data.steps[0].subject).toContain('Pharmacie Centrale');
    });
});
