import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { CRMContext } from '@/evo/crm/record';
import type { CRMContextRecord } from '@/evo/crm/record';
import { Tray } from '@/evo/icons';
import { inboxChannelLabel } from '@/evo/inbox/channel';
import { ChannelFilter } from '@/evo/inbox/ChannelFilter';
import { Composer } from '@/evo/inbox/Composer';
import { ConversationList } from '@/evo/inbox/ConversationList';
import { InboxPersonMark } from '@/evo/inbox/marks';
import { MessageThread } from '@/evo/inbox/MessageThread';
import { QueueNavigation } from '@/evo/inbox/QueueNavigation';
import type {
    InboxAssignment,
    InboxComposeMode,
    InboxComposerSubmit,
    InboxConversation,
    InboxQueueItem,
    InboxTemplate,
} from '@/evo/inbox/types';
import { cn } from '@/evo/lib/cn';
import { EmptyState } from '@/evo/patterns/empty-state';
import { t } from '@/lib/i18n';

export function InboxWorkspace({
    conversations,
    selectedId,
    onSelect,
    queues,
    queueKey = 'all',
    onQueueChange,
    channel,
    onChannelChange,
    assignment,
    onAssignmentChange,
    query,
    onQueryChange,
    context,
    composerAction,
    onCompose,
    templates,
    allowResolve = true,
    empty,
    headerExtra,
    initialMode = 'reply',
    defaultPickerOpen = false,
    className,
}: {
    conversations: InboxConversation[];
    selectedId?: string | number | null;
    onSelect: (id: string | number) => void;
    queues?: InboxQueueItem[];
    queueKey?: string;
    onQueueChange?: (key: string) => void;
    channel?: string | null;
    onChannelChange?: (channel: string | null) => void;
    assignment?: InboxAssignment;
    onAssignmentChange?: (value: InboxAssignment) => void;
    query?: string;
    onQueryChange?: (value: string) => void;
    context?: CRMContextRecord | null;
    composerAction?: string;
    onCompose?: (payload: InboxComposerSubmit) => void;
    templates?: InboxTemplate[];
    allowResolve?: boolean;
    empty?: { title?: string; description?: string };
    headerExtra?: ReactNode;
    initialMode?: InboxComposeMode;
    defaultPickerOpen?: boolean;
    className?: string;
}) {
    const [mode, setMode] = useState<InboxComposeMode>(initialMode);
    const selected = useMemo(
        () => conversations.find((row) => String(row.id) === String(selectedId)) ?? null,
        [conversations, selectedId],
    );

    return (
        <div
            className={cn(
                'flex min-h-0 flex-1 overflow-hidden bg-[var(--evo-canvas)] text-[13px] text-[var(--evo-ink)]',
                className,
            )}
            data-evo="inbox-workspace"
        >
            {queues && onQueueChange ? (
                <aside className="hidden w-[13.75rem] shrink-0 border-r border-[var(--evo-hairline)] bg-[var(--evo-surface)] lg:block">
                    <QueueNavigation
                        queues={queues}
                        activeKey={queueKey}
                        onSelect={onQueueChange}
                    />
                </aside>
            ) : null}
            <div className="flex min-h-0 min-w-[17.5rem] w-[21.25rem] shrink-0 flex-col border-r border-[var(--evo-hairline)]">
                {onChannelChange && !onQueryChange ? (
                    <div className="border-b border-[var(--evo-hairline)] px-3 py-2">
                        <ChannelFilter value={channel} onChange={onChannelChange} />
                    </div>
                ) : null}
                <ConversationList
                    conversations={conversations}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    query={query}
                    onQueryChange={onQueryChange}
                    channel={channel}
                    onChannelChange={onChannelChange}
                    assignment={assignment}
                    onAssignmentChange={onAssignmentChange}
                    emptyTitle={empty?.title}
                    emptyDescription={empty?.description}
                />
            </div>
            <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--evo-surface)]">
                {selected ? (
                    <>
                        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--evo-hairline)] px-3 py-2">
                            <div className="flex min-w-0 items-center gap-2.5">
                                <InboxPersonMark
                                    name={selected.participant.name}
                                    initials={selected.participant.initials ?? selected.participant.name.slice(0, 1)}
                                    size="md"
                                />
                                <div className="min-w-0">
                                    <h2 className="truncate text-[13px] font-semibold">
                                        {selected.participant.name}
                                    </h2>
                                    <p className="truncate text-[11px] text-[var(--evo-ink-muted)]">
                                        {selected.participant.owner ?? t('Unassigned')}
                                        {' · '}
                                        {inboxChannelLabel(selected.channel)}
                                        {selected.participant.phone
                                            ? ` · ${selected.participant.phone}`
                                            : ''}
                                    </p>
                                </div>
                            </div>
                            {headerExtra}
                        </header>
                        <MessageThread
                            threadId={selected.id}
                            messages={selected.messages ?? []}
                        />
                        <Composer
                            threadId={selected.id}
                            mode={mode}
                            onModeChange={setMode}
                            channel={selected.channel}
                            templates={templates}
                            action={composerAction}
                            onSubmit={onCompose}
                            allowResolve={allowResolve}
                            defaultPickerOpen={defaultPickerOpen}
                        />
                    </>
                ) : (
                    <div className="grid flex-1 place-items-center px-5 py-8">
                        <EmptyState
                            density="panel"
                            icon={<Tray className="size-6" />}
                            title={t('Select a conversation')}
                            description={t("You're all caught up.")}
                        />
                    </div>
                )}
            </section>
            <div className="hidden min-h-0 w-[17.5rem] shrink-0 overflow-y-auto bg-[var(--evo-surface)] xl:block">
                <CRMContext record={context} empty="No CRM context" />
            </div>
        </div>
    );
}
