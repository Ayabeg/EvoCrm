/**
 * PR6 Design Lab story — Pharmacie Centrale WhatsApp + Clinique El Djazair email.
 * +213 numbers, fr-DZ, Africa/Algiers.
 */

import type { CRMContextRecord } from '@/evo/crm/record';
import type { InboxConversation, InboxQueueItem } from '@/evo/inbox';
import { formatMoney, formatPhone } from '@/evo/lib/format';

export const INBOX_NOW = '2026-10-01T09:00:00+01:00';

export const pharmacieWhatsapp: InboxConversation = {
    id: 'inbox-pharmacie-centrale-wa',
    participant: {
        id: 'contact-karim-mansouri',
        name: 'Karim Mansouri',
        initials: 'KM',
        phone: formatPhone('+213555448671'),
        email: 'karim.mansouri@pharmacie-centrale.dz',
        company: 'Pharmacie Centrale',
        owner: 'Sara Khelifi',
        href: '/crm/contacts/karim',
    },
    channel: 'whatsapp',
    subject: 'Relance stock + devis after-sale',
    preview: 'Oui, envoyez le modèle WhatsApp du devis.',
    lastMessageAt: '2026-09-30T17:42:00+01:00',
    unread: 2,
    assignedTo: 'Sara Khelifi',
    status: 'open',
    messages: [
        {
            id: 'wa-1',
            at: '2026-09-29T09:12:00+01:00',
            direction: 'inbound',
            kind: 'message',
            status: 'received',
            body: 'Bonjour, Pharmacie Centrale à Blida. On a un souci de relance sur les commandes after-sale. Mon numéro est +213 555 44 86 71.',
        },
        {
            id: 'wa-2',
            at: '2026-09-29T09:18:00+01:00',
            direction: 'outbound',
            kind: 'message',
            status: 'read',
            body: 'Bonjour Karim, Sara de EvoCRM. Je prends le fil WhatsApp. On peut caler un devis after-sale aujourd’hui.',
        },
        {
            id: 'wa-note',
            at: '2026-09-29T11:05:00+01:00',
            direction: 'internal',
            kind: 'note',
            status: 'logged',
            author: 'Sara Khelifi',
            body: 'Note interne : relancer avec le modèle WhatsApp devis_envoye. Budget évoqué 150 000 DA.',
        },
        {
            id: 'wa-3',
            at: '2026-09-30T17:42:00+01:00',
            direction: 'inbound',
            kind: 'message',
            status: 'received',
            body: 'Oui, envoyez le modèle WhatsApp du devis.',
            attachments: [
                { id: 'wa-att', name: 'bon-commande-blida.pdf', size: 84200 },
            ],
        },
    ],
};

export const cliniqueEmail: InboxConversation = {
    id: 'inbox-clinique-el-djazair-email',
    participant: {
        id: 'contact-amine-benali',
        name: 'Amine Benali',
        initials: 'AB',
        phone: formatPhone('+213555120447'),
        email: 'amine.benali@clinique-djazair.dz',
        company: 'Clinique El Djazair',
        owner: 'Elias Ouadah',
        href: '/crm/contacts/amine',
    },
    channel: 'email',
    subject: 'Devis DV-2026-0047 — Équipement bloc opératoire',
    preview: 'Nous relisons le devis 1 280 000 DA avec la direction.',
    lastMessageAt: '2026-09-30T16:05:00+01:00',
    unread: 1,
    assignedTo: 'Elias Ouadah',
    status: 'open',
    messages: [
        {
            id: 'em-1',
            at: '2026-09-28T10:24:00+01:00',
            direction: 'inbound',
            kind: 'message',
            status: 'received',
            body: 'Bonjour Elias,\n\nPouvez-vous renvoyer le devis v2 pour l’équipement du bloc opératoire ?\n\nAmine Benali\nClinique El Djazair — Alger\n+213 555 12 04 47',
        },
        {
            id: 'em-2',
            at: '2026-09-28T11:02:00+01:00',
            direction: 'outbound',
            kind: 'message',
            status: 'delivered',
            body: `Bonjour Amine,\n\nVoici le devis DV-2026-0047 : ${formatMoney(1280000)}.\nPièce jointe ci-dessous.\n\nElias`,
            attachments: [
                { id: 'em-att', name: 'DV-2026-0047-v2.pdf', size: 214000 },
            ],
        },
        {
            id: 'em-3',
            at: '2026-09-30T16:05:00+01:00',
            direction: 'inbound',
            kind: 'message',
            status: 'received',
            body: 'Nous relisons le devis 1 280 000 DA avec la direction.',
        },
    ],
};

export const inboxStoryConversations: InboxConversation[] = [
    pharmacieWhatsapp,
    cliniqueEmail,
    {
        id: 'inbox-web-amrani',
        participant: {
            name: 'Samir Belkacem',
            initials: 'SB',
            phone: formatPhone('+213555334092'),
            company: 'Cabinet Dr. Amrani',
            owner: null,
        },
        channel: 'web',
        subject: 'Formulaire site — digitalisation cabinet',
        preview: 'Lead web, non assigné.',
        lastMessageAt: '2026-09-26T09:05:00+01:00',
        unread: 0,
        assignedTo: null,
        status: 'open',
        messages: [
            {
                id: 'web-1',
                at: '2026-09-26T09:05:00+01:00',
                direction: 'inbound',
                status: 'received',
                body: 'Formulaire site web : on veut digitaliser le cabinet à Constantine.',
            },
        ],
    },
    {
        id: 'inbox-meta-lina',
        participant: {
            name: 'Lina Haddad',
            initials: 'LH',
            phone: formatPhone('+213555221810'),
            company: 'Hôpital Ibn Sina',
            owner: 'Rania Cherif',
        },
        channel: 'meta',
        subject: 'Messenger — périmètre support 5 jours',
        preview: 'Pouvez-vous confirmer le périmètre support ?',
        lastMessageAt: '2026-09-27T15:40:00+01:00',
        unread: 1,
        assignedTo: 'Rania Cherif',
        status: 'open',
        messages: [
            {
                id: 'meta-1',
                at: '2026-09-27T15:40:00+01:00',
                direction: 'inbound',
                status: 'received',
                body: 'Pouvez-vous confirmer le périmètre support 5 jours ?',
            },
        ],
    },
];

export const inboxStoryQueues: InboxQueueItem[] = [
    { key: 'all', label: 'All', count: inboxStoryConversations.length },
    { key: 'unassigned', label: 'Unassigned', count: 1 },
    { key: 'mine', label: 'Assigned to me', count: 2 },
    { key: 'open', label: 'All open', count: inboxStoryConversations.length },
    { key: 'whatsapp', label: 'WhatsApp', count: 1 },
    { key: 'email', label: 'Email', count: 1 },
    { key: 'web', label: 'Web', count: 1 },
    { key: 'meta', label: 'Meta', count: 1 },
];

export function inboxStoryContext(id: string | number): CRMContextRecord | null {
    if (id === pharmacieWhatsapp.id) {
        return {
            ref: { type: 'company', id: 4 },
            title: 'Karim Mansouri',
            subtitle: 'Pharmacie Centrale · Blida',
            status: { label: 'After-sale', tone: 'warning' },
            owner: { id: 4, name: 'Sara Khelifi' },
            fullRecordHref: '/crm/contacts/karim',
            keyProperties: [
                { id: 'phone', label: 'Phone', value: formatPhone('+213555448671') },
                { id: 'email', label: 'Email', value: 'karim.mansouri@pharmacie-centrale.dz' },
                { id: 'company', label: 'Company', value: 'Pharmacie Centrale' },
                { id: 'deal', label: 'Open deal', value: `${formatMoney(150000)}` },
            ],
            associations: [
                { ref: { type: 'company', id: 4 }, label: 'Pharmacie Centrale' },
                { ref: { type: 'deal', id: 12 }, label: 'Solution commerciale pharmacie' },
            ],
            nextAction: {
                title: 'Envoyer le modèle WhatsApp devis_envoye',
                dueAt: '2026-10-01T11:00:00+01:00',
                owner: 'Sara Khelifi',
            },
        };
    }

    if (id === cliniqueEmail.id) {
        return {
            ref: { type: 'deal', id: 7 },
            title: 'Amine Benali',
            subtitle: 'Clinique El Djazair · Alger',
            status: { label: 'Proposition', tone: 'neutral' },
            owner: { id: 1, name: 'Elias Ouadah' },
            fullRecordHref: '/crm/contacts/amine',
            keyProperties: [
                { id: 'phone', label: 'Phone', value: formatPhone('+213555120447') },
                { id: 'email', label: 'Email', value: 'amine.benali@clinique-djazair.dz' },
                { id: 'company', label: 'Company', value: 'Clinique El Djazair' },
                { id: 'deal', label: 'Open deal', value: `${formatMoney(1280000)}` },
            ],
            associations: [
                { ref: { type: 'company', id: 1 }, label: 'Clinique El Djazair' },
                { ref: { type: 'deal', id: 7 }, label: 'Équipement bloc opératoire' },
                { ref: { type: 'quote', id: 47 }, label: 'DV-2026-0047 v2' },
            ],
            nextAction: {
                title: 'Relancer la direction sur le devis v2',
                dueAt: '2026-10-02T10:00:00+01:00',
                owner: 'Elias Ouadah',
            },
        };
    }

    return null;
}
