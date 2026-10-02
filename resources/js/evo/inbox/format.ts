/**
 * Inbox date helpers — fr-DZ, Africa/Algiers, 24h.
 */

import { LOCALE, TIMEZONE, formatDate, formatTime } from '@/evo/lib/format';

const DAY = 24 * 60 * 60 * 1000;

function asDate(value: Date | string | number): Date {
    return value instanceof Date ? value : new Date(value);
}

export function formatInboxWhen(iso?: string | null): string {
    if (!iso) {
        return '';
    }

    try {
        return new Intl.DateTimeFormat(LOCALE, {
            timeZone: TIMEZONE,
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23',
        }).format(asDate(iso));
    } catch {
        return String(iso).slice(0, 10);
    }
}

export function formatInboxDay(iso?: string | null): string {
    if (!iso) {
        return '';
    }

    try {
        return formatDate(iso, { year: undefined });
    } catch {
        return String(iso).slice(0, 10);
    }
}

export function formatInboxClock(iso?: string | null): string {
    if (!iso) {
        return '';
    }

    try {
        return formatTime(iso);
    } catch {
        return '';
    }
}

export function inboxDayKey(iso?: string | null): string {
    if (!iso) {
        return '';
    }

    try {
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: TIMEZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).format(asDate(iso));
    } catch {
        return String(iso).slice(0, 10);
    }
}

export function isSameInboxDay(a?: string | null, b?: string | null): boolean {
    return inboxDayKey(a) !== '' && inboxDayKey(a) === inboxDayKey(b);
}

export function hoursSince(iso?: string | null, now = Date.now()): number {
    if (!iso) {
        return Number.POSITIVE_INFINITY;
    }

    return Math.abs(now - asDate(iso).getTime()) / (60 * 60 * 1000);
}

export function daysSince(iso?: string | null, now = Date.now()): number {
    return hoursSince(iso, now) / 24;
}

export { DAY };
