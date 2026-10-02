/* eslint-disable react-hooks/incompatible-library -- TanStack Virtual is the approved inbox thread virtualizer */
import { useVirtualizer } from '@tanstack/react-virtual';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { Attachment } from '@/evo/inbox/Attachment';
import { formatInboxClock, formatInboxDay, inboxDayKey } from '@/evo/inbox/format';
import type { InboxMessage } from '@/evo/inbox/types';
import { cn } from '@/evo/lib/cn';
import { t } from '@/lib/i18n';

function statusLabel(status?: string): string {
    if (!status) {
        return '';
    }

    switch (status) {
        case 'sent':
        case 'queued':
        case 'logged':
        case 'received':
        case 'delivered':
        case 'read':
        case 'failed':
            return t(status);
        default:
            return status;
    }
}

export function MessageBubble({ message }: { message: InboxMessage }) {
    const note = message.kind === 'note' || message.direction === 'internal';
    const outbound = message.direction === 'outbound';

    return (
        <div
            data-inbox="message"
            data-kind={note ? 'note' : 'message'}
            className={cn(
                'max-w-[78%] rounded-[var(--evo-radius-standard)] px-3 py-2 text-[13px] leading-5',
                note
                    ? 'border border-dashed border-[var(--evo-hairline-strong)] bg-[var(--evo-surface-subtle)] text-[var(--evo-ink)]'
                    : outbound
                      ? 'ms-auto border border-[var(--evo-hairline)] bg-[var(--evo-surface)] text-[var(--evo-ink)]'
                      : 'bg-[var(--evo-surface)] text-[var(--evo-ink)]',
            )}
        >
            {note ? (
                <p className="mb-1 text-[10px] font-medium tracking-[0.04em] text-[var(--evo-ink-muted)] uppercase">
                    {t('Private note, only visible to agents')}
                </p>
            ) : null}
            <p className="whitespace-pre-wrap" dir="auto">
                {message.body}
            </p>
            {message.attachments?.length ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {message.attachments.map((file) => (
                        <Attachment key={file.id} file={file} />
                    ))}
                </div>
            ) : null}
            {message.status === 'failed' && message.failureReason ? (
                <p role="status" className="mt-1 text-[11px] text-[var(--evo-danger)]">
                    {message.failureReason}
                </p>
            ) : null}
            <p className="mt-1 font-mono text-[10px] text-[var(--evo-ink-muted)] tabular-nums">
                {formatInboxClock(message.at)}
                {message.status ? ` · ${statusLabel(message.status)}` : ''}
            </p>
        </div>
    );
}

type ThreadItem =
    | { type: 'day'; id: string; label: string }
    | { type: 'message'; id: string; message: InboxMessage };

export function MessageThread({
    threadId,
    messages,
}: {
    threadId?: string | number;
    messages: InboxMessage[];
}) {
    const parentRef = useRef<HTMLDivElement>(null);

    const items = useMemo<ThreadItem[]>(() => {
        const chronological = messages.slice().sort((a, b) => a.at.localeCompare(b.at));
        const next: ThreadItem[] = [];
        let lastDay = '';

        for (const message of chronological) {
            const day = inboxDayKey(message.at);

            if (day && day !== lastDay) {
                next.push({
                    type: 'day',
                    id: `day-${day}`,
                    label: formatInboxDay(message.at),
                });
                lastDay = day;
            }

            next.push({
                type: 'message',
                id: `msg-${message.id}`,
                message,
            });
        }

        return next;
    }, [messages]);

    const virtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => parentRef.current,
        estimateSize: (index) => (items[index]?.type === 'day' ? 28 : 88),
        overscan: 12,
    });

    useLayoutEffect(() => {
        if (items.length === 0) {
            return;
        }

        virtualizer.scrollToIndex(items.length - 1, { align: 'end' });
    }, [threadId, items.length, virtualizer]);

    return (
        <div
            ref={parentRef}
            data-inbox="thread"
            data-inbox-pane="thread"
            className="min-h-0 flex-1 overflow-y-auto bg-[var(--evo-canvas)] p-3"
        >
            <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
                {virtualizer.getVirtualItems().map((row) => {
                    const item = items[row.index];

                    return (
                        <div
                            key={item.id}
                            data-index={row.index}
                            ref={virtualizer.measureElement}
                            className="absolute top-0 start-0 w-full pb-1.5"
                            style={{ transform: `translateY(${row.start}px)` }}
                        >
                            {item.type === 'day' ? (
                                <p className="mb-1.5 text-center font-mono text-[10px] text-[var(--evo-ink-muted)] tabular-nums">
                                    {item.label}
                                </p>
                            ) : (
                                <MessageBubble message={item.message} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function InboxMessageThread({
    threadId,
    messages,
}: {
    threadId: number;
    messages: Array<{
        id: number;
        direction: string;
        type?: string;
        body: string;
        status: string;
        failure_reason?: string | null;
        created_at: string;
        user?: { name: string } | null;
    }>;
}) {
    return (
        <MessageThread
            threadId={threadId}
            messages={messages.map((message) => ({
                id: message.id,
                body: message.body,
                at: message.created_at,
                direction:
                    message.type === 'note' || message.direction === 'internal'
                        ? 'internal'
                        : message.direction === 'outbound'
                          ? 'outbound'
                          : 'inbound',
                kind: message.type === 'note' ? 'note' : 'message',
                status: message.status,
                failureReason: message.failure_reason ?? null,
                author: message.user?.name ?? null,
            }))}
        />
    );
}
