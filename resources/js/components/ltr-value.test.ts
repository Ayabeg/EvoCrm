import { describe, expect, it } from 'vitest';
import { looksLikeLtrValue, shouldIsolateColumn } from './ltr-value';

describe('LtrValue helpers', () => {
    it('treats phones, emails, IDs, URLs, and DA amounts as isolated', () => {
        expect(looksLikeLtrValue('+213 550 10 00 02')).toBe(true);
        expect(looksLikeLtrValue('amine@clinic.dz')).toBe(true);
        expect(looksLikeLtrValue('DV-2026-0047')).toBe(true);
        expect(looksLikeLtrValue('CAMP-0042')).toBe(true);
        expect(looksLikeLtrValue('https://evocrm.dz')).toBe(true);
        expect(looksLikeLtrValue('1 280 000 DA')).toBe(true);
        expect(looksLikeLtrValue('Clinique El Djazair')).toBe(false);
        expect(shouldIsolateColumn('phone')).toBe(true);
        expect(shouldIsolateColumn('email')).toBe(true);
        expect(shouldIsolateColumn('amount')).toBe(true);
        expect(shouldIsolateColumn('name')).toBe(false);
    });
});
