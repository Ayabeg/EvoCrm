import { fullRecordHref } from '@/ds/workspace/quick-record/ref';
import type { QuickRecordPeekPayload, RecordDescriptor } from '@/ds/workspace/quick-record/types';
import {
    asNumber,
    asString,
    assertType,
    compactActions,
    displayOrEmpty,
    initialsFromName,
    mapActivity,
    mapAssociations,
    ownerFrom,
} from '@/ds/workspace/record-adapters/present';

export function adaptCompany(payload: QuickRecordPeekPayload): RecordDescriptor {
    assertType(payload.type, 'company');

    const record = payload.record;
    const title = asString(record.name) || `Company #${payload.id}`;
    const ref = { type: 'company' as const, id: payload.id };
    const href = fullRecordHref(ref);
    const domain = asString(record.domain);

    return {
        ref,
        title,
        subtitle: domain ?? asString(record.city) ?? undefined,
        avatar: { initials: initialsFromName(title) },
        owner: ownerFrom(record),
        fullRecordHref: href,
        keyProperties: [
            { id: 'domain', label: 'Domain', value: displayOrEmpty(domain) },
            { id: 'industry', label: 'Industry', value: displayOrEmpty(asString(record.industry)) },
            { id: 'phone', label: 'Phone', value: displayOrEmpty(asString(record.phone)) },
            { id: 'city', label: 'City', value: displayOrEmpty(asString(record.city)) },
            { id: 'wilaya', label: 'Wilaya', value: displayOrEmpty(asString(record.wilaya)) },
            { id: 'country', label: 'Country', value: displayOrEmpty(asString(record.country)) },
            { id: 'owner', label: 'Owner', value: displayOrEmpty(asString(record.owner_name)) },
            {
                id: 'counts',
                label: 'Records',
                value: `${asNumber(record.contacts_count) ?? 0} contacts · ${asNumber(record.deals_count) ?? 0} deals`,
            },
        ],
        associations: mapAssociations(payload.associations),
        activity: mapActivity(payload.activity),
        notes: mapActivity(payload.notes),
        tasks: mapActivity(payload.tasks),
        actions: compactActions(href, null, asString(record.phone)),
        capabilities: payload.capabilities,
        permissions: payload.permissions,
    };
}
