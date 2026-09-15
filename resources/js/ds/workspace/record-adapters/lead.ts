import { fullRecordHref } from '@/ds/workspace/quick-record/ref';
import type { QuickRecordPeekPayload, RecordDescriptor, RecordStatusTone } from '@/ds/workspace/quick-record/types';
import {
    asNumber,
    asString,
    assertType,
    compactActions,
    displayOrEmpty,
    formatQuietDate,
    initialsFromName,
    mapActivity,
    mapAssociations,
    titleCaseStatus,
} from '@/ds/workspace/record-adapters/present';

function qualificationTone(status: string | null): RecordStatusTone {
    if (status === 'qualified') {
        return 'success';
    }

    if (status === 'disqualified') {
        return 'danger';
    }

    if (status === 'working') {
        return 'warning';
    }

    return 'neutral';
}

export function adaptLead(payload: QuickRecordPeekPayload): RecordDescriptor {
    assertType(payload.type, 'lead');

    const record = payload.record;
    const title = asString(record.title) || `Lead #${payload.id}`;
    const status = asString(record.status);
    const ref = { type: 'lead' as const, id: payload.id };
    const href = fullRecordHref(ref);
    const contactName = asString(record.contact_name);

    return {
        ref,
        title,
        subtitle: contactName ?? asString(record.company_name) ?? undefined,
        avatar: { initials: initialsFromName(title) },
        status: status
            ? { label: titleCaseStatus(status) ?? status, tone: qualificationTone(status) }
            : undefined,
        fullRecordHref: href,
        keyProperties: [
            { id: 'qualification', label: 'Qualification', value: displayOrEmpty(titleCaseStatus(status)) },
            { id: 'source', label: 'Source', value: displayOrEmpty(asString(record.source)) },
            { id: 'score', label: 'Score', value: displayOrEmpty(asNumber(record.score) !== null ? String(asNumber(record.score)) : null) },
            { id: 'contact', label: 'Contact', value: displayOrEmpty(contactName) },
            { id: 'company', label: 'Company', value: displayOrEmpty(asString(record.company_name)) },
            { id: 'deal', label: 'Deal', value: displayOrEmpty(asString(record.deal_title)) },
            { id: 'qualified_at', label: 'Qualified', value: displayOrEmpty(formatQuietDate(record.qualified_at)) },
            { id: 'created_at', label: 'Created', value: displayOrEmpty(formatQuietDate(record.created_at)) },
        ],
        associations: mapAssociations(payload.associations),
        activity: mapActivity(payload.activity),
        notes: mapActivity(payload.notes),
        tasks: mapActivity(payload.tasks),
        actions: compactActions(href, asString(record.contact_email), asString(record.contact_phone_e164)),
        capabilities: payload.capabilities,
        permissions: payload.permissions,
    };
}
