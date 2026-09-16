import { fullRecordHref } from '@/ds/workspace/quick-record/ref';
import type { DrawerError, QuickRecordPeekPayload, RecordRef, RecordType } from '@/ds/workspace/quick-record/types';
import { RECORD_TYPES } from '@/ds/workspace/quick-record/types';

export function peekUrl(ref: RecordRef): string {
    return `/crm/records/${ref.type}/${ref.id}/peek`;
}

export function errorFromResponse(status: number, ref: RecordRef): DrawerError {
    if (status === 404) {
        return {
            code: 'not_found',
            message: 'This record is missing or no longer visible.',
            status,
            fullRecordHref: fullRecordHref(ref),
        };
    }

    if (status === 403) {
        return {
            code: 'forbidden',
            message: 'You do not have permission to view this record.',
            status,
        };
    }

    return {
        code: 'network',
        message: 'The record could not be loaded.',
        status,
        fullRecordHref: fullRecordHref(ref),
    };
}

export function malformedRefError(): DrawerError {
    return {
        code: 'malformed',
        message: 'That record reference is not valid.',
    };
}

function isRecordType(value: unknown): value is RecordType {
    return typeof value === 'string' && (RECORD_TYPES as readonly string[]).includes(value);
}

export function parsePeekPayload(data: unknown): QuickRecordPeekPayload | null {
    if (!data || typeof data !== 'object') {
        return null;
    }

    const payload = data as Partial<QuickRecordPeekPayload>;

    if (!isRecordType(payload.type) || typeof payload.id !== 'number' || payload.id < 1) {
        return null;
    }

    if (!payload.record || typeof payload.record !== 'object' || !payload.permissions || !payload.capabilities) {
        return null;
    }

    return {
        type: payload.type,
        id: payload.id,
        record: payload.record,
        associations: Array.isArray(payload.associations) ? payload.associations : [],
        activity: Array.isArray(payload.activity) ? payload.activity : [],
        notes: Array.isArray(payload.notes) ? payload.notes : [],
        tasks: Array.isArray(payload.tasks) ? payload.tasks : [],
        capabilities: payload.capabilities,
        permissions: payload.permissions,
        attention: payload.attention ?? null,
    };
}

export async function hydrateQuickRecord(
    ref: RecordRef,
    signal?: AbortSignal,
): Promise<QuickRecordPeekPayload> {
    const response = await fetch(peekUrl(ref), {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
        signal,
    });

    if (!response.ok) {
        throw errorFromResponse(response.status, ref);
    }

    const parsed = parsePeekPayload(await response.json());

    if (!parsed) {
        throw malformedRefError();
    }

    return parsed;
}
