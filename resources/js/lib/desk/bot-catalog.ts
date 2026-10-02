import type { BotAvatarType } from 'bot-avatars';
import { useSyncExternalStore } from 'react';
import type { AgentApproval, AgentToolCall } from '@/evo/ai/types';
import type { AskEvoAction, AskEvoContextPayload } from '@/lib/ask-evo';

export type AvatarTone = 'ink' | 'teal' | 'orange' | 'night';

export type BotGroup = 'sales' | 'internal' | 'evopulse' | 'custom';

export type BotDefinition = {
    id: string;
    name: string;
    job: string;
    description: string;
    group: BotGroup;
    avatarTone: AvatarTone;
    avatarType?: BotAvatarType;
    instructions?: string;
    tools?: string[];
    custom?: boolean;
};

const CATALOG_AVATAR_TYPES: Record<string, BotAvatarType> = {
    closer: 'hexagon',
    qualifier: 'drop',
    'quote-desk': 'square',
    'after-sale': 'flower',
    desk: 'droid',
    'evopulse-shell-ia': 'mech',
    'evopulse-pulse-ui': 'cloud',
    'evopulse-command-ui': 'star',
    'night-shift': 'ghost',
};

const CUSTOM_AVATAR_TYPES: BotAvatarType[] = [
    'clover',
    'triangle',
    'blob',
    'circle',
    'cat',
    'pill',
    'alien',
    'pebble',
    'puddle',
];

export function seedFromBotId(id?: string | null): number {
    if (!id) {
        return 0.37;
    }

    let hash = 2166136261;

    for (let i = 0; i < id.length; i += 1) {
        hash ^= id.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }

    return (hash >>> 0) / 0xffffffff;
}

export function avatarTypeForBotId(
    id?: string | null,
    explicit?: BotAvatarType,
): BotAvatarType {
    if (explicit) {
        return explicit;
    }

    if (id && CATALOG_AVATAR_TYPES[id]) {
        return CATALOG_AVATAR_TYPES[id];
    }

    if (!id) {
        return 'clover';
    }

    const index = Math.floor(seedFromBotId(id) * CUSTOM_AVATAR_TYPES.length);

    return CUSTOM_AVATAR_TYPES[index] ?? 'clover';
}

export function avatarColorForTone(tone: AvatarTone): string {
    /* bot-avatars requires a paint hex, not a CSS custom property. */
    /* eslint-disable no-restricted-syntax -- avatar paint hex */
    if (tone === 'orange') {
        return '#E8530E';
    }

    if (tone === 'teal') {
        return '#0F4C5C';
    }

    return '#0D1B24';
    /* eslint-enable no-restricted-syntax */
}

export type ConnectorDefinition = {
    id: string;
    name: string;
    description: string;
    href?: string;
    status: 'ready' | 'coming_soon';
};

export type ChatMessage = {
    id: string;
    role: 'user' | 'assistant';
    body: string;
    recordContext?: AgentRecordContext | null;
    crmActions?: AskEvoAction[];
    streaming?: boolean;
    reasoning?: string;
    toolCalls?: AgentToolCall[];
    approval?: AgentApproval;
    error?: boolean;
};

export type AgentRecordContext = {
    type: string;
    id: number;
    label: string;
    href: string;
};

export type AgentChat = {
    id: string;
    botId: string;
    title: string;
    relativeTime: string;
    messages: ChatMessage[];
    recordContext?: AgentRecordContext | null;
};

export type NewBotInput = {
    name: string;
    instructions: string;
    tools: string[];
    avatarTone: AvatarTone;
};

export const BOT_GROUP_LABEL: Record<BotGroup, string> = {
    sales: 'Vente',
    internal: 'Interne',
    evopulse: 'EvoPulse',
    custom: 'Bot personnalisé',
};

export const BOT_CATALOG: BotDefinition[] = [
    {
        id: 'desk',
        name: 'Desk router',
        job: 'oriente la demande vers le bon bureau',
        description:
            'Une porte d’entrée discrète pour le travail qui demande un spécialiste.',
        group: 'internal',
        avatarTone: 'ink',
        avatarType: 'droid',
    },
    {
        id: 'closer',
        name: 'Closer',
        job: 'transforme les opportunités actives en prochaines actions',
        description:
            'Maintient le rythme sur les conversations et affaires qualifiées.',
        group: 'sales',
        avatarTone: 'orange',
        avatarType: 'hexagon',
    },
    {
        id: 'qualifier',
        name: 'Qualifier',
        job: 'qualifie les leads avec le contexte utile',
        description: 'Sépare l’intention d’achat réelle du bruit.',
        group: 'sales',
        avatarTone: 'teal',
        avatarType: 'drop',
    },
    {
        id: 'quote-desk',
        name: 'Quote desk',
        job: 'transforme les besoins en un chemin de devis clair',
        description:
            'Aide à préparer le prochain devis sans inventer de montants.',
        group: 'sales',
        avatarTone: 'ink',
        avatarType: 'square',
    },
    {
        id: 'after-sale',
        name: 'After-sale',
        job: 'fait avancer les clients après la passation',
        description:
            'Fait remonter les suivis, rendez-vous et signaux de renouvellement.',
        group: 'sales',
        avatarTone: 'teal',
        avatarType: 'flower',
    },
    {
        id: 'evopulse-shell-ia',
        name: 'EvoPulse · Shell IA',
        job: 'cartographie l’architecture d’information de l’espace de travail',
        description:
            'Intelligence produit interne pour la navigation et la structure.',
        group: 'evopulse',
        avatarTone: 'night',
        avatarType: 'mech',
    },
    {
        id: 'evopulse-pulse-ui',
        name: 'EvoPulse · Pulse UI',
        job: 'transforme les signaux en une surface d’opération ciblée',
        description:
            'Intelligence produit interne pour des interfaces calmes et utiles.',
        group: 'evopulse',
        avatarTone: 'teal',
        avatarType: 'cloud',
    },
    {
        id: 'evopulse-command-ui',
        name: 'EvoPulse · Command UI',
        job: 'conçoit des flux de commande rapides et ancrés',
        description: 'Intelligence produit interne pour la vitesse et la clarté.',
        group: 'evopulse',
        avatarTone: 'orange',
        avatarType: 'star',
    },
    {
        id: 'night-shift',
        name: 'Night shift',
        job: 'veille discrètement sur le travail de nuit',
        description:
            'Intelligence produit interne pour une surveillance à faible bruit.',
        group: 'evopulse',
        avatarTone: 'ink',
        avatarType: 'ghost',
    },
];

export const BOT_GROUPS: Array<{
    key: Exclude<BotGroup, 'custom'>;
    label: string;
    ids: string[];
}> = [
    {
        key: 'sales',
        label: BOT_GROUP_LABEL.sales,
        ids: ['closer', 'qualifier', 'quote-desk', 'after-sale'],
    },
    { key: 'internal', label: BOT_GROUP_LABEL.internal, ids: ['desk'] },
    {
        key: 'evopulse',
        label: BOT_GROUP_LABEL.evopulse,
        ids: [
            'evopulse-shell-ia',
            'evopulse-pulse-ui',
            'evopulse-command-ui',
            'night-shift',
        ],
    },
];

export const CONNECTORS: ConnectorDefinition[] = [
    {
        id: 'linear',
        name: 'Linear',
        description: 'Issues and project context',
        status: 'coming_soon',
    },
    {
        id: 'drive',
        name: 'Drive',
        description: 'Files and shared documents',
        href: '/settings/connectors',
        status: 'ready',
    },
    {
        id: 'vercel',
        name: 'Vercel',
        description: 'Deployments and previews',
        status: 'coming_soon',
    },
    {
        id: 'mobbin',
        name: 'Mobbin',
        description: 'Interface references',
        status: 'coming_soon',
    },
    {
        id: 'github',
        name: 'GitHub',
        description: 'Code and pull requests',
        status: 'coming_soon',
    },
    {
        id: 'whatsapp',
        name: 'WhatsApp',
        description: 'Official workspace messages',
        href: '/settings/whatsapp',
        status: 'ready',
    },
    {
        id: 'meta',
        name: 'Meta',
        description: 'Pages, Instagram, and Ads',
        href: '/settings/meta',
        status: 'ready',
    },
];

type BotDeskSnapshot = {
    chats: AgentChat[];
    customBots: BotDefinition[];
};

let customBots: BotDefinition[] = [];
let chats: AgentChat[] = [];
let chatSequence = 0;
let customBotSequence = 0;
const listeners = new Set<() => void>();

const snapshot: BotDeskSnapshot = { chats, customBots };

function publish() {
    snapshot.chats = chats;
    snapshot.customBots = customBots;
    listeners.forEach((listener) => listener());
}

export function subscribeBotDesk(listener: () => void) {
    listeners.add(listener);

    return () => listeners.delete(listener);
}

export function useBotDeskStore(): BotDeskSnapshot {
    return useSyncExternalStore(
        subscribeBotDesk,
        () => snapshot,
        () => snapshot,
    );
}

export function getBotById(
    id: string | null | undefined,
): BotDefinition | undefined {
    return [...BOT_CATALOG, ...customBots].find((bot) => bot.id === id);
}

export function createCustomBot(input: NewBotInput): BotDefinition {
    const id = `custom-${Date.now()}-${customBotSequence++}`;
    const bot: BotDefinition = {
        id,
        name: input.name.trim(),
        job: 'travaille à partir de vos instructions et des outils sélectionnés',
        description:
            input.instructions.trim() ||
            'Un bot personnalisé pour cet espace de travail.',
        group: 'custom',
        avatarTone: input.avatarTone,
        avatarType: avatarTypeForBotId(id),
        instructions: input.instructions.trim(),
        tools: input.tools,
        custom: true,
    };

    customBots = [...customBots, bot];
    publish();

    return bot;
}

export function createChat(botId: string): AgentChat {
    const bot = getBotById(botId) ?? BOT_CATALOG[0];
    const chat: AgentChat = {
        id: `chat-${Date.now()}-${chatSequence++}`,
        botId: bot.id,
        title: 'Nouvelle conversation',
        relativeTime: 'Aujourd’hui',
        messages: [],
        recordContext: null,
    };

    chats = [chat, ...chats];
    publish();

    return chat;
}

export function getChatById(
    id: string | null | undefined,
): AgentChat | undefined {
    return chats.find((chat) => chat.id === id);
}

export function setChatRecordContext(
    chatId: string,
    recordContext: AgentRecordContext | null,
): AgentChat | undefined {
    const chat = getChatById(chatId);

    if (!chat) {
        return undefined;
    }

    chat.recordContext = recordContext;
    publish();

    return chat;
}

export function addUserChatMessage(
    chatId: string,
    prompt: string,
    recordContext: AgentRecordContext | null = null,
): AgentChat | undefined {
    const chat = getChatById(chatId);

    if (!chat) {
        return undefined;
    }

    const userMessage: ChatMessage = {
        id: `${chatId}-message-${chat.messages.length}`,
        role: 'user',
        body: prompt.trim(),
        recordContext,
    };

    chat.messages = [...chat.messages, userMessage];
    chat.title = prompt.trim().slice(0, 48) || 'Nouvelle conversation';
    chat.relativeTime = 'Aujourd’hui';
    chats = [chat, ...chats.filter((item) => item.id !== chat.id)];
    publish();

    return chat;
}

export function addAssistantChatMessage(
    chatId: string,
    answer: string,
    context?: AskEvoContextPayload,
    extras?: Pick<ChatMessage, 'error' | 'reasoning' | 'toolCalls' | 'approval'>,
): AgentChat | undefined {
    const chat = getChatById(chatId);

    if (!chat) {
        return undefined;
    }

    const assistantMessage: ChatMessage = {
        id: `${chatId}-message-${chat.messages.length}`,
        role: 'assistant',
        body: answer,
        crmActions: context?.actions ?? [],
        error: extras?.error,
        reasoning: extras?.reasoning,
        toolCalls: extras?.toolCalls,
        approval: extras?.approval,
    };

    chat.messages = [...chat.messages, assistantMessage];
    chat.relativeTime = 'Aujourd’hui';
    chats = [chat, ...chats.filter((item) => item.id !== chat.id)];
    publish();

    return chat;
}

export function setChatMessageApproval(
    chatId: string,
    messageId: string,
    status: AgentApproval['status'],
): AgentChat | undefined {
    const chat = getChatById(chatId);

    if (!chat) {
        return undefined;
    }

    chat.messages = chat.messages.map((message) => {
        if (message.id !== messageId || !message.approval) {
            return message;
        }

        return {
            ...message,
            approval: { ...message.approval, status },
        };
    });
    publish();

    return chat;
}
