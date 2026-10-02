import { Link, router } from '@inertiajs/react';
import { Tray } from '@phosphor-icons/react';
import { useState } from 'react';
import { DeskShell } from '@/components/crm/desk-shell';
import {
    InboxCaughtUpMark,
    InboxComposer,
    InboxContactSidebar,
    InboxMessageThread,
    formatInboxWhen,
    inboxContactName,
} from '@/components/crm/inbox-chrome';
import type { InboxContact } from '@/components/crm/inbox-chrome';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ConversationList } from '@/evo/inbox';
import { deskThreadToConversation } from '@/evo/inbox/adapters';
import { t } from '@/lib/i18n';

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
    const [mode, setMode] = useState<'reply' | 'note'>('reply');

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
                            className="flex min-h-0 flex-col bg-white"
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
                            <ConversationList
                                conversations={threads.map(deskThreadToConversation)}
                                selectedId={selected?.id}
                                onSelect={(id) =>
                                    router.get(
                                        '/conversations',
                                        { thread: id },
                                        { preserveState: true },
                                    )
                                }
                                showFilters={false}
                            />
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
                                        <InboxMessageThread
                                            threadId={selected.id}
                                            messages={selected.messages ?? []}
                                        />
                                        <p className="sr-only">
                                            Log a session reply
                                        </p>
                                        <InboxComposer
                                            threadId={selected.id}
                                            mode={mode}
                                            onModeChange={setMode}
                                        />
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
