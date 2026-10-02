/**
 * Evo Design System — Inbox conversation contracts
 * Registry: custom Evo
 * License: MIT (original)
 */

export type InboxChannel =
    | 'whatsapp'
    | 'whatsapp_cloud'
    | 'email'
    | 'web'
    | 'instagram'
    | 'facebook'
    | 'messenger'
    | 'telegram'
    | 'sms'
    | 'meta';

export type InboxAssignment = 'all' | 'mine' | 'unassigned';

export type InboxComposeMode = 'reply' | 'note';

export type InboxDeliveryStatus =
    | 'queued'
    | 'sent'
    | 'delivered'
    | 'read'
    | 'received'
    | 'logged'
    | 'failed';

export type InboxAttachment = {
    id: string;
    name: string;
    size?: number;
    href?: string;
    mime?: string;
};

export type InboxMessage = {
    id: string | number;
    body: string;
    at: string;
    direction: 'inbound' | 'outbound' | 'internal';
    kind?: 'message' | 'note';
    status?: InboxDeliveryStatus | string;
    failureReason?: string | null;
    author?: string | null;
    attachments?: InboxAttachment[];
};

export type InboxParticipant = {
    id?: string | number | null;
    name: string;
    initials?: string;
    phone?: string | null;
    email?: string | null;
    company?: string | null;
    owner?: string | null;
    href?: string;
};

export type InboxConversation = {
    id: string | number;
    participant: InboxParticipant;
    channel: InboxChannel | string;
    subject?: string | null;
    preview?: string | null;
    lastMessageAt?: string | null;
    unread: number;
    assignedTo?: string | null;
    status?: string;
    messages?: InboxMessage[];
};

export type InboxQueueItem = {
    key: string;
    label: string;
    count: number | null;
};

export type InboxTemplate = {
    id: string;
    title: string;
    body: string;
    channel?: InboxChannel | 'any';
    kind?: 'canned' | 'whatsapp';
    language?: string;
};

export type InboxComposerSubmit = {
    body: string;
    mode: InboxComposeMode;
    resolve?: boolean;
    attachments?: InboxAttachment[];
    templateId?: string | null;
};
