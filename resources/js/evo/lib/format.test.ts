import { describe, expect, it } from 'vitest';
import {
    WEEK_STARTS_ON,
    WEEKEND_DAYS,
    formatDateTime,
    formatMoney,
    formatMoneyCompact,
    formatMoneyFromCents,
    formatPhone,
    formatTime,
    normalizePhone,
} from './format';

describe('evo/lib/format', () => {
    it('formats DZD as non-compact 1 280 000 DA by default', () => {
        const formatted = formatMoney(1_280_000);

        expect(formatted.replace(/\s/g, ' ')).toBe('1 280 000 DA');
        expect(formatted.endsWith('\u00A0DA')).toBe(true);
        expect(formatted).not.toContain(',00');
        expect(formatted).not.toContain('DZD');
    });

    it('keeps compact money opt-in', () => {
        const compact = formatMoney(1_280_000, { compact: true });

        expect(compact.endsWith('\u00A0DA')).toBe(true);
        expect(compact.length).toBeLessThan(formatMoney(1_280_000).length);
        expect(formatMoneyCompact(1_280_000)).toBe(compact);
    });

    it('converts centimes through the same DA formatter', () => {
        expect(formatMoneyFromCents(128_000_000).replace(/\s/g, ' ')).toBe(
            '1 280 000 DA',
        );
    });

    it('prints 24h Africa/Algiers time instead of a 12h clock', () => {
        const evening = new Date('2026-10-01T21:08:00+01:00');

        expect(formatTime(evening)).toMatch(/21:08/);
        expect(formatTime(evening)).not.toMatch(/PM|AM|p\.m\.|a\.m\./i);
        expect(formatDateTime(evening)).toMatch(/21:08/);
    });

    it('exports Saturday as the first day of the week', () => {
        expect(WEEK_STARTS_ON).toBe(6);
        expect(WEEKEND_DAYS).toEqual([5, 6]);

        const locale = new Intl.Locale('fr-DZ') as Intl.Locale & {
            weekInfo?: { firstDay: number };
        };

        expect(locale.weekInfo?.firstDay ?? WEEK_STARTS_ON).toBe(6);
    });

    it('normalizes and formats +213 mobile numbers', () => {
        expect(normalizePhone('055 01 88 001')).toBe('+213550188001');
        expect(normalizePhone('0550188001')).toBe('+213550188001');
        expect(normalizePhone('+213550188001')).toBe('+213550188001');
        expect(formatPhone('0550188001')).toBe('+213 550 18 80 01');
        expect(formatPhone('+213 550 18 80 01')).toBe('+213 550 18 80 01');
        expect(formatPhone(null)).toBe('');
    });
});
