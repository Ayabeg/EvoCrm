import { fullRecordHref } from '@/ds/workspace/quick-record/ref';
import type { QuickRecordPeekPayload, RecordDescriptor, RecordStatusTone } from '@/ds/workspace/quick-record/types';
import {
    asString,
    assertType,
    compactActions,
    displayOrEmpty,
    formatMoneyCents,
    formatQuietDate,
    initialsFromName,
    mapActivity,
    mapAssociations,
    ownerFrom,
    titleCaseStatus,
} from '@/ds/workspace/record-adapters/present';

function quoteTone(status: string | null): RecordStatusTone {
    if (status === 'accepted') {
        return 'success';
    }

    if (status === 'sent') {
        return 'warning';
    }

    return 'neutral';
}

export function adaptQuote(payload: QuickRecordPeekPayload): RecordDescriptor {
    assertType(payload.type, 'quote');

    const record = payload.record;
    const dealTitle = asString(record.deal_title) ?? asString(record.title) ?? `Quote #${payload.id}`;
    const status = asString(record.status);
    const ref = { type: 'quote' as const, id: payload.id };
    const href = fullRecordHref(ref);
    const currency = asString(record.currency) ?? 'DZD';

    return {
        ref,
        title: dealTitle,
        subtitle: `Quote #${payload.id}`,
        avatar: { initials: initialsFromName(dealTitle) },
        status: status
            ? { label: titleCaseStatus(status) ?? status, tone: quoteTone(status) }
            : undefined,
        owner: ownerFrom(record),
        fullRecordHref: href,
        keyProperties: [
            { id: 'deal', label: 'Deal', value: displayOrEmpty(asString(record.deal_title)) },
            { id: 'total', label: 'Total', value: displayOrEmpty(formatMoneyCents(record.total_cents, currency)) },
            { id: 'status', label: 'Status', value: displayOrEmpty(titleCaseStatus(status)) },
            { id: 'expires_at', label: 'Expires', value: displayOrEmpty(formatQuietDate(record.expires_at)) },
            { id: 'owner', label: 'Owner', value: displayOrEmpty(asString(record.owner_name)) },
            { id: 'sent_at', label: 'Sent', value: displayOrEmpty(formatQuietDate(record.sent_at)) },
            { id: 'accepted_at', label: 'Accepted', value: displayOrEmpty(formatQuietDate(record.accepted_at)) },
        ],
        associations: mapAssociations(payload.associations),
        activity: mapActivity(payload.activity),
        notes: mapActivity(payload.notes),
        tasks: mapActivity(payload.tasks),
        actions: compactActions(href, null, null),
        capabilities: payload.capabilities,
        permissions: payload.permissions,
    };
}
