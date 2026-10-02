/**
 * Compatibility chrome for P13/P14/P26 source-locks.
 * Canonical implementation lives in @/evo/inbox.
 */
import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import {
    InboxCrmContext,
    InboxCrmContextError,
    InboxCrmContextSkeleton,
} from '@/components/crm/inbox-crm-context';
import { CRMContext } from '@/evo/crm/record';
import {
    InboxCaughtUpMark,
    InboxComposer,
    InboxConversationRow,
    InboxEmbedSkeleton,
    InboxFolderRail,
    InboxListHeader,
    InboxMessageThread,
    InboxPersonMark,
    InboxStatusBanner,
    formatInboxWhen,
} from '@/evo/inbox';
import { crmContextFromInbox } from '@/evo/inbox/context';
import { inboxContactName, inboxInitials } from '@/evo/inbox/names';
import type { InboxContact } from '@/evo/inbox/names';
import { t } from '@/lib/i18n';
import type { InboxCrmContextPayload } from '@/lib/inbox-crm-context';
import { shouldRenderInboxCrmContext } from '@/lib/inbox-crm-context';
import { cn } from '@/lib/utils';

export type InboxEmbedState = 'ok' | 'blocked' | 'unreachable' | 'no-url';
export type { InboxContact };

export type InboxFolder = {
    key: string;
    label: string;
    count: number | null;
};

export {
    InboxCaughtUpMark,
    InboxComposer,
    InboxConversationRow,
    InboxEmbedSkeleton,
    InboxFolderRail,
    InboxListHeader,
    InboxMessageThread,
    InboxPersonMark,
    InboxStatusBanner,
    formatInboxWhen,
    inboxContactName,
    inboxInitials,
};

export function InboxContactSidebar({
    contact,
    context,
    contextError,
    contextPending,
    requestedThreadId,
    selectedId,
    onRetry,
    onCollapse,
    className,
}: {
    contact?: InboxContact | null;
    context?: InboxCrmContextPayload | null;
    contextError?: string | null;
    contextPending?: boolean;
    requestedThreadId?: number | null;
    selectedId?: number | null;
    onRetry?: () => void;
    onCollapse?: () => void;
    className?: string;
}) {
    const facts: Array<{ label: string; value: ReactNode }> = contact
        ? [
              {
                  label: t('Email'),
                  value: contact.email ?? t('No email'),
              },
              {
                  label: t('Phone'),
                  value: contact.phone_e164 ?? t('No phone'),
              },
              {
                  label: t('Owner'),
                  value: contact.owner?.name ?? t('No owner'),
              },
              {
                  label: t('Company'),
                  value: contact.company ? (
                      <Link
                          href={`/crm/companies/${contact.company.id}`}
                          className="text-ink underline-offset-2 hover:underline"
                      >
                          {contact.company.name}
                      </Link>
                  ) : (
                      t('No company')
                  ),
              },
          ]
        : [];

    const renderContext = shouldRenderInboxCrmContext({
        contextThreadId: context?.thread_id,
        requestedThreadId: requestedThreadId ?? selectedId ?? context?.thread_id,
        selectedId: selectedId ?? context?.thread_id,
    });

    const title = contextPending
        ? t('Context')
        : context?.contact?.name ?? (contact ? inboxContactName(contact) : t('Context'));

    const record = renderContext ? crmContextFromInbox(context) : null;

    return (
        <aside
            aria-label={t('Contact')}
            data-inbox="context-host"
            data-inbox-pane="context"
            className={cn(
                'flex h-full min-h-0 w-full shrink-0 flex-col overflow-y-auto border-hairline bg-white lg:w-[17.5rem] lg:border-l',
                className,
            )}
        >
            <div className="flex items-start justify-between gap-2 border-b border-hairline px-3 py-2.5">
                <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium text-ink">{title}</p>
                    <p className="mt-0.5 text-[11px] text-mute">{t('Contact')}</p>
                </div>
                {onCollapse ? (
                    <button
                        type="button"
                        onClick={onCollapse}
                        className="shrink-0 text-[11px] text-mute hover:text-ink"
                    >
                        {t('Hide')}
                    </button>
                ) : null}
            </div>
            {contextPending ? <InboxCrmContextSkeleton /> : null}
            {!contextPending && contextError ? (
                <InboxCrmContextError onRetry={onRetry} />
            ) : null}
            {!contextPending && !contextError && renderContext && context ? (
                <>
                    <CRMContext record={record} empty={t('No CRM context')} />
                    <InboxCrmContext context={context} />
                </>
            ) : null}
            {!contextPending &&
            !contextError &&
            !context &&
            contact &&
            facts.length > 0 ? (
                <>
                    <dl className="divide-y divide-hairline">
                        {facts.map((fact) => (
                            <div key={fact.label} className="px-3 py-2">
                                <dt className="text-[10px] tracking-[0.06em] text-mute uppercase">
                                    {fact.label}
                                </dt>
                                <dd className="mt-0.5 truncate text-[12px] text-ink">
                                    {fact.value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                    <div className="px-3 py-2">
                        <Link
                            href={`/crm/contacts/${contact.id}`}
                            className="text-[12px] font-medium text-brand underline-offset-2 hover:underline"
                        >
                            {t('Open contact')}
                        </Link>
                    </div>
                </>
            ) : null}
        </aside>
    );
}
