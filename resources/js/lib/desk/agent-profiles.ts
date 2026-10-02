import { BOT_CATALOG } from '@/lib/desk/bot-catalog';
import { getBotById } from '@/lib/desk/bot-catalog';
import type { BotDefinition } from '@/lib/desk/bot-catalog';

export type AgentContextTarget = {
    label: string;
    href: string;
};

export type AgentPrompt = {
    label: string;
    prompt: string;
};

export type AgentProfile = {
    bot: BotDefinition;
    section: 'your' | 'system';
    summary: string;
    availability: 'Available';
    defaultAskPage: 'workspace' | 'dashboard';
    emptyMessage: string;
    placeholder: string;
    contexts: AgentContextTarget[];
    prompts: AgentPrompt[];
};

function bot(id: string): BotDefinition {
    const definition = BOT_CATALOG.find((item) => item.id === id);

    if (!definition) {
        throw new Error(`Missing agent definition: ${id}`);
    }

    return definition;
}

const commonPlaceholder =
    'Demandez quelque chose sur une affaire, un lead ou une conversation WhatsApp…';

export const AGENT_PROFILES: AgentProfile[] = [
    {
        bot: bot('closer'),
        section: 'your',
        summary: 'Turns active opportunities into next actions.',
        availability: 'Available',
        defaultAskPage: 'dashboard',
        emptyMessage:
            'Transformez vos opportunités actives en prochaines actions.',
        placeholder: commonPlaceholder,
        contexts: [
            { label: 'Affaires', href: '/crm/deals' },
            { label: 'Leads', href: '/crm/leads' },
            { label: 'Inbox', href: '/inbox' },
            { label: 'Devis', href: '/crm/quotes' },
        ],
        prompts: [
            {
                label: 'Relancer une affaire',
                prompt: 'Quelles affaires demandent un suivi aujourd’hui ?',
            },
            {
                label: 'Qualifier un lead',
                prompt: 'Quel lead devrait être qualifié en priorité ?',
            },
            {
                label: 'Préparer un devis',
                prompt: 'Quel devis doit avancer ensuite ?',
            },
            {
                label: 'Analyser une conversation',
                prompt: 'Quelle prochaine action ressort de cette conversation ?',
            },
        ],
    },
    {
        bot: bot('qualifier'),
        section: 'your',
        summary: 'Qualifies leads with useful context.',
        availability: 'Available',
        defaultAskPage: 'workspace',
        emptyMessage:
            'Évaluez le potentiel de vos nouveaux leads avec le contexte du CRM.',
        placeholder:
            'Posez une question sur un lead, un contact ou une entreprise…',
        contexts: [
            { label: 'Leads', href: '/crm/leads' },
            { label: 'Contacts', href: '/crm/contacts' },
            { label: 'Sociétés', href: '/crm/companies' },
            { label: 'Inbox', href: '/inbox' },
        ],
        prompts: [
            {
                label: 'Qualifier un lead',
                prompt: 'Aidez-moi à qualifier ce lead avec les informations disponibles.',
            },
            {
                label: 'Enrichir un contact',
                prompt: 'Quelles informations manquent sur ce contact ?',
            },
            {
                label: 'Prioriser les entrants',
                prompt: 'Quels leads entrants méritent un examen en premier ?',
            },
        ],
    },
    {
        bot: bot('quote-desk'),
        section: 'your',
        summary: 'Turns needs into a clear quote path.',
        availability: 'Available',
        defaultAskPage: 'workspace',
        emptyMessage:
            'Préparez la prochaine étape d’un devis à partir des données de l’affaire.',
        placeholder: 'Posez une question sur un devis ou une affaire…',
        contexts: [
            { label: 'Devis', href: '/crm/quotes' },
            { label: 'Affaires', href: '/crm/deals' },
            { label: 'Contacts', href: '/crm/contacts' },
        ],
        prompts: [
            {
                label: 'Préparer un devis',
                prompt: 'Quel est le prochain point à traiter sur ce devis ?',
            },
            {
                label: 'Vérifier un montant',
                prompt: 'Résumez le montant et le statut de ce devis.',
            },
            {
                label: 'Suivre un devis',
                prompt: 'Quel suivi est prévu pour ce devis ?',
            },
        ],
    },
    {
        bot: bot('after-sale'),
        section: 'your',
        summary: 'Moves customers forward after handover.',
        availability: 'Available',
        defaultAskPage: 'workspace',
        emptyMessage:
            'Suivez les clients après la vente, de l’accueil au support.',
        placeholder: 'Posez une question sur un client, un ticket ou un suivi…',
        contexts: [
            { label: 'Sociétés', href: '/crm/companies' },
            { label: 'Contacts', href: '/crm/contacts' },
            { label: 'Tickets', href: '/crm/tickets' },
            { label: 'Activités', href: '/crm/activities' },
        ],
        prompts: [
            {
                label: 'Préparer un suivi client',
                prompt: 'Quel suivi client est à prévoir après la vente ?',
            },
            {
                label: 'Examiner un ticket',
                prompt: 'Résumez le contexte et la prochaine étape de ce ticket.',
            },
            {
                label: 'Vérifier l’onboarding',
                prompt: 'Quelles étapes d’accueil client restent à traiter ?',
            },
        ],
    },
    {
        bot: bot('desk'),
        section: 'system',
        summary: 'Routes incoming work to the right desk.',
        availability: 'Available',
        defaultAskPage: 'workspace',
        emptyMessage:
            'Trouvez le bon contexte CRM et la bonne équipe pour une conversation.',
        placeholder:
            'Posez une question sur une conversation ou son attribution…',
        contexts: [
            { label: 'Inbox', href: '/inbox' },
            { label: 'Contacts', href: '/crm/contacts' },
            { label: 'Activités', href: '/crm/activities' },
        ],
        prompts: [
            {
                label: 'Analyser une conversation',
                prompt: 'Résumez cette conversation et suggérez son routage.',
            },
            {
                label: 'Trouver le bon contact',
                prompt: 'À quel contact du CRM cette conversation est-elle liée ?',
            },
            {
                label: 'Préparer un transfert',
                prompt: 'Quel contexte est utile avant de transférer cette conversation ?',
            },
        ],
    },
];

export function getAgentProfile(
    id: string | null | undefined,
): AgentProfile | undefined {
    return AGENT_PROFILES.find((profile) => profile.bot.id === id);
}

export function resolveAgentProfile(
    id: string | null | undefined,
): AgentProfile | undefined {
    const profile = getAgentProfile(id);

    if (profile) {
        return profile;
    }

    const customBot = getBotById(id);

    if (!customBot) {
        return undefined;
    }

    const standardProfile = AGENT_PROFILES[0];

    return {
        ...standardProfile,
        bot: customBot,
        section: 'your',
        summary: customBot.job,
        emptyMessage: customBot.description,
        defaultAskPage: 'workspace',
    };
}
