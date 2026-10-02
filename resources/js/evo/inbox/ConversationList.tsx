/* eslint-disable react-hooks/incompatible-library -- TanStack Virtual is the approved inbox list virtualizer */
import { useVirtualizer } from '@tanstack/react-virtual';
import { useMemo, useRef } from 'react';
import { Tray } from '@/evo/icons';
import { ChannelFilter } from '@/evo/inbox/ChannelFilter';
import { ConversationRow } from '@/evo/inbox/ConversationRow';
import { InboxListHeader } from '@/evo/inbox/marks';
import type { InboxAssignment, InboxConversation } from '@/evo/inbox/types';
import { cn } from '@/evo/lib/cn';
import { EmptyState } from '@/evo/patterns/empty-state';
import { SegmentedControl, SegmentedControlItem } from '@/evo/ui/segmented-control';
import { t } from '@/lib/i18n';

const ROW_ESTIMATE = 72;

export function ConversationList({
    conversations,
    selectedId,
    onSelect,
    query,
    onQueryChange,
    channel,
    onChannelChange,
    assignment,
    onAssignmentChange,
    showFilters = true,
    emptyTitle,
    emptyDescription,
    className,
}: {
    conversations: InboxConversation[];
    selectedId?: string | number | null;
    onSelect: (id: string | number) => void;
    query?: string;
    onQueryChange?: (value: string) => void;
    channel?: string | null;
    onChannelChange?: (channel: string | null) => void;
    assignment?: InboxAssignment;
    onAssignmentChange?: (value: InboxAssignment) => void;
    showFilters?: boolean;
    emptyTitle?: string;
    emptyDescription?: string;
    className?: string;
}) {
    const parentRef = useRef<HTMLDivElement>(null);

    const rows = useMemo(() => conversations, [conversations]);

    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ROW_ESTIMATE,
        overscan: 8,
    });

    return (
        <div
            className={cn('flex min-h-0 flex-1 flex-col bg-[var(--evo-surface)]', className)}
            data-inbox="conversation-list"
            data-inbox-pane="list"
        >
            {onQueryChange ? (
                <InboxListHeader
                    query={query ?? ''}
                    count={rows.length}
                    onQueryChange={onQueryChange}
                />
            ) : null}
            {showFilters ? (
                <div className="space-y-2 border-b border-[var(--evo-hairline)] px-3 py-2">
                    {onAssignmentChange ? (
                        <SegmentedControl
                            type="single"
                            size="sm"
                            layout="fill"
                            value={assignment ?? 'all'}
                            onValueChange={(value) => {
                                if (value) {
                                    onAssignmentChange(value as InboxAssignment);
                                }
                            }}
                            aria-label={t('Assignment')}
                        >
                            <SegmentedControlItem value="all">{t('All')}</SegmentedControlItem>
                            <SegmentedControlItem value="mine">
                                {t('Assigned to me')}
                            </SegmentedControlItem>
                            <SegmentedControlItem value="unassigned">
                                {t('Unassigned')}
                            </SegmentedControlItem>
                        </SegmentedControl>
                    ) : null}
                    {onChannelChange ? (
                        <ChannelFilter value={channel} onChange={onChannelChange} />
                    ) : null}
                </div>
            ) : null}
            {rows.length === 0 ? (
                <div className="grid flex-1 place-items-center px-4 py-10">
                    <EmptyState
                        density="panel"
                        icon={<Tray className="size-6" weight="regular" />}
                        title={emptyTitle ?? t('No open conversations here')}
                        description={emptyDescription ?? t("You're all caught up.")}
                    />
                </div>
            ) : (
                <div ref={parentRef} className="min-h-0 flex-1 overflow-y-auto">
                    <div
                        className="relative w-full"
                        style={{ height: virtualizer.getTotalSize() }}
                    >
                        {virtualizer.getVirtualItems().map((item) => {
                            const conversation = rows[item.index];

                            return (
                                <div
                                    key={conversation.id}
                                    data-index={item.index}
                                    ref={virtualizer.measureElement}
                                    className="absolute top-0 start-0 w-full"
                                    style={{ transform: `translateY(${item.start}px)` }}
                                >
                                    <ConversationRow
                                        conversation={conversation}
                                        selected={String(selectedId) === String(conversation.id)}
                                        onSelect={() => onSelect(conversation.id)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
