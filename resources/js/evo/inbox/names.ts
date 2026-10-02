import type { InboxParticipant } from '@/evo/inbox/types';
import { contactInitials, formatContactName } from '@/lib/contact-name';
import { t } from '@/lib/i18n';

export type InboxContact = {
    id: number;
    first_name: string;
    last_name?: string | null;
    email?: string | null;
    phone_e164?: string | null;
    company?: { id: number; name: string } | null;
    owner?: { id: number; name: string } | null;
};

export function inboxContactName(contact?: InboxContact | null): string {
    if (!contact) {
        return t('Unknown');
    }

    return formatContactName(contact.first_name, contact.last_name);
}

export function inboxInitials(contact?: InboxContact | null): string {
    if (!contact) {
        return '?';
    }

    return contactInitials(contact.first_name, contact.last_name);
}

export function participantFromLegacy(contact?: InboxContact | null): InboxParticipant {
    return {
        id: contact?.id,
        name: inboxContactName(contact),
        initials: inboxInitials(contact),
        phone: contact?.phone_e164 ?? null,
        email: contact?.email ?? null,
        company: contact?.company?.name ?? null,
        owner: contact?.owner?.name ?? null,
        href: contact?.id ? `/crm/contacts/${contact.id}` : undefined,
    };
}
