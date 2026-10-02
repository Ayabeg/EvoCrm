import { RECORD_TYPES } from '@/ds/workspace/quick-record/types';
import type { RecordRef, RecordType } from '@/ds/workspace/quick-record/types';

export function isRecordType(value: string): value is RecordType {
    return (RECORD_TYPES as readonly string[]).includes(value);
}

export function parseRecordRef(type: unknown, id: unknown): RecordRef | null {
    if (typeof type !== 'string' || !isRecordType(type)) {
        return null;
    }

    const numeric = typeof id === 'number' ? id : typeof id === 'string' ? Number(id) : NaN;

    if (!Number.isInteger(numeric) || numeric < 1) {
        return null;
    }

    return { type, id: numeric };
}

export function sameRecordRef(a: RecordRef | null, b: RecordRef | null): boolean {
    return a !== null && b !== null && a.type === b.type && a.id === b.id;
}

const SHOW_PATHS: Record<RecordType, string> = {
    contact: '/crm/contacts',
    company: '/crm/companies',
    lead: '/crm/leads',
    deal: '/crm/deals',
    quote: '/crm/quotes',
    ticket: '/crm/tickets',
};

export function fullRecordHref(ref: RecordRef): string {
    return `${SHOW_PATHS[ref.type]}/${ref.id}`;
}

export function serializePeekRef(ref: RecordRef): string {
    return `${ref.type}:${ref.id}`;
}

export function parsePeekToken(value: string | null | undefined): RecordRef | null {
    if (!value) {
        return null;
    }

    const [type, rawId] = value.split(':');

    return parseRecordRef(type, rawId);
}
