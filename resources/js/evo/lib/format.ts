import { intlLocale } from '@/lib/i18n';
import { formatCompactDzd, formatDzd } from '@/lib/money';

export const LOCALE = 'fr-DZ';
export const TIMEZONE = 'Africa/Algiers';
export const CURRENCY_SUFFIX = 'DA';
export const DEFAULT_COUNTRY_CALLING_CODE = '213';
export const NUMBERING_SYSTEM = 'latn' as const;

/** Saturday. Intl `weekInfo.firstDay` for fr-DZ. Use with react-day-picker. */
export const WEEK_STARTS_ON = 6 as const;

/** Friday–Saturday, matching fr-DZ weekend. */
export const WEEKEND_DAYS = [5, 6] as const;

export { formatCompactDzd, formatDzd };

function activeIntlLocale(): string {
    try {
        return intlLocale();
    } catch {
        return LOCALE;
    }
}

function moneyFormat(
    value: number,
    options: Intl.NumberFormatOptions = {},
): string {
    return new Intl.NumberFormat(LOCALE, {
        maximumFractionDigits: 0,
        numberingSystem: NUMBERING_SYSTEM,
        ...options,
    }).format(value);
}

function groupFrDz(value: number): string {
    return moneyFormat(value);
}

/**
 * Non-compact DA: "1 280 000 DA" (narrow no-break group + NBSP before DA).
 * Same string in fr/en/ar. Do not use style:'currency' — that prints DZD.
 */
export function formatMoney(amount: number, options?: { compact?: boolean }): string {
    if (options?.compact) {
        return formatMoneyCompact(amount);
    }

    return `${groupFrDz(amount)}\u00A0${CURRENCY_SUFFIX}`;
}

export function formatMoneyFromCents(
    cents: number | null | undefined,
    options?: { compact?: boolean },
): string {
    return formatMoney(Math.round((cents ?? 0) / 100), options);
}

export function formatMoneyCompact(amount: number): string {
    return formatCompactDzd(amount * 100);
}

export function formatNumber(value: number): string {
    return groupFrDz(value);
}

function asDate(value: Date | string | number): Date {
    return value instanceof Date ? value : new Date(value);
}

export function formatDate(
    value: Date | string | number,
    options?: Intl.DateTimeFormatOptions,
): string {
    return new Intl.DateTimeFormat(activeIntlLocale(), {
        timeZone: TIMEZONE,
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        numberingSystem: NUMBERING_SYSTEM,
        ...options,
    }).format(asDate(value));
}

export function formatTime(
    value: Date | string | number,
    options?: Intl.DateTimeFormatOptions,
): string {
    return new Intl.DateTimeFormat(activeIntlLocale(), {
        timeZone: TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
        numberingSystem: NUMBERING_SYSTEM,
        ...options,
    }).format(asDate(value));
}

export function formatDateTime(
    value: Date | string | number,
    options?: Intl.DateTimeFormatOptions,
): string {
    return new Intl.DateTimeFormat(activeIntlLocale(), {
        timeZone: TIMEZONE,
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
        numberingSystem: NUMBERING_SYSTEM,
        ...options,
    }).format(asDate(value));
}

export function normalizePhone(
    raw: string | null | undefined,
    defaultCountry = DEFAULT_COUNTRY_CALLING_CODE,
): string | null {
    if (raw == null) {
        return null;
    }

    const trimmed = raw.trim();

    if (trimmed === '') {
        return null;
    }

    let value = trimmed.replace(/[\s().-]+/g, '');

    if (value.startsWith('00')) {
        value = `+${value.slice(2)}`;
    }

    if (value.startsWith('+')) {
        const digits = value.replace(/\D+/g, '');

        return digits !== '' ? `+${digits}` : null;
    }

    const digits = value.replace(/\D+/g, '');

    if (digits === '') {
        return null;
    }

    if (digits.startsWith(defaultCountry)) {
        return `+${digits}`;
    }

    if (digits.startsWith('0')) {
        return `+${defaultCountry}${digits.slice(1)}`;
    }

    return `+${defaultCountry}${digits}`;
}

function groupNational(national: string): string {
    if (/^[567]\d{8}$/.test(national)) {
        return `${national.slice(0, 3)} ${national.slice(3, 5)} ${national.slice(5, 7)} ${national.slice(7)}`;
    }

    if (national.length === 8) {
        return `${national.slice(0, 2)} ${national.slice(2, 4)} ${national.slice(4, 6)} ${national.slice(6)}`;
    }

    if (national.length === 9) {
        return `${national.slice(0, 3)} ${national.slice(3, 5)} ${national.slice(5, 7)} ${national.slice(7)}`;
    }

    return national.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
}

/**
 * Display form for Algerian numbers: "+213 550 18 80 01".
 * Storage remains E.164 via normalizePhone.
 */
export function formatPhone(raw: string | null | undefined): string {
    const e164 = normalizePhone(raw);

    if (e164 == null) {
        return '';
    }

    if (!e164.startsWith(`+${DEFAULT_COUNTRY_CALLING_CODE}`)) {
        return e164;
    }

    const national = e164.slice(DEFAULT_COUNTRY_CALLING_CODE.length + 1);

    if (national === '') {
        return `+${DEFAULT_COUNTRY_CALLING_CODE}`;
    }

    return `+${DEFAULT_COUNTRY_CALLING_CODE} ${groupNational(national)}`;
}
