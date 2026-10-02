import { fullRecordHref } from '@/ds/workspace/quick-record/ref';
import type {
    QuickRecordPeekPayload,
    RecordDescriptor,
    RecordStatusTone,
} from '@/ds/workspace/quick-record/types';
import {
    asString,
    assertType,
    compactActions,
    displayOrEmpty,
    formatQuietDate,
    initialsFromName,
    mapActivity,
    mapAssociations,
    ownerFrom,
    titleCaseStatus,
} from '@/ds/workspace/record-adapters/present';

function ticketTone(status: string | null): RecordStatusTone {
    if (status === 'closed') {
        return 'success';
    }

    if (status === 'waiting_on_us') {
        return 'danger';
    }

    if (status === 'waiting_on_contact') {
        return 'warning';
    }

    return 'neutral';
}

export function adaptTicket(payload: QuickRecordPeekPayload): RecordDescriptor {
    assertType(payload.type, 'ticket');

    const record = payload.record;
    const title =
        asString(record.subject) ||
        asString(record.title) ||
        `Ticket #${payload.id}`;
    const number = asString(record.number);
    const status = asString(record.status);
    const ref = { type: 'ticket' as const, id: payload.id };
    const href = fullRecordHref(ref);

    return {
        ref,
        title,
        subtitle: number ?? asString(record.company_name) ?? undefined,
        avatar: { initials: initialsFromName(title) },
        status: status
            ? {
                  label: titleCaseStatus(status) ?? status,
                  tone: ticketTone(status),
              }
            : undefined,
        owner: ownerFrom(record),
        fullRecordHref: href,
        keyProperties: [
            { id: 'number', label: 'Number', value: displayOrEmpty(number) },
            {
                id: 'status',
                label: 'Status',
                value: displayOrEmpty(titleCaseStatus(status)),
            },
            {
                id: 'priority',
                label: 'Priority',
                value: displayOrEmpty(
                    titleCaseStatus(asString(record.priority)),
                ),
            },
            {
                id: 'channel',
                label: 'Channel',
                value: displayOrEmpty(
                    titleCaseStatus(asString(record.channel)),
                ),
            },
            {
                id: 'company',
                label: 'Company',
                value: displayOrEmpty(asString(record.company_name)),
            },
            {
                id: 'contact',
                label: 'Contact',
                value: displayOrEmpty(asString(record.contact_name)),
            },
            {
                id: 'owner',
                label: 'Owner',
                value: displayOrEmpty(asString(record.owner_name)),
            },
            {
                id: 'sla',
                label: 'SLA',
                value: displayOrEmpty(asString(record.sla_label)),
            },
            {
                id: 'created_at',
                label: 'Created',
                value: displayOrEmpty(formatQuietDate(record.created_at)),
            },
        ],
        associations: mapAssociations(payload.associations),
        activity: mapActivity(payload.activity),
        notes: mapActivity(payload.notes),
        tasks: mapActivity(payload.tasks),
        actions: compactActions(
            href,
            asString(record.contact_email),
            asString(record.contact_phone_e164),
        ),
        capabilities: payload.capabilities,
        permissions: payload.permissions,
    };
}
