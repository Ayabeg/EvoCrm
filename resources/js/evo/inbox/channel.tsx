/**
 * Channel chips — WhatsApp / email / web / Meta.
 */

import { createElement } from 'react';
import {
    ChatCircle,
    EnvelopeSimple,
    FacebookLogo,
    GlobeSimple,
    InstagramLogo,
    MessengerLogo,
    Phone,
    WhatsappLogo,
} from '@/evo/icons';
import type { Icon } from '@/evo/icons';
import type { InboxChannel } from '@/evo/inbox/types';
import { cn } from '@/evo/lib/cn';
import { t } from '@/lib/i18n';

export const INBOX_CHANNEL_ORDER: InboxChannel[] = [
    'whatsapp',
    'email',
    'web',
    'meta',
];

export function normalizeInboxChannel(raw?: string | null): InboxChannel | string {
    const value = (raw ?? '').toLowerCase();

    if (value === 'whatsapp_cloud' || value === 'whatsapp-business') {
        return 'whatsapp';
    }

    if (value === 'site_web' || value === 'form' || value === 'forms') {
        return 'web';
    }

    if (
        value === 'instagram' ||
        value === 'facebook' ||
        value === 'messenger' ||
        value === 'meta'
    ) {
        return value === 'meta' ? 'meta' : value;
    }

    if (value === 'email' || value === 'mail') {
        return 'email';
    }

    if (value === 'whatsapp') {
        return 'whatsapp';
    }

    if (value === 'all') {
        return 'all';
    }

    return value || 'email';
}

export function inboxChannelLabel(raw?: string | null): string {
    const value = (raw ?? '').toLowerCase();

    if (value === 'whatsapp_cloud' || value === 'whatsapp-business') {
        return t('WhatsApp Business');
    }

    const channel = normalizeInboxChannel(raw);

    switch (channel) {
        case 'whatsapp':
            return t('WhatsApp');
        case 'email':
            return t('Email');
        case 'web':
            return t('Web');
        case 'instagram':
            return t('Instagram');
        case 'facebook':
            return t('Facebook');
        case 'messenger':
            return t('Messenger');
        case 'meta':
            return t('Meta');
        case 'sms':
            return t('SMS');
        case 'telegram':
            return t('inbox.channel.telegram');
        case 'all':
            return t('All');
        default:
            return raw ? t(raw) : t('Channel');
    }
}

export function inboxChannelIcon(raw?: string | null): Icon {
    const channel = normalizeInboxChannel(raw);

    switch (channel) {
        case 'whatsapp':
        case 'whatsapp_cloud':
            return WhatsappLogo;
        case 'email':
            return EnvelopeSimple;
        case 'web':
            return GlobeSimple;
        case 'instagram':
            return InstagramLogo;
        case 'facebook':
            return FacebookLogo;
        case 'messenger':
            return MessengerLogo;
        case 'meta':
            return MessengerLogo;
        case 'all':
            return ChatCircle;
        default:
            return channel === 'sms' || channel === 'telegram' ? Phone : ChatCircle;
    }
}

export function ChannelGlyph({
    channel,
    className,
    weight = 'regular',
}: {
    channel: string;
    className?: string;
    weight?: 'regular' | 'fill';
}) {
    return createElement(inboxChannelIcon(channel), {
        className,
        weight,
        'aria-hidden': true,
    });
}

export function ChannelChip({
    channel,
    active = false,
    unread = false,
    onClick,
}: {
    channel: string;
    active?: boolean;
    unread?: boolean;
    onClick?: () => void;
}) {
    const label = inboxChannelLabel(channel);

    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            data-inbox="channel-chip"
            data-channel={normalizeInboxChannel(channel)}
            className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-[var(--evo-radius-pill)] border px-2.5 text-[12px] font-medium',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--evo-canvas)]',
                active
                    ? 'border-[var(--evo-teal)] bg-[var(--evo-teal-soft)] text-[var(--evo-teal)]'
                    : 'border-[var(--evo-hairline)] bg-[var(--evo-surface)] text-[var(--evo-ink-secondary)] hover:bg-[var(--evo-hover)]',
            )}
        >
            <ChannelGlyph
                channel={channel}
                className="size-3.5"
                weight={active ? 'fill' : 'regular'}
            />
            <span>{label}</span>
            {unread ? (
                <span className="size-1.5 rounded-full bg-[var(--evo-primary)]" aria-hidden />
            ) : null}
        </button>
    );
}
