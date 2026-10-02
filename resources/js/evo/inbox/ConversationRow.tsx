import { ChannelGlyph, inboxChannelLabel } from '@/evo/inbox/channel';
import { formatInboxWhen } from '@/evo/inbox/format';
import { InboxPersonMark } from '@/evo/inbox/marks';
import type { InboxConversation } from '@/evo/inbox/types';
import { cn } from '@/evo/lib/cn';
import { Badge } from '@/evo/ui/badge';
import { conversationA11yName } from '@/lib/a11y';
import { t } from '@/lib/i18n';
import { MOTION_HOVER_CLASS } from '@/lib/motion';

function ChannelMark({ channel }: { channel: string }) {
    return (
        <span className="inline-flex items-center gap-1 truncate">
            <ChannelGlyph channel={channel} className="size-3" />
            <span>{inboxChannelLabel(channel)}</span>
        </span>
    );
}

export function ConversationRow({
    conversation,
    selected,
    onSelect,
    whenLabel,
}: {
    conversation: InboxConversation;
    selected: boolean;
    onSelect: () => void;
    whenLabel?: string;
}) {
    const unread = conversation.unread;
    const name = conversation.participant.name;
    const initials = conversation.participant.initials ?? name.slice(0, 1);
    const when = whenLabel ?? formatInboxWhen(conversation.lastMessageAt);

    return (
        <button
            type="button"
            onClick={onSelect}
            data-inbox="conversation-row"
            aria-current={selected ? 'true' : undefined}
            aria-label={conversationA11yName({ name, unread, selected })}
            className={cn(
                'flex w-full items-start gap-2.5 border-b border-[var(--evo-hairline)] px-3 py-1.5 text-left',
                MOTION_HOVER_CLASS,
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[color:var(--evo-focus)]',
                selected
                    ? 'bg-[var(--evo-teal-soft)]'
                    : 'hover:bg-[var(--evo-hover)]',
            )}
        >
            <InboxPersonMark name={name} initials={initials} />
            <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                    <span
                        className={cn(
                            'truncate text-[13px] text-[var(--evo-ink)]',
                            unread > 0 ? 'font-semibold' : 'font-medium',
                        )}
                    >
                        {name}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-[var(--evo-ink-muted)] tabular-nums">
                        {when}
                    </span>
                </div>
                <p className="mt-0.5 truncate text-[12px] text-[var(--evo-ink-muted)]">
                    {conversation.preview ?? conversation.subject ?? t('No preview')}
                </p>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[var(--evo-ink-muted)]">
                    <ChannelMark channel={conversation.channel} />
                    {unread > 0 ? (
                        <Badge variant="default" className="h-4 min-w-4 px-1 font-mono text-[10px]">
                            {unread}
                            <span className="sr-only"> unread</span>
                        </Badge>
                    ) : null}
                </div>
            </div>
        </button>
    );
}

/** Legacy chrome row — keeps P13/P26 source-lock identifiers. */
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
        <ConversationRow
            conversation={{
                id: name,
                participant: { name, initials },
                channel,
                preview,
                unread,
            }}
            whenLabel={when}
            selected={selected}
            onSelect={onSelect}
        />
    );
}
