import { useSyncExternalStore } from 'react';

export type AvatarTone = 'ink' | 'teal' | 'orange' | 'night';

export type BotGroup = 'sales' | 'internal' | 'evopulse' | 'custom';

export type BotDefinition = {
    id: string;
    name: string;
    job: string;
    description: string;
    group: BotGroup;
    avatarTone: AvatarTone;
    instructions?: string;
    tools?: string[];
    custom?: boolean;
};

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
};

export type AgentChat = {
    id: string;
    botId: string;
    title: string;
    relativeTime: string;
    messages: ChatMessage[];
};

export type NewBotInput = {
    name: string;
    instructions: string;
    tools: string[];
    avatarTone: AvatarTone;
};

export const BOT_CATALOG: BotDefinition[] = [
    {
        id: 'desk',
        name: 'Desk router',
        job: 'routes the request to the right desk',
        description: 'A quiet front door for work that needs a specialist.',
        group: 'internal',
        avatarTone: 'ink',
    },
    {
        id: 'closer',
        name: 'Closer',
        job: 'turns active opportunities into next steps',
        description: 'Keeps momentum on qualified conversations and deals.',
        group: 'sales',
        avatarTone: 'orange',
    },
    {
        id: 'qualifier',
        name: 'Qualifier',
        job: 'qualifies leads with useful context',
        description: 'Separates real buying intent from noise.',
        group: 'sales',
        avatarTone: 'teal',
    },
    {
        id: 'quote-desk',
        name: 'Quote desk',
        job: 'turns requirements into a clear quote path',
        description: 'Helps shape the next quote without inventing numbers.',
        group: 'sales',
        avatarTone: 'ink',
    },
    {
        id: 'after-sale',
        name: 'After-sale',
        job: 'keeps customers moving after the handoff',
        description: 'Surfaces follow-ups, meetings, and renewal signals.',
        group: 'sales',
        avatarTone: 'teal',
    },
    {
        id: 'evopulse-shell-ia',
        name: 'EvoPulse · Shell IA',
        job: 'maps the workspace information architecture',
        description:
            'Internal product intelligence for navigation and structure.',
        group: 'evopulse',
        avatarTone: 'night',
    },
    {
        id: 'evopulse-pulse-ui',
        name: 'EvoPulse · Pulse UI',
        job: 'turns signals into a focused operating surface',
        description:
            'Internal product intelligence for calm, useful interfaces.',
        group: 'evopulse',
        avatarTone: 'teal',
    },
    {
        id: 'evopulse-command-ui',
        name: 'EvoPulse · Command UI',
        job: 'shapes fast, grounded command flows',
        description: 'Internal product intelligence for speed and clarity.',
        group: 'evopulse',
        avatarTone: 'orange',
    },
    {
        id: 'night-shift',
        name: 'Night shift',
        job: 'keeps a quiet watch on overnight work',
        description: 'Internal product intelligence for low-noise monitoring.',
        group: 'evopulse',
        avatarTone: 'ink',
    },
];

export const BOT_GROUPS: Array<{
    key: Exclude<BotGroup, 'custom'>;
    label: string;
    ids: string[];
}> = [
    {
        key: 'sales',
        label: 'Sales',
        ids: ['closer', 'qualifier', 'quote-desk', 'after-sale'],
    },
    { key: 'internal', label: 'Internal', ids: ['desk'] },
    {
        key: 'evopulse',
        label: 'EvoPulse',
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
    const bot: BotDefinition = {
        id: `custom-${Date.now()}-${customBotSequence++}`,
        name: input.name.trim(),
        job: 'works from your instructions and selected tools',
        description:
            input.instructions.trim() || 'A custom bot for this workspace.',
        group: 'custom',
        avatarTone: input.avatarTone,
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
        title: `${bot.name} chat`,
        relativeTime: 'now',
        messages: [],
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

export function addChatTurn(
    chatId: string,
    prompt: string,
): AgentChat | undefined {
    const chat = getChatById(chatId);

    if (!chat) {
        return undefined;
    }

    const bot = getBotById(chat.botId) ?? BOT_CATALOG[0];
    const nextUsefulStep =
        'Review the context, then confirm the next owner and due date.';
    const userMessage: ChatMessage = {
        id: `${chatId}-user-${chat.messages.length}`,
        role: 'user',
        body: prompt.trim(),
    };
    const assistantMessage: ChatMessage = {
        id: `${chatId}-assistant-${chat.messages.length}`,
        role: 'assistant',
        body: `${bot.name} · ${bot.job}\n\n${nextUsefulStep}`,
    };

    chat.messages = [...chat.messages, userMessage, assistantMessage];
    chat.title = prompt.trim().slice(0, 42) || `${bot.name} chat`;
    chat.relativeTime = 'now';
    chats = [chat, ...chats.filter((item) => item.id !== chat.id)];
    publish();

    return chat;
}
