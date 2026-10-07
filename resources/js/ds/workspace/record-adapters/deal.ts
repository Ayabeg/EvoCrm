import { fullRecordHref } from '@/ds/workspace/quick-record/ref';
import type { QuickRecordPeekPayload, RecordDescriptor } from '@/ds/workspace/quick-record/types';
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
import { t } from '@/lib/i18n';
import { stageLabel } from '@/lib/stage-copy';

export function adaptDeal(payload: QuickRecordPeekPayload): RecordDescriptor {
    assertType(payload.type, 'deal');

    const record = payload.record;
    const title = asString(record.title) || t('Deal #:id', { id: payload.id });
    const stageSlug = asString(record.stage_slug);
    const stage = stageLabel(stageSlug, asString(record.stage_name));
    const ref = { type: 'deal' as const, id: payload.id };
    const href = fullRecordHref(ref);
    const currency = asString(record.currency) ?? 'DZD';

    return {
        ref,
        title,
        subtitle: asString(record.company_name) ?? asString(record.contact_name) ?? undefined,
        avatar: { initials: initialsFromName(title) },
        status: stage ? { label: stage, tone: 'neutral' } : undefined,
        owner: ownerFrom(record),
        fullRecordHref: href,
        keyProperties: [
            { id: 'stage', label: t('Stage'), value: displayOrEmpty(stage) },
            { id: 'amount', label: t('Amount'), value: displayOrEmpty(formatMoneyCents(record.amount_cents, currency)) },
            { id: 'company', label: t('Company'), value: displayOrEmpty(asString(record.company_name)) },
            { id: 'contact', label: t('Contact'), value: displayOrEmpty(asString(record.contact_name)) },
            { id: 'owner', label: t('Owner'), value: displayOrEmpty(asString(record.owner_name)) },
            { id: 'close_date', label: t('Close date'), value: displayOrEmpty(formatQuietDate(record.close_date)) },
            { id: 'next_step', label: t('Next step'), value: displayOrEmpty(asString(record.next_step)) },
            { id: 'priority', label: t('Priority'), value: displayOrEmpty(titleCaseStatus(asString(record.priority))) },
        ],
        associations: mapAssociations(payload.associations),
        activity: mapActivity(payload.activity),
        notes: mapActivity(payload.notes),
        tasks: mapActivity(payload.tasks),
        actions: compactActions(href, asString(record.contact_email), asString(record.contact_phone_e164)),
        capabilities: payload.capabilities,
        permissions: payload.permissions,
        attention: payload.attention ?? null,
    };
}
