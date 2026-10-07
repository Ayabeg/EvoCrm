import { Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useQuickRecord } from '@/ds/workspace/quick-record/context';
import { formatMoneyCents } from '@/ds/workspace/record-adapters/present';
import { useClipboard } from '@/hooks/use-clipboard';
import { attentionToneClass } from '@/lib/deal-attention';
import { dateLocale, t } from '@/lib/i18n';
import {
    focusedDealAttention,
    focusedDealNextActivity,
    resolveInspectedDealId,
    sortInboxContextDeals,
} from '@/lib/inbox-crm-context';
import type {
    InboxCrmActivitySummary,
    InboxCrmContextPayload,
    InboxCrmDeal,
} from '@/lib/inbox-crm-context';
import { cn } from '@/lib/utils';

function activityTypeLabel(type?: string | null): string {
    if (!type) {
        return '';
    }

    if (type === 'call') {
        return t('Call');
    }

    if (type === 'note') {
        return t('Note');
    }

    if (type === 'scheduled') {
        return t('inbox.activity.scheduled');
    }

    return t(type);
}

function formatContextWhen(iso?: string | null): string {
    if (!iso) {
        return '';
    }

    try {
        return new Intl.DateTimeFormat(dateLocale(), {
            timeZone: 'Africa/Algiers',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(iso));
    } catch {
        return iso.slice(0, 10);
    }
}

function Section({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <section className="border-t border-hairline px-3 py-2.5">
            <h3 className="text-[12px] font-medium tracking-[0.04em] text-mute uppercase">
                {title}
            </h3>
            <div className="mt-1.5 text-[13px] text-ink">{children}</div>
        </section>
    );
}

function Fact({
    label,
    value,
}: {
    label: string;
    value: ReactNode;
}) {
    return (
        <div className="min-w-0">
            <p className="text-[12px] text-mute">{label}</p>
            <p className="truncate text-[13px] text-ink">{value}</p>
        </div>
    );
}

function ActionLink({
    href,
    children,
}: {
    href: string;
    children: ReactNode;
}) {
    return (
        <Link
            href={href}
            className="text-[12px] font-medium text-[var(--evo-teal)] underline-offset-2 hover:underline"
        >
            {children}
        </Link>
    );
}

function PeekButton({
    type,
    id,
    label,
}: {
    type: 'contact' | 'company' | 'deal';
    id: number;
    label: string;
}) {
    const { openRecord } = useQuickRecord();

    return (
        <button
            type="button"
            className="text-[12px] font-medium text-[var(--evo-teal)] underline-offset-2 hover:underline"
            onClick={(event) => {
                openRecord({ type, id }, { opener: event.currentTarget });
            }}
        >
            {label}
        </button>
    );
}

function ActivityLine({
    item,
}: {
    item: InboxCrmActivitySummary;
}) {
    return (
        <p className="truncate text-[13px] text-ink">
            {item.subject}
            <span className="ms-1 text-[12px] text-mute">
                {activityTypeLabel(item.type)}
                {item.at ? ` · ${formatContextWhen(item.at)}` : ''}
            </span>
        </p>
    );
}

function DealRow({
    deal,
    focused,
    onInspect,
}: {
    deal: InboxCrmDeal;
    focused: boolean;
    onInspect: (id: number) => void;
}) {
    const amount = formatMoneyCents(deal.amount_cents, deal.currency);
    const stageName = deal.stage.name ?? t('Stage');
    const historic = deal.is_won || deal.is_lost;

    return (
        <div
            className={cn(
                'min-w-0 py-1.5',
                focused ? 'bg-canvas-soft px-1.5' : '',
            )}
        >
            <button
                type="button"
                onClick={() => onInspect(deal.id)}
                className="block w-full truncate text-start text-[13px] font-medium text-ink hover:text-[var(--evo-teal)]"
            >
                {deal.title}
            </button>
            <p
                className={cn(
                    'truncate text-[12px]',
                    historic ? 'text-mute' : 'text-ink',
                )}
            >
                {stageName}
                {historic ? ` · ${deal.is_won ? t('Won') : t('Lost')}` : ''}
                {amount ? ` · ${amount}` : ''}
            </p>
            {deal.owner ? (
                <p className="truncate text-[12px] text-mute">
                    {t('inbox.context.deal_owner')}: {deal.owner.name}
                </p>
            ) : null}
            {deal.attention?.primary ? (
                <p
                    className={cn(
                        'truncate text-[12px]',
                        attentionToneClass(deal.attention.primary.severity),
                    )}
                >
                    {deal.attention.primary.label}
                </p>
            ) : null}
            {deal.next_activity ? (
                <p className="truncate text-[12px] text-mute">
                    {t('inbox.context.next_activity')}: {deal.next_activity.subject}
                </p>
            ) : null}
            <div className="mt-1 flex flex-wrap gap-2">
                <ActionLink href={deal.href}>{t('Open deal')}</ActionLink>
                <PeekButton type="deal" id={deal.id} label={t('inbox.context.peek')} />
            </div>
        </div>
    );
}

export function InboxCrmContextSkeleton() {
    return (
        <div
            aria-busy="true"
            aria-label={t('inbox.context.loading')}
            data-inbox="context-pending"
            className="px-3 py-3"
        >
            {Array.from({ length: 4 }).map((_, index) => (
                <div
                    key={`ctx-skel-${index}`}
                    className="mb-2 h-3 animate-pulse bg-canvas-soft"
                />
            ))}
        </div>
    );
}

export function InboxCrmContextError({
    onRetry,
}: {
    onRetry?: () => void;
}) {
    return (
        <div data-inbox="context-error" className="px-3 py-3">
            <p className="text-[13px] text-ink">{t('inbox.context.failed')}</p>
            {onRetry ? (
                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-2 text-[12px] font-medium text-[var(--evo-teal)] underline-offset-2 hover:underline"
                >
                    {t('Retry')}
                </button>
            ) : null}
        </div>
    );
}

export function InboxCrmContext({
    context,
}: {
    context: InboxCrmContextPayload;
}) {
    const [, copy] = useClipboard();
    const [inspectState, setInspectState] = useState<{
        threadId: number | null;
        dealId: number | null;
    }>({ threadId: null, dealId: null });
    const inspectedDealId =
        inspectState.threadId === context.thread_id ? inspectState.dealId : null;

    const deals = useMemo(
        () => sortInboxContextDeals(context.deals),
        [context.deals],
    );
    const focusedDealId = resolveInspectedDealId({
        primaryDealId: context.primary_deal_id,
        inspectedDealId,
        visibleDealIds: deals.map((deal) => deal.id),
    });
    const focusedDeal = deals.find((deal) => deal.id === focusedDealId) ?? null;
    const attention = focusedDealAttention(context, focusedDealId);
    const nextActivity = focusedDealNextActivity(context, focusedDealId);

    if (context.empty === 'no_contact' || context.empty === 'restricted') {
        return (
            <div data-inbox="context-empty" className="px-3 py-3">
                <p className="text-[14px] font-medium text-ink">
                    {t('inbox.context.no_contact')}
                </p>
                <p className="mt-1 text-[12px] text-mute">
                    {t('inbox.context.no_contact_body')}
                </p>
            </div>
        );
    }

    if (context.empty === 'error') {
        return <InboxCrmContextError />;
    }

    const contact = context.contact;

    return (
        <div data-inbox="crm-context">
            {contact ? (
                <div className="px-3 py-2.5">
                    <p className="truncate text-[15px] font-medium text-ink">
                        {contact.name}
                    </p>
                    <p className="mt-0.5 text-[12px] text-mute">{t('Contact')}</p>
                    <div className="mt-2 space-y-1.5">
                        <Fact
                            label={t('Email')}
                            value={
                                contact.email ? (
                                    <span className="flex items-center gap-2">
                                        <span className="truncate">{contact.email}</span>
                                        <button
                                            type="button"
                                            className="shrink-0 text-[12px] text-[var(--evo-teal)]"
                                            onClick={() => {
                                                void copy(contact.email ?? '');
                                            }}
                                        >
                                            {t('Copy')}
                                        </button>
                                    </span>
                                ) : (
                                    t('No email')
                                )
                            }
                        />
                        <Fact
                            label={t('Phone')}
                            value={
                                contact.phone ? (
                                    <span className="flex items-center gap-2">
                                        <span className="truncate">{contact.phone}</span>
                                        <button
                                            type="button"
                                            className="shrink-0 text-[12px] text-[var(--evo-teal)]"
                                            onClick={() => {
                                                void copy(contact.phone ?? '');
                                            }}
                                        >
                                            {t('Copy')}
                                        </button>
                                    </span>
                                ) : (
                                    t('No phone')
                                )
                            }
                        />
                        <Fact
                            label={t('inbox.context.contact_owner')}
                            value={contact.owner?.name ?? t('No owner')}
                        />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                        <ActionLink href={contact.href}>{t('Open contact')}</ActionLink>
                        <PeekButton type="contact" id={contact.id} label={t('inbox.context.peek')} />
                    </div>
                </div>
            ) : null}

            {context.company ? (
                <Section title={t('Company')}>
                    <p className="truncate text-[13px] text-ink">
                        {context.company.name}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                        <ActionLink href={context.company.href}>
                            {t('Open company')}
                        </ActionLink>
                        <PeekButton
                            type="company"
                            id={context.company.id}
                            label={t('inbox.context.peek')}
                        />
                    </div>
                </Section>
            ) : null}

            {deals.length > 0 ? (
                <Section
                    title={
                        context.primary_deal_id
                            ? t('Deal')
                            : deals.length === 1
                              ? t('Deal')
                              : t('Deals')
                    }
                >
                    {context.primary_deal_id == null && deals.length > 1 ? (
                        <p className="mb-1 text-[12px] text-mute">
                            {t('inbox.context.select_deal')}
                        </p>
                    ) : null}
                    <div className="divide-y divide-hairline">
                        {(focusedDeal && context.primary_deal_id
                            ? [focusedDeal, ...deals.filter((deal) => deal.id !== focusedDeal.id)]
                            : deals
                        ).map((deal) => (
                            <DealRow
                                key={deal.id}
                                deal={deal}
                                focused={deal.id === focusedDealId}
                                onInspect={(dealId) =>
                                    setInspectState({
                                        threadId: context.thread_id,
                                        dealId,
                                    })
                                }
                            />
                        ))}
                    </div>
                </Section>
            ) : null}

            {attention?.primary ? (
                <Section title={t('Needs attention')}>
                    <p
                        className={cn(
                            'text-[13px]',
                            attentionToneClass(attention.primary.severity),
                        )}
                    >
                        {attention.primary.label}
                    </p>
                    {attention.primary.reason ? (
                        <p className="mt-0.5 text-[12px] text-mute">
                            {attention.primary.reason}
                        </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-2">
                        <ActionLink href="/crm/activities">{t('inbox.context.view_activity')}</ActionLink>
                        {focusedDeal ? (
                            <ActionLink href={focusedDeal.href}>{t('Open deal')}</ActionLink>
                        ) : null}
                        {context.capabilities.can_create_activity ? (
                            <ActionLink href="/crm/activities?create=1">
                                {t('inbox.context.create_activity')}
                            </ActionLink>
                        ) : null}
                    </div>
                </Section>
            ) : null}

            {context.last_activity ? (
                <Section title={t('Last activity')}>
                    <ActivityLine item={context.last_activity} />
                </Section>
            ) : null}

            {nextActivity ? (
                <Section title={t('inbox.context.next_activity')}>
                    <ActivityLine item={nextActivity} />
                </Section>
            ) : null}

            {context.tasks.length > 0 ? (
                <Section title={t('Tasks')}>
                    <div className="space-y-1">
                        {context.tasks.map((task) => (
                            <ActivityLine key={task.id ?? task.subject} item={task} />
                        ))}
                    </div>
                </Section>
            ) : null}

            {context.notes.length > 0 ? (
                <Section title={t('Notes')}>
                    <div className="space-y-1">
                        {context.notes.map((note) => (
                            <ActivityLine key={note.id ?? note.subject} item={note} />
                        ))}
                    </div>
                </Section>
            ) : null}

            {contact || focusedDeal ? (
                <div className="border-t border-hairline px-3 py-2.5">
                    <div className="flex flex-wrap gap-2">
                        {contact ? (
                            <ActionLink href={contact.href}>{t('Open contact')}</ActionLink>
                        ) : null}
                        {context.company ? (
                            <ActionLink href={context.company.href}>
                                {t('Open company')}
                            </ActionLink>
                        ) : null}
                        {focusedDeal ? (
                            <ActionLink href={focusedDeal.href}>{t('Open deal')}</ActionLink>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
