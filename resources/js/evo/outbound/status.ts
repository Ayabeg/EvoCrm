import type { OutboundStatus } from '@/evo/outbound/types';
import type { BadgeTone } from '@/evo/ui/badge';
import { t } from '@/lib/i18n';

export function statusTone(status: OutboundStatus): BadgeTone {
    switch (status) {
        case 'active':
        case 'sent':
        case 'verified':
        case 'finished':
        case 'replied':
        case 'received':
            return 'success';
        case 'warming':
        case 'scheduled':
        case 'sending':
        case 'queued':
            return 'cyan';
        case 'deferred':
        case 'paused':
        case 'draft':
        case 'pending':
            return 'warn';
        case 'failed':
        case 'disabled':
            return 'error';
        default:
            return 'neutral';
    }
}

export function statusLabel(status: OutboundStatus): string {
    return t(status);
}

export function channelLabel(channel: string): string {
    if (channel === 'whatsapp_cloud') {
        return t('WhatsApp Cloud template');
    }

    if (channel === 'sms') {
        return t('SMS (Algeria 05 / 06 / 07)');
    }

    return t('Email SMTP');
}

export function contactName(contact?: {
    first_name?: string;
    last_name?: string | null;
} | null): string {
    if (!contact) {
        return '';
    }

    return `${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim();
}
