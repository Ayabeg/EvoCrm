import type { InboxTemplate } from '@/evo/inbox/types';

export const CANNED_TEMPLATES: InboxTemplate[] = [
    {
        id: 'canned-ack',
        title: 'Accusé de réception',
        body: 'Bonjour, bien reçu. Je reviens vers vous aujourd’hui avant 18:00.',
        channel: 'any',
        kind: 'canned',
    },
    {
        id: 'canned-quote',
        title: 'Devis envoyé',
        body: 'Le devis est prêt. Montant : 1 280 000 DA. Dites-moi si vous voulez un appel.',
        channel: 'any',
        kind: 'canned',
    },
    {
        id: 'canned-meeting',
        title: 'Proposition de créneau',
        body: 'Pouvons-nous nous parler demain à 10:00 (heure d’Alger) ?',
        channel: 'any',
        kind: 'canned',
    },
    {
        id: 'wa-quote',
        title: 'inbox.template.devis_envoye',
        body: 'Bonjour {{1}}, votre devis EvoCRM est disponible. Montant : {{2}} DA. Répondez OUI pour planifier un appel.',
        channel: 'whatsapp',
        kind: 'whatsapp',
        language: 'fr',
    },
    {
        id: 'wa-followup',
        title: 'inbox.template.relance_devis',
        body: 'Bonjour {{1}}, je me permets de relancer le devis envoyé le {{2}}. Souhaitez-vous un ajustement ?',
        channel: 'whatsapp',
        kind: 'whatsapp',
        language: 'fr',
    },
];

export function templatesForChannel(
    channel?: string | null,
    catalog: InboxTemplate[] = CANNED_TEMPLATES,
): InboxTemplate[] {
    if (!channel) {
        return catalog;
    }

    return catalog.filter(
        (item) => item.channel === 'any' || item.channel === channel || channel.startsWith(String(item.channel)),
    );
}
