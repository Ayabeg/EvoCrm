import { fullRecordHref } from '@/ds/workspace/quick-record/ref';
import type { QuickRecordPeekPayload, RecordDescriptor } from '@/ds/workspace/quick-record/types';
import {
    asString,
    assertType,
    compactActions,
    displayOrEmpty,
    formatQuietDate,
    mapActivity,
    mapAssociations,
    ownerFrom,
    titleCaseStatus,
} from '@/ds/workspace/record-adapters/present';
import { formatContactName, contactInitials } from '@/lib/contact-name';

export function adaptContact(payload: QuickRecordPeekPayload): RecordDescriptor {
    assertType(payload.type, 'contact');

    const record = payload.record;
    const first = asString(record.first_name) ?? '';
    const last = asString(record.last_name);
    const title = asString(record.display_name) || formatContactName(first, last) || `Contact #${payload.id}`;
    const ref = { type: 'contact' as const, id: payload.id };
    const href = fullRecordHref(ref);
    const email = asString(record.email);
    const phone = asString(record.phone_e164);
    const companyName = asString(record.company_name);

    return {
        ref,
        title,
        subtitle: companyName ?? email ?? undefined,
        avatar: { initials: contactInitials(first || title, last) },
        status: titleCaseStatus(asString(record.lead_status))
            ? { label: titleCaseStatus(asString(record.lead_status)) ?? '', tone: 'neutral' }
            : undefined,
        owner: ownerFrom(record),
        fullRecordHref: href,
        keyProperties: [
            { id: 'email', label: 'Email', value: displayOrEmpty(email) },
            { id: 'phone', label: 'Phone', value: displayOrEmpty(phone) },
            { id: 'company', label: 'Company', value: displayOrEmpty(companyName) },
            { id: 'owner', label: 'Owner', value: displayOrEmpty(asString(record.owner_name)) },
            { id: 'lead_status', label: 'Lead status', value: displayOrEmpty(titleCaseStatus(asString(record.lead_status))) },
            { id: 'city', label: 'City', value: displayOrEmpty(asString(record.city)) },
            { id: 'wilaya', label: 'Wilaya', value: displayOrEmpty(asString(record.wilaya)) },
            { id: 'created_at', label: 'Created', value: displayOrEmpty(formatQuietDate(record.created_at)) },
        ],
        associations: mapAssociations(payload.associations),
        activity: mapActivity(payload.activity),
        notes: mapActivity(payload.notes),
        tasks: mapActivity(payload.tasks),
        actions: compactActions(href, email, phone),
        capabilities: payload.capabilities,
        permissions: payload.permissions,
    };
}
