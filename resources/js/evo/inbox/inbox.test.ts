import { describe, expect, it } from 'vitest';
import { outboundReplyToConversation } from '@/evo/inbox/adapters';
import { templatesForChannel } from '@/evo/inbox/canned';
import { inboxChannelLabel, normalizeInboxChannel } from '@/evo/inbox/channel';
import { formatInboxClock, inboxDayKey } from '@/evo/inbox/format';
import { inboxMessages } from '@/evo/inbox/messages';

describe('inbox channel chips', () => {
    it('collapses WhatsApp Cloud and Meta surfaces', () => {
        expect(normalizeInboxChannel('whatsapp_cloud')).toBe('whatsapp');
        expect(normalizeInboxChannel('instagram')).toBe('instagram');
        expect(normalizeInboxChannel('site_web')).toBe('web');
        expect(inboxChannelLabel('email')).toBe('Email');
    });
});

describe('inbox templates', () => {
    it('keeps WhatsApp official templates for WhatsApp threads', () => {
        const list = templatesForChannel('whatsapp');

        expect(list.some((item) => item.kind === 'whatsapp')).toBe(true);
        expect(list.some((item) => item.id === 'wa-quote')).toBe(true);
    });
});

describe('inbox locale', () => {
    it('formats 24h clocks and day keys in Africa/Algiers', () => {
        expect(formatInboxClock('2026-09-30T17:42:00+01:00')).toMatch(/17:42/);
        expect(inboxDayKey('2026-09-30T17:42:00+01:00')).toBe('2026-09-30');
    });
});

describe('outbound replies adapter', () => {
    it('maps IMAP replies onto the shared conversation shape', () => {
        const conversation = outboundReplyToConversation({
            id: 9,
            subject: 'Re: Devis',
            body: 'Intéressés.',
            created_at: '2026-09-30T16:05:00+01:00',
            contact: {
                id: 3,
                first_name: 'Amine',
                last_name: 'Benali',
                email: 'amine.benali@clinique-djazair.dz',
            },
            parent: { id: 8, subject: 'Devis', body: 'V2 envoyé', sent_at: '2026-09-28T11:02:00+01:00' },
        });

        expect(conversation.channel).toBe('email');
        expect(conversation.participant.name).toContain('Amine');
        expect(conversation.messages).toHaveLength(2);
        expect(inboxMessages.Replies).toBe('Réponses');
    });
});
