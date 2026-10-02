import { ChannelChip, INBOX_CHANNEL_ORDER } from '@/evo/inbox/channel';
import { cn } from '@/evo/lib/cn';
import { t } from '@/lib/i18n';

export function ChannelFilter({
    value,
    onChange,
    channels = INBOX_CHANNEL_ORDER,
    unread = {},
    className,
}: {
    value?: string | null;
    onChange: (channel: string | null) => void;
    channels?: readonly string[];
    unread?: Record<string, boolean>;
    className?: string;
}) {
    return (
        <div
            role="group"
            aria-label={t('Channels')}
            data-inbox="channel-filter"
            className={cn('flex flex-wrap gap-1.5', className)}
        >
            <ChannelChip
                channel="all"
                active={!value || value === 'all'}
                onClick={() => onChange(null)}
            />
            {channels.map((channel) => (
                <ChannelChip
                    key={channel}
                    channel={channel}
                    active={value === channel}
                    unread={unread[channel]}
                    onClick={() => onChange(channel)}
                />
            ))}
        </div>
    );
}
