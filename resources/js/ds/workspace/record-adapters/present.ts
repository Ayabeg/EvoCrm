import { parseRecordRef } from '@/ds/workspace/quick-record/ref';
import type {
    PeekActivity,
    PeekAssociation,
    RecordActivityItem,
    RecordAssociation,
    RecordType,
} from '@/ds/workspace/quick-record/types';
import { dateLocale } from '@/lib/i18n';
import { formatDzd } from '@/lib/money';

export const EMPTY_VALUE = '—';

export function asString(value: unknown): string | null {
    if (typeof value === 'string') {
        const trimmed = value.trim();

        return trimmed === '' ? null : trimmed;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
    }

    return null;
}

export function asNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isInteger(value)) {
        return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);

        return Number.isInteger(parsed) ? parsed : null;
    }

    return null;
}

export function displayOrEmpty(value: string | null | undefined): string {
    return value && value.trim() !== '' ? value : EMPTY_VALUE;
}

export function formatQuietDate(value: unknown): string | null {
    const raw = asString(value);

    if (!raw) {
        return null;
    }

    const date = new Date(raw);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return new Intl.DateTimeFormat(dateLocale(), { dateStyle: 'medium' }).format(date);
}

export function formatMoneyCents(cents: unknown, currency = 'DZD'): string | null {
    const amount = asNumber(cents);

    if (amount === null) {
        return null;
    }

    if (currency === 'DZD') {
        return formatDzd(amount);
    }

    return `${(amount / 100).toFixed(0)} ${currency}`;
}

export function initialsFromName(name: string): string {
    const parts = name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2);

    if (parts.length === 0) {
        return '?';
    }

    return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
}

export function titleCaseStatus(value: string | null): string | null {
    if (!value) {
        return null;
    }

    return value
        .split(/[_\s-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

export function mapAssociations(items: PeekAssociation[]): RecordAssociation[] {
    return items.flatMap((item) => {
        const ref = parseRecordRef(item.type, item.id);

        if (!ref) {
            return [];
        }

        return [
            {
                ref,
                label: item.label,
                hint: item.hint,
            },
        ];
    });
}

export function mapActivity(items: PeekActivity[]): RecordActivityItem[] {
    return items.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.subject?.trim() || titleCaseStatus(item.type) || `Activity #${item.id}`,
        body: item.body ?? null,
        at: item.due_at ?? item.created_at ?? null,
        owner: item.owner_name ?? null,
        done: item.done,
    }));
}

export function ownerFrom(record: Record<string, unknown>): { id: number; name: string } | undefined {
    const id = asNumber(record.owner_id);
    const name = asString(record.owner_name);

    if (id === null || !name) {
        return undefined;
    }

    return { id, name };
}

export function mailtoAction(email: string | null): { id: 'email'; label: string; href: string } | null {
    if (!email) {
        return null;
    }

    return { id: 'email', label: 'Email', href: `mailto:${email}` };
}

export function telAction(phone: string | null): { id: 'call'; label: string; href: string } | null {
    if (!phone) {
        return null;
    }

    return { id: 'call', label: 'Call', href: `tel:${phone}` };
}

export function openFullAction(href: string): { id: 'open_full'; label: string; href: string } {
    return { id: 'open_full', label: 'Open full record', href };
}

export function compactActions(
    href: string,
    email: string | null,
    phone: string | null,
): Array<{ id: 'email' | 'call' | 'open_full'; label: string; href: string }> {
    return [mailtoAction(email), telAction(phone), openFullAction(href)].filter(
        (action): action is NonNullable<typeof action> => action !== null,
    );
}

export function assertType(payloadType: string, expected: RecordType): void {
    if (payloadType !== expected) {
        throw new Error(`Adapter expected ${expected}, received ${payloadType}`);
    }
}
