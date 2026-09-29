import { DEMO_PERIOD } from './evocrm-demo-data';

export function formatDa(amount: number): string {
    const formatted = new Intl.NumberFormat('fr-DZ', {
        maximumFractionDigits: 0,
    }).format(amount);

    return `${formatted} DA`;
}

export function formatCount(value: number): string {
    return new Intl.NumberFormat('fr-DZ', {
        maximumFractionDigits: 0,
    }).format(value);
}

export function formatRoas(value: number): string {
    return `${value.toLocaleString('fr-DZ', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    })}×`;
}

export function formatExactRoas(value: number): string {
    return `${value.toLocaleString('fr-DZ', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}×`;
}

export function formatCompactAxis(value: number): string {
    if (value === 0) {
        return '0';
    }

    const abs = Math.abs(value);

    if (abs >= 1_000_000) {
        const millions = value / 1_000_000;
        const label = Number.isInteger(millions)
            ? String(millions)
            : millions.toLocaleString('fr-DZ', { maximumFractionDigits: 1 });

        return `${label} M`;
    }

    if (abs >= 1000) {
        return `${Math.round(value / 1000)} k`;
    }

    return formatCount(value);
}

export function formatRatioPercent(ratio: number | null, digits = 2): string {
    if (ratio === null) {
        return '—';
    }

    return `${(ratio * 100).toLocaleString('fr-DZ', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    })}%`;
}

export function formatPercent(value: number): string {
    return `${value} %`;
}

export function formatRate(ratio: number | null): string {
    if (ratio === null) {
        return '—';
    }

    return `${(ratio * 100).toLocaleString('fr-DZ', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    })} %`;
}

export function formatDayLabel(isoDate: string): string {
    const date = new Date(`${isoDate}T12:00:00+01:00`);

    return new Intl.DateTimeFormat('fr-DZ', {
        timeZone: DEMO_PERIOD.timezone,
        day: 'numeric',
        month: 'short',
    }).format(date);
}

export function formatFullDate(isoDate: string): string {
    const date = isoDate.includes('T')
        ? new Date(isoDate)
        : new Date(`${isoDate}T12:00:00+01:00`);

    return new Intl.DateTimeFormat('fr-DZ', {
        timeZone: DEMO_PERIOD.timezone,
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(date);
}

export function formatDateTime(isoDateTime: string): string {
    return new Intl.DateTimeFormat('fr-DZ', {
        timeZone: DEMO_PERIOD.timezone,
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(isoDateTime));
}

export function contactName(contact: { firstName: string; lastName: string }): string {
    return `${contact.firstName} ${contact.lastName}`;
}
