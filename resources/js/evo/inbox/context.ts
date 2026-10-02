/**
 * Map Desk P14 payload → CRMContextRecord (import-only from @/evo/crm/record).
 */

import type { CRMContextRecord } from '@/evo/crm/record';
import { formatMoneyFromCents } from '@/evo/lib/format';
import { t } from '@/lib/i18n';
import type { InboxCrmContextPayload } from '@/lib/inbox-crm-context';

export function crmContextFromInbox(
    payload?: InboxCrmContextPayload | null,
): CRMContextRecord | null {
    if (!payload?.contact) {
        return null;
    }

    const deal =
        payload.deals.find((item) => item.id === payload.primary_deal_id) ??
        payload.deals[0] ??
        null;

    return {
        ref: { type: 'contact', id: payload.contact.id },
        title: payload.contact.name,
        subtitle: payload.company?.name ?? payload.contact.phone ?? payload.contact.email ?? undefined,
        status: deal?.stage.name
            ? {
                  label: deal.stage.name,
                  tone: deal.is_won ? 'success' : deal.is_lost ? 'danger' : 'neutral',
              }
            : undefined,
        owner: payload.contact.owner
            ? { id: payload.contact.owner.id, name: payload.contact.owner.name }
            : undefined,
        fullRecordHref: payload.contact.href,
        keyProperties: [
            {
                id: 'email',
                label: t('Email'),
                value: payload.contact.email ?? null,
            },
            {
                id: 'phone',
                label: t('Phone'),
                value: payload.contact.phone ?? null,
            },
            {
                id: 'company',
                label: t('Company'),
                value: payload.company?.name ?? null,
                href: payload.company?.href,
            },
            {
                id: 'deal',
                label: t('Open deal'),
                value: deal
                    ? `${deal.title} · ${formatMoneyFromCents(deal.amount_cents)}`
                    : null,
                href: deal?.href,
            },
        ],
        associations: [
            ...(payload.company
                ? [
                      {
                          ref: { type: 'company' as const, id: payload.company.id },
                          label: payload.company.name,
                      },
                  ]
                : []),
            ...payload.deals.slice(0, 4).map((item) => ({
                ref: { type: 'deal' as const, id: item.id },
                label: item.title,
                hint: item.stage.name ?? undefined,
            })),
        ],
        nextAction: payload.next_activity
            ? {
                  title: payload.next_activity.subject,
                  dueAt: payload.next_activity.at ?? null,
                  href: payload.next_activity.deal_id
                      ? `/crm/deals/${payload.next_activity.deal_id}`
                      : undefined,
              }
            : deal?.next_activity
              ? {
                    title: deal.next_activity.subject,
                    dueAt: deal.next_activity.at ?? null,
                    href: deal.href,
                }
              : null,
    };
}
