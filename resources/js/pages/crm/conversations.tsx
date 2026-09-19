import { Form, Link, router } from '@inertiajs/react';
import { Tray } from '@phosphor-icons/react';
import { DeskShell } from '@/components/crm/desk-shell';
import {
    InboxCaughtUpMark,
    InboxContactSidebar,
    InboxPersonMark,
    formatInboxWhen,
    inboxContactName,
    inboxInitials,
} from '@/components/crm/inbox-chrome';
import type { InboxContact } from '@/components/crm/inbox-chrome';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { t } from '@/lib/i18n';
import { MOTION_HOVER_CLASS } from '@/lib/motion';
import { cn } from '@/lib/utils';

type Contact = InboxContact & {
    deals?: { id: number; title: string; stage?: { name: string } }[];
};

type Thread = {
    id: number;
    status: string;
    unread_count?: number;
    last_message_at?: string | null;
    subject?: string | null;
    contact: Contact;
    channel?: { name: string; type: string };
    messages?: {
        id: number;
        direction: string;
        body: string;
        status: string;
        failure_reason?: string | null;
        created_at: string;
    }[];
};

type Props = {
    threads: Thread[];
    selected: Thread | null;
};

export default function ConversationHistory({ threads, selected }: Props) {
    return (
        <DeskShell title="Conversations">
            <div
                className="flex h-full min-h-0 flex-col bg-canvas-soft text-[13px] text-ink"
                data-crm="conversations-workspace"
            >
                {threads.length === 0 ? (
                    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-10">
                        <InboxCaughtUpMark />
                        <EmptyState
                            as="h2"
                            icon={<Tray className="size-6" weight="regular" />}
                            title={t('No conversation history')}
                            description={t("You're all caught up. Threads appear after official Desk traffic.")}
                            action={
                                <Button asChild>
                                    <Link href="/inbox">{t('Open inbox')}</Link>
                                </Button>
                            }
                            className="border-0"
                        />
                    </div>
                ) : (
                    <div className="grid min-h-0 flex-1 gap-px overflow-hidden bg-hairline lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]">
                        <section
                            aria-label="Conversations"
                            className="min-h-0 overflow-y-auto bg-white"
                        >
                            <div className="flex items-center justify-between border-b border-hairline px-3 py-1.5">
                                <p className="text-[12px] font-medium text-ink">
                                    {t('History')}
                                </p>
                                <div className="flex items-center gap-3">
                                    <Link
                                        href="/inbox"
                                        className="text-[12px] font-medium text-brand underline-offset-2 hover:underline"
                                    >
                                        {t('Open inbox')}
                                    </Link>
                                    <span className="font-mono text-[11px] tabular-nums text-mute">
                                        {threads.length}
                                    </span>
                                </div>
                            </div>
                            <ul>
                                {threads.map((thread) => (
                                    <li key={thread.id}>
                                        <button
                                            type="button"
                                            className={cn(
                                                'flex w-full items-start gap-2.5 border-b border-hairline px-3 py-2 text-left',
                                                MOTION_HOVER_CLASS,
                                                selected?.id === thread.id
                                                    ? 'bg-canvas-soft'
                                                    : 'hover:bg-canvas-soft',
                                            )}
                                            onClick={() =>
                                                router.get(
                                                    '/conversations',
                                                    { thread: thread.id },
                                                    { preserveState: true },
                                                )
                                            }
                                        >
                                            <InboxPersonMark
                                                name={inboxContactName(
                                                    thread.contact,
                                                )}
                                                initials={inboxInitials(
                                                    thread.contact,
                                                )}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-baseline justify-between gap-2">
                                                    <span className="truncate text-[13px] font-medium text-ink">
                                                        {inboxContactName(
                                                            thread.contact,
                                                        )}
                                                    </span>
                                                    {(thread.unread_count ??
                                                        0) > 0 ? (
                                                        <Badge
                                                            variant="secondary"
                                                            className="h-4 rounded-none px-1 font-mono text-[10px]"
                                                        >
                                                            {
                                                                thread.unread_count
                                                            }
                                                        </Badge>
                                                    ) : null}
                                                </div>
                                                <p className="truncate text-[11px] text-mute">
                                                    {thread.contact.company
                                                        ?.name ?? 'No company'}
                                                </p>
                                                <p className="mt-0.5 truncate text-[12px] text-mute">
                                                    {thread.messages?.[0]
                                                        ?.body ??
                                                        thread.subject ??
                                                        'No preview'}
                                                </p>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section
                            aria-label="Conversation"
                            className="flex min-h-0 min-w-0 bg-white"
                        >
                            {selected ? (
                                <>
                                    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                                        <header className="border-b border-hairline px-3 py-2">
                                            <h2 className="truncate text-[13px] font-semibold text-ink">
                                                {inboxContactName(
                                                    selected.contact,
                                                )}
                                            </h2>
                                            <p className="truncate text-[11px] text-mute">
                                                {selected.contact.company
                                                    ?.name ?? 'No company'}{' '}
                                                ·{' '}
                                                {selected.contact.phone_e164 ??
                                                    'No phone'}
                                                {selected.last_message_at
                                                    ? ` · ${formatInboxWhen(selected.last_message_at)}`
                                                    : ''}
                                            </p>
                                        </header>
                                        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto bg-canvas-soft p-3">
                                            {(selected.messages ?? []).map(
                                                (message) => (
                                                    <div
                                                        key={message.id}
                                                        className="bg-white px-3 py-2"
                                                    >
                                                        <p className="font-mono text-[10px] tracking-[0.04em] text-mute uppercase">
                                                            {message.direction}{' '}
                                                            · {message.status}
                                                            {message.failure_reason
                                                                ? ` · ${message.failure_reason}`
                                                                : ''}
                                                        </p>
                                                        <p className="mt-1 text-[13px] leading-5 text-ink">
                                                            {message.body}
                                                        </p>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                        <Form
                                            action={`/desk/threads/${selected.id}/reply`}
                                            method="post"
                                            className="flex gap-2 border-t border-hairline bg-white p-3"
                                            resetOnSuccess={['body']}
                                        >
                                            {({ processing }) => (
                                                <>
                                                    <Input
                                                        name="body"
                                                        placeholder="Log a session reply"
                                                        required
                                                        className="h-8 rounded-none"
                                                    />
                                                    <Button
                                                        disabled={processing}
                                                    >
                                                        Send
                                                    </Button>
                                                </>
                                            )}
                                        </Form>
                                        <div className="border-t border-hairline px-3 py-2 text-[12px]">
                                            <p className="font-medium text-ink">
                                                Open deal
                                            </p>
                                            {(selected.contact.deals ?? [])
                                                .length === 0 ? (
                                                <p className="mt-0.5 text-mute">
                                                    No open deal on this
                                                    contact.
                                                </p>
                                            ) : (
                                                selected.contact.deals?.map(
                                                    (deal) => (
                                                        <Link
                                                            key={deal.id}
                                                            href={`/crm/deals/${deal.id}`}
                                                            className="mt-0.5 block text-brand underline-offset-2 hover:underline"
                                                        >
                                                            {deal.title} ·{' '}
                                                            {deal.stage?.name}
                                                        </Link>
                                                    ),
                                                )
                                            )}
                                        </div>
                                    </div>
                                    <InboxContactSidebar
                                        contact={selected.contact}
                                    />
                                </>
                            ) : (
                                <div className="grid flex-1 place-items-center px-6 py-10">
                                    <EmptyState
                                        as="h2"
                                        icon={
                                            <Tray
                                                className="size-6"
                                                weight="regular"
                                            />
                                        }
                                        title={t('Select a conversation')}
                                        description="See contact and deal context from the sold Desk."
                                        className="border-0"
                                    />
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </DeskShell>
    );
}

ConversationHistory.layout = {
    breadcrumbs: [{ title: 'Conversations', href: '/conversations' }],
};
