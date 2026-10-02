import { inboxChannelLabel, normalizeInboxChannel } from '@/evo/inbox/channel';
import type {
    InboxAttachment,
    InboxConversation,
    InboxMessage,
    InboxParticipant,
} from '@/evo/inbox/types';
import { contactInitials, formatContactName } from '@/lib/contact-name';
import { t } from '@/lib/i18n';

type DeskContact = {
    id?: number;
    first_name?: string;
    last_name?: string | null;
    email?: string | null;
    phone_e164?: string | null;
    company?: { id?: number; name?: string } | null;
    owner?: { id?: number; name?: string } | null;
};

type DeskMessage = {
    id: number | string;
    direction?: string;
    type?: string;
    body?: string;
    status?: string;
    failure_reason?: string | null;
    created_at?: string;
    user?: { name?: string } | null;
    attachments?: Array<{
        id?: string | number;
        name?: string;
        filename?: string;
        size?: number;
        url?: string;
        href?: string;
        mime?: string;
    }>;
};

type DeskThread = {
    id: number | string;
    status?: string;
    unread_count?: number;
    last_message_at?: string | null;
    subject?: string | null;
    contact?: DeskContact | null;
    channel?: { name?: string; type?: string } | null;
    messages?: DeskMessage[];
};

export type OutboundReplyRow = {
    id: number;
    subject?: string | null;
    body?: string | null;
    created_at: string;
    contact?: {
        id: number;
        first_name: string;
        last_name?: string | null;
        email?: string | null;
        leads?: Array<{ id: number; title: string; status: string }>;
    } | null;
    mailbox?: { id: number; name: string } | null;
    parent?: { id: number; subject?: string | null; body?: string | null; sent_at?: string | null } | null;
};

function participantFromContact(contact?: DeskContact | null): InboxParticipant {
    if (!contact) {
        return { name: t('Unknown'), initials: '?' };
    }

    const name = formatContactName(contact.first_name ?? '', contact.last_name);

    return {
        id: contact.id,
        name,
        initials: contactInitials(contact.first_name ?? '', contact.last_name),
        phone: contact.phone_e164 ?? null,
        email: contact.email ?? null,
        company: contact.company?.name ?? null,
        owner: contact.owner?.name ?? null,
        href: contact.id ? `/crm/contacts/${contact.id}` : undefined,
    };
}

function attachmentsFrom(message: DeskMessage): InboxAttachment[] {
    return (message.attachments ?? []).map((item, index) => ({
        id: String(item.id ?? `${message.id}-file-${index}`),
        name: item.name ?? item.filename ?? t('Attachment'),
        size: item.size,
        href: item.href ?? item.url,
        mime: item.mime,
    }));
}

export function deskMessageToInbox(message: DeskMessage): InboxMessage {
    const note = message.type === 'note' || message.direction === 'internal';

    return {
        id: message.id,
        body: message.body ?? '',
        at: message.created_at ?? '',
        direction: note
            ? 'internal'
            : message.direction === 'outbound'
              ? 'outbound'
              : 'inbound',
        kind: note ? 'note' : 'message',
        status: message.status,
        failureReason: message.failure_reason ?? null,
        author: message.user?.name ?? null,
        attachments: attachmentsFrom(message),
    };
}

export function deskThreadToConversation(thread: DeskThread): InboxConversation {
    const latest = thread.messages?.[0];

    return {
        id: thread.id,
        participant: participantFromContact(thread.contact),
        channel: normalizeInboxChannel(thread.channel?.type ?? thread.channel?.name),
        subject: thread.subject ?? null,
        preview: latest?.body ?? thread.subject ?? t('No preview'),
        lastMessageAt: thread.last_message_at ?? latest?.created_at ?? null,
        unread: thread.unread_count ?? 0,
        assignedTo: thread.contact?.owner?.name ?? null,
        status: thread.status,
        messages: (thread.messages ?? []).map(deskMessageToInbox),
    };
}

export function outboundReplyToConversation(reply: OutboundReplyRow): InboxConversation {
    const name = reply.contact
        ? formatContactName(reply.contact.first_name, reply.contact.last_name)
        : t('Unknown');

    const parent: InboxMessage | null = reply.parent
        ? {
              id: `parent-${reply.parent.id}`,
              body: reply.parent.body ?? reply.parent.subject ?? '',
              at: reply.parent.sent_at ?? reply.created_at,
              direction: 'outbound',
              kind: 'message',
              status: 'sent',
          }
        : null;

    const inbound: InboxMessage = {
        id: reply.id,
        body: reply.body ?? '',
        at: reply.created_at,
        direction: 'inbound',
        kind: 'message',
        status: 'received',
    };

    return {
        id: reply.id,
        participant: {
            id: reply.contact?.id,
            name,
            initials: reply.contact
                ? contactInitials(reply.contact.first_name, reply.contact.last_name)
                : '?',
            email: reply.contact?.email ?? null,
            href: reply.contact ? `/crm/contacts/${reply.contact.id}` : undefined,
        },
        channel: 'email',
        subject: reply.subject ?? reply.parent?.subject ?? t('Replies'),
        preview: reply.body ?? reply.subject ?? t('No preview'),
        lastMessageAt: reply.created_at,
        unread: 0,
        assignedTo: reply.mailbox?.name ?? null,
        status: 'open',
        messages: parent ? [parent, inbound] : [inbound],
    };
}

export function conversationChannelLabel(conversation: InboxConversation): string {
    return inboxChannelLabel(conversation.channel);
}
