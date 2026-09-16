import { Form, Link } from '@inertiajs/react';
import { Tray } from '@phosphor-icons/react';
import { useLayoutEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { contactInitials, formatContactName } from '@/lib/contact-name';
import { dateLocale, t } from '@/lib/i18n';
import { formatInboxDay, groupInboxMessages } from '@/lib/inbox-workspace';
import type { InboxMessage } from '@/lib/inbox-workspace';
import { cn } from '@/lib/utils';

export type InboxEmbedState = 'ok' | 'blocked' | 'unreachable' | 'no-url';

export type InboxContact = {
    id: number;
    first_name: string;
    last_name?: string | null;
    email?: string | null;
    phone_e164?: string | null;
    company?: { id: number; name: string } | null;
    owner?: { id: number; name: string } | null;
};

export type InboxFolder = {
    key: string;
    label: string;
    count: number | null;
};

const ALGIERS = 'Africa/Algiers';

export function inboxContactName(contact?: InboxContact | null): string {
    if (!contact) {
        return t('Unknown');
    }

    return formatContactName(contact.first_name, contact.last_name);
}

export function inboxInitials(contact?: InboxContact | null): string {
    if (!contact) {
        return '?';
    }

    return contactInitials(contact.first_name, contact.last_name);
}

export function formatInboxWhen(iso?: string | null): string {
    if (!iso) {
        return '';
    }

    try {
        return new Intl.DateTimeFormat(dateLocale(), {
            timeZone: ALGIERS,
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(iso));
    } catch {
        return iso.slice(0, 10);
    }
}

export function InboxPersonMark({
    name,
    initials,
    size = 'sm',
}: {
    name: string;
    initials: string;
    size?: 'sm' | 'md';
}) {
    return (
        <span
            aria-hidden
            title={name}
            className={cn(
                'grid shrink-0 place-items-center bg-canvas-soft font-medium text-ink',
                size === 'md' ? 'size-8 text-[11px]' : 'size-7 text-[10px]',
            )}
        >
            {initials || '?'}
        </span>
    );
}

export function InboxStatusBanner({
    embedState,
    embedReason,
    configuredUrl,
}: {
    embedState: InboxEmbedState;
    embedReason: string | null;
    configuredUrl: string | null;
}) {
    if (embedState === 'ok' || embedState === 'no-url') {
        return null;
    }

    const host = configuredUrl ? safeHost(configuredUrl) : 'Desk';
    const title =
        embedState === 'blocked'
            ? `${host} is not framed here`
            : `${host} could not be reached`;

    return (
        <div
            role="status"
            data-crm="inbox-embed-banner"
            className="border-b border-hairline bg-white px-4 py-2 text-[12px] leading-5 text-mute"
        >
            <p>
                <span className="font-medium text-ink">{title}.</span>{' '}
                {embedReason ??
                    'Showing the CRM inbox. Desk stays on this host.'}
            </p>
        </div>
    );
}

export function InboxFolderRail({
    folders,
    folder,
    onSelect,
}: {
    folders: InboxFolder[];
    folder: string;
    onSelect: (key: string) => void;
}) {
    return (
        <nav
            aria-label={t('Inbox folders')}
            data-inbox-pane="nav"
            className="px-2 py-2"
        >
            <p className="px-2 pb-1.5 text-[10px] font-medium tracking-[0.08em] text-mute uppercase">
                {t('Inbox')}
            </p>
            <ul>
                {folders.map((item) => {
                    const active = folder === item.key;

                    return (
                        <li key={item.key}>
                            <button
                                type="button"
                                onClick={() => onSelect(item.key)}
                                className={cn(
                                    'flex w-full items-center justify-between gap-2 px-2 py-1 text-left text-[12px] transition-colors duration-150',
                                    active
                                        ? 'bg-canvas-soft font-medium text-ink'
                                        : 'text-mute hover:bg-canvas-soft hover:text-ink',
                                )}
                            >
                                <span className="truncate">{t(item.label)}</span>
                                {item.count !== null ? (
                                    <span className="font-mono text-[11px] tabular-nums">
                                        {item.count}
                                    </span>
                                ) : null}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

export function InboxContactSidebar({
    contact,
    onCollapse,
    className,
}: {
    contact: InboxContact;
    onCollapse?: () => void;
    className?: string;
}) {
    const facts: Array<{ label: string; value: ReactNode }> = [
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
    ];

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
                    <p className="text-[12px] font-medium text-ink">
                        {inboxContactName(contact)}
                    </p>
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
        </aside>
    );
}

export function InboxEmbedSkeleton() {
    return (
        <div
            aria-busy="true"
            aria-label={t('Loading desk')}
            className="absolute inset-0 z-10 grid grid-cols-[13rem_minmax(18rem,22rem)_minmax(0,1fr)] gap-px bg-hairline"
        >
            <div className="bg-white p-3">
                {Array.from({ length: 8 }).map((_, index) => (
                    <div
                        key={`folder-${index}`}
                        className="mb-2 h-3 animate-pulse bg-canvas-soft"
                    />
                ))}
            </div>
            <div className="bg-white">
                {Array.from({ length: 9 }).map((_, index) => (
                    <div
                        key={`row-${index}`}
                        className="flex items-center gap-2 border-b border-hairline px-3 py-2.5"
                    >
                        <div className="size-7 shrink-0 animate-pulse bg-canvas-soft" />
                        <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="h-2.5 w-2/3 animate-pulse bg-canvas-soft" />
                            <div className="h-2 w-full animate-pulse bg-canvas-soft" />
                        </div>
                    </div>
                ))}
            </div>
            <div className="bg-white p-4">
                <div className="mb-4 h-4 w-40 animate-pulse bg-canvas-soft" />
                <div className="h-16 w-3/5 animate-pulse bg-canvas-soft" />
                <div className="mt-3 ml-auto h-12 w-2/5 animate-pulse bg-canvas-soft" />
            </div>
        </div>
    );
}

export function InboxCaughtUpMark() {
    return (
        <span
            aria-hidden
            className="mx-auto mb-3 grid size-10 place-items-center border border-dashed border-hairline bg-canvas-soft text-mute"
        >
            <Tray className="size-5" weight="regular" />
        </span>
    );
}

export function InboxListHeader({
    query,
    count,
    onQueryChange,
}: {
    query: string;
    count: number;
    onQueryChange: (value: string) => void;
}) {
    return (
        <div
            data-inbox="conversation-list-header"
            className="border-b border-hairline px-3 py-1.5"
        >
            <div className="flex items-center justify-between gap-2">
                <p className="text-[12px] font-medium text-ink">{t('Inbox')}</p>
                <p className="font-mono text-[11px] tabular-nums text-mute">
                    {count}
                </p>
            </div>
            <label className="mt-1.5 block">
                <span className="sr-only">{t('Filter loaded conversations')}</span>
                <Input
                    type="search"
                    value={query}
                    onChange={(event) => onQueryChange(event.target.value)}
                    placeholder={t('Filter by name or subject')}
                    className="h-7 rounded-none text-[12px]"
                    autoComplete="off"
                />
            </label>
        </div>
    );
}

export function InboxConversationRow({
    name,
    initials,
    when,
    preview,
    channel,
    unread,
    selected,
    onSelect,
}: {
    name: string;
    initials: string;
    when: string;
    preview: string;
    channel: string;
    unread: number;
    selected: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            data-inbox="conversation-row"
            aria-current={selected ? 'true' : undefined}
            className={cn(
                'flex w-full items-start gap-2.5 border-b border-hairline px-3 py-1.5 text-left transition-colors duration-150',
                selected ? 'bg-canvas-soft' : 'hover:bg-canvas-soft',
            )}
        >
            <InboxPersonMark name={name} initials={initials} />
            <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                    <span
                        className={cn(
                            'truncate text-[13px] text-ink',
                            unread > 0 ? 'font-semibold' : 'font-medium',
                        )}
                    >
                        {name}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] tabular-nums text-mute">
                        {when}
                    </span>
                </div>
                <p className="mt-0.5 truncate text-[12px] text-mute">{preview}</p>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-mute">
                    <span className="truncate">{channel}</span>
                    {unread > 0 ? (
                        <Badge
                            variant="default"
                            className="h-4 min-w-4 rounded-none px-1 font-mono text-[10px]"
                        >
                            {unread}
                        </Badge>
                    ) : null}
                </div>
            </div>
        </button>
    );
}

export function InboxMessageThread({
    threadId,
    messages,
}: {
    threadId: number;
    messages: InboxMessage[];
}) {
    const endRef = useRef<HTMLDivElement>(null);
    const groups = groupInboxMessages(messages);

    useLayoutEffect(() => {
        endRef.current?.scrollIntoView({ block: 'end' });
    }, [threadId, messages.length]);

    return (
        <div
            data-inbox="thread"
            data-inbox-pane="thread"
            className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-canvas-soft p-3"
        >
            {groups.map((group) => (
                <section key={`${group.day}-${group.kind}-${group.messages[0]?.id}`}>
                    <p className="mb-1.5 text-center font-mono text-[10px] tabular-nums text-mute">
                        {formatInboxDay(group.messages[0]?.created_at)}
                    </p>
                    <div className="space-y-1">
                        {group.messages.map((message, index) => {
                            const last = index === group.messages.length - 1;
                            const note = message.type === 'note';
                            const outbound = message.direction === 'outbound';

                            return (
                                <div
                                    key={message.id}
                                    data-inbox="message"
                                    className={cn(
                                        'max-w-[78%] px-3 py-2 text-[13px] leading-5',
                                        note
                                            ? 'bg-white text-ink'
                                            : outbound
                                              ? 'ml-auto border border-hairline bg-white text-ink'
                                              : 'bg-white text-ink',
                                    )}
                                >
                                    {note ? (
                                        <p className="mb-1 text-[10px] font-medium tracking-[0.04em] text-mute uppercase">
                                            {t(
                                                'Private note, only visible to agents',
                                            )}
                                        </p>
                                    ) : null}
                                    <p className="whitespace-pre-wrap">{message.body}</p>
                                    {message.status === 'failed' &&
                                    message.failure_reason ? (
                                        <p
                                            role="status"
                                            className="mt-1 text-[11px] text-destructive"
                                        >
                                            {message.failure_reason}
                                        </p>
                                    ) : null}
                                    {last ? (
                                        <p className="mt-1 font-mono text-[10px] tabular-nums text-mute">
                                            {formatInboxWhen(message.created_at)}
                                            {message.status === 'sent' ||
                                            message.status === 'queued' ||
                                            message.status === 'logged' ||
                                            message.status === 'received'
                                                ? ` · ${message.status}`
                                                : message.status === 'failed'
                                                  ? ` · ${message.status}`
                                                  : ''}
                                        </p>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                </section>
            ))}
            <div ref={endRef} />
        </div>
    );
}

export function InboxComposer({
    threadId,
    mode,
    onModeChange,
}: {
    threadId: number;
    mode: 'reply' | 'note';
    onModeChange: (mode: 'reply' | 'note') => void;
}) {
    return (
        <Form
            key={threadId}
            action={`/desk/threads/${threadId}/reply`}
            method="post"
            resetOnSuccess={['body']}
            data-inbox="composer"
        >
            {({ processing, errors }) => (
                <div className="border-t border-hairline bg-white p-3">
                    <div className="mb-2 flex gap-3">
                        <button
                            type="button"
                            onClick={() => onModeChange('reply')}
                            className={
                                mode === 'reply'
                                    ? 'border-b-2 border-brand pb-0.5 text-[12px] font-medium text-ink'
                                    : 'text-[12px] text-mute'
                            }
                        >
                            {t('Reply')}
                        </button>
                        <button
                            type="button"
                            onClick={() => onModeChange('note')}
                            className={
                                mode === 'note'
                                    ? 'border-b-2 border-brand pb-0.5 text-[12px] font-medium text-ink'
                                    : 'text-[12px] text-mute'
                            }
                        >
                            {t('Note')}
                        </button>
                    </div>
                    {mode === 'note' ? (
                        <input type="hidden" name="as_note" value="1" />
                    ) : null}
                    <Textarea
                        name="body"
                        required
                        placeholder={
                            mode === 'note'
                                ? t('Private note')
                                : t('Type your message')
                        }
                        className="max-h-32 min-h-16 rounded-none"
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' && !event.shiftKey) {
                                event.preventDefault();
                                event.currentTarget.form?.requestSubmit();
                            }
                        }}
                    />
                    {errors.body ? (
                        <p role="alert" className="mt-1 text-[12px] text-destructive">
                            {errors.body}
                        </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap justify-end gap-2">
                        {mode === 'reply' ? (
                            <>
                                <Button
                                    type="submit"
                                    name="resolve"
                                    value="1"
                                    variant="outline"
                                    disabled={processing}
                                >
                                    {t('Send as resolved')}
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {t('Send')}
                                </Button>
                            </>
                        ) : (
                            <Button type="submit" disabled={processing}>
                                {t('Add note')}
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </Form>
    );
}

function safeHost(url: string): string {
    try {
        return new URL(url).host;
    } catch {
        return url;
    }
}
