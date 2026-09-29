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
    })}x`;
}

export function formatPercent(value: number): string {
    return `${value} %`;
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
