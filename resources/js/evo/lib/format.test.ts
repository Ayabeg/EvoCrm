import { describe, expect, it } from 'vitest';
import { hydrateI18n } from '@/lib/i18n';
import {
    NUMBERING_SYSTEM,
    WEEK_STARTS_ON,
    WEEKEND_DAYS,
    formatDate,
    formatDateTime,
    formatMoney,
    formatMoneyCompact,
    formatMoneyFromCents,
    formatNumber,
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

    it('keeps Latin digits for Arabic UI locale', () => {
        hydrateI18n('ar', {});

        const money = formatMoney(1_280_000);
        const date = formatDate(new Date('2026-10-02T16:30:00+01:00'));
        const number = formatNumber(1280000);

        expect(NUMBERING_SYSTEM).toBe('latn');
        expect(money).toMatch(/1/);
        expect(money).not.toMatch(/[٠-٩۰-۹]/);
        expect(date).not.toMatch(/[٠-٩۰-۹]/);
        expect(number).not.toMatch(/[٠-٩۰-۹]/);
        expect(formatPhone('+213550188001')).toBe('+213 550 18 80 01');

        hydrateI18n('en', {});
    });

    it('keeps +213 at the start of phones in every UI locale', () => {
        for (const locale of ['fr', 'en', 'ar'] as const) {
            hydrateI18n(locale, {});

            expect(formatPhone('+213550100002')).toBe('+213 550 10 00 02');
            expect(formatPhone('+213550100002').startsWith('+213')).toBe(true);
            expect(formatPhone('+213550100002')).not.toMatch(/213550100002\+/);
        }

        hydrateI18n('en', {});
    });

    it('prints DA — never DZD — in fr, en, and ar', () => {
        for (const locale of ['fr', 'en', 'ar'] as const) {
            hydrateI18n(locale, {});

            const full = formatMoney(1_280_000);
            const compact = formatMoney(2_285_000, { compact: true });
            const fromCents = formatMoneyFromCents(62_000_000, { compact: true });

            expect(full.replace(/\s/g, ' ')).toBe('1 280 000 DA');
            expect(compact).toContain('DA');
            expect(compact).not.toContain('DZD');
            expect(fromCents).toContain('DA');
            expect(fromCents).not.toContain('DZD');
            expect(fromCents).not.toMatch(/K DZD|M DZD/);
        }

        hydrateI18n('en', {});
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
