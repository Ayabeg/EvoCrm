import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowUpRight,
    CaretRight,
    ChatCircle,
    CheckCircle,
    Lightning,
    Plus,
    Robot,
    Sparkle,
} from '@phosphor-icons/react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { AgentsComposer } from '@/components/desk/agents-composer';
import { AgentsRoster } from '@/components/desk/agents-roster';
import { BloubAvatar } from '@/components/desk/bloub-avatar';
import { CreateBotSheet } from '@/components/desk/create-bot-sheet';
import {
    addChatTurn,
    BOT_CATALOG,
    createChat,
    getBotById,
    getChatById,
    useBotDeskStore,
} from '@/lib/desk/bot-catalog';
import type {
    AgentChat,
    BotDefinition,
    ConnectorDefinition,
} from '@/lib/desk/bot-catalog';
import { cn } from '@/lib/utils';

const focusRing =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8530E]';

const QUICK_PROMPTS = [
    'What needs a follow-up today?',
    'Qualify the newest lead',
    'Prepare the next quote step',
];

const PULSE_CHIPS = [
    {
        label: 'follow-up',
        botId: 'closer',
        prompt: 'What deserves a follow-up today?',
    },
    {
        label: 'meeting',
        botId: 'closer',
        prompt: 'Which meeting should I prepare next?',
    },
    {
        label: 'qualify',
        botId: 'qualifier',
        prompt: 'Qualify the newest lead.',
    },
    {
        label: 'quote',
        botId: 'quote-desk',
        prompt: 'What is the next useful quote step?',
    },
];

type PageProps = {
    chats?: AgentChat[];
    customBots?: BotDefinition[];
};

export default function AgentsIndex() {
    const page = usePage<PageProps>();
    const { chats, customBots } = useBotDeskStore();
    const path = (page.url.split('?')[0] ?? '/').split('#')[0] ?? '/';
    const query = new URLSearchParams(page.url.split('?')[1] ?? '');
    const routeChatId = path.startsWith('/agents/chats/')
        ? path.split('/').pop() || null
        : null;
    const routeBotId = path.startsWith('/agents/bots/')
        ? path.split('/').pop() || null
        : null;
    const isChatsRoute = path === '/agents/chats' || Boolean(routeChatId);
    const isBotsRoute = path === '/agents/bots' || Boolean(routeBotId);
    const isNewBotRoute = path === '/agents/bots/new';
    const inheritedCustomBots = page.props.customBots ?? [];
    const inheritedChats = page.props.chats ?? [];
    const allCustomBots =
        customBots.length > 0 ? customBots : inheritedCustomBots;
    const allChats = chats.length > 0 ? chats : inheritedChats;
    const routeChat = getChatById(routeChatId);
    const routeBot = getBotById(routeBotId);
    const requestedBot = getBotById(query.get('bot'));
    const [pendingChatId, setPendingChatId] = useState<string | null>(null);
    const [selectedBotOverride, setSelectedBotOverride] =
        useState<BotDefinition | null>(null);
    const [selectedConnectorIds, setSelectedConnectorIds] = useState<string[]>(
        [],
    );
    const [createBotOpen, setCreateBotOpen] = useState(false);

    const activeChatId =
        routeChatId ?? (path === '/agents/chats' ? pendingChatId : null);
    const activeChat = allChats.find((chat) => chat.id === activeChatId);
    const selectedBot =
        (routeChat
            ? getBotById(routeChat.botId)
            : (routeBot ?? requestedBot ?? selectedBotOverride)) ??
        BOT_CATALOG[1];
    const isLanding = !isChatsRoute && !isBotsRoute;

    function navigateToChat(chatId: string) {
        router.visit(`/agents/chats/${chatId}`, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    }

    function startChat(bot: BotDefinition) {
        const chat = createChat(bot.id);
        setSelectedBotOverride(bot);
        setSelectedConnectorIds([]);
        setPendingChatId(chat.id);
        navigateToChat(chat.id);
    }

    function handleBotSelect(bot: BotDefinition) {
        if (activeChat && activeChat.botId === bot.id) {
            setSelectedBotOverride(bot);

            return;
        }

        startChat(bot);
    }

    function handleSend(prompt: string) {
        let chat = activeChat;

        if (!chat) {
            chat = createChat(selectedBot.id);
            setPendingChatId(chat.id);
            navigateToChat(chat.id);
        }

        addChatTurn(chat.id, prompt);
    }

    function handlePulseChip(botId: string, prompt: string) {
        const bot = getBotById(botId) ?? BOT_CATALOG[1];
        const chat =
            activeChat?.botId === bot.id ? activeChat : createChat(bot.id);

        setSelectedBotOverride(bot);
        setPendingChatId(chat.id);
        setSelectedConnectorIds([]);
        navigateToChat(chat.id);
        addChatTurn(chat.id, prompt);
    }

    function handleAttachConnector(connector: ConnectorDefinition) {
        setSelectedConnectorIds((current) =>
            current.includes(connector.id)
                ? current
                : [...current, connector.id],
        );
    }

    function handleCreated(bot: BotDefinition) {
        setSelectedBotOverride(bot);
        setCreateBotOpen(false);

        if (isNewBotRoute) {
            router.visit('/agents/bots', {
                preserveState: true,
                replace: true,
            });
        }
    }

    function handleCreateBotOpenChange(open: boolean) {
        setCreateBotOpen(open);

        if (!open && isNewBotRoute) {
            router.visit('/agents/bots', {
                preserveState: true,
                replace: true,
            });
        }
    }

    const title = isBotsRoute ? 'Bots' : isChatsRoute ? 'Chats' : 'Agents';

    return (
        <>
            <Head title={`${title} · Agents`} />
            <main
                aria-label="Agents workspace"
                className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#F7F8F5] text-[#0D1B24]"
                data-agents-page
                data-agents-route={path}
            >
                <header className="flex shrink-0 items-center justify-between gap-4 border-b border-black/8 bg-white px-5 py-4 sm:px-7">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.12em] text-[#E8530E] uppercase">
                            <Sparkle className="size-3.5" weight="fill" />
                            EvoPulse command
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                            {isLanding ? (
                                <p className="truncate text-[20px] font-semibold tracking-[-0.03em] text-[#0D1B24]">
                                    Agents
                                </p>
                            ) : (
                                <h1 className="truncate text-[20px] font-semibold tracking-[-0.03em] text-[#0D1B24]">
                                    {title}
                                </h1>
                            )}
                            <span className="hidden rounded-full border border-[#0F4C5C]/15 bg-[#0F4C5C]/[0.05] px-2 py-0.5 text-[10px] font-medium text-[#0F4C5C] sm:inline-flex">
                                local slice
                            </span>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        {isBotsRoute ? (
                            <button
                                type="button"
                                className={cn(
                                    'inline-flex h-8 items-center gap-1.5 rounded-md bg-[#E8530E] px-3 text-[12px] font-semibold text-white hover:bg-[#C9480B]',
                                    focusRing,
                                )}
                                onClick={() => setCreateBotOpen(true)}
                            >
                                <Plus className="size-3.5" weight="bold" />
                                New bot
                            </button>
                        ) : null}
                        <Link
                            href="/agents/chats"
                            className={cn(
                                'hidden h-8 items-center gap-1.5 rounded-md border border-black/10 bg-white px-3 text-[12px] font-medium text-[#0D1B24] hover:bg-[#F7F8F5] sm:inline-flex',
                                focusRing,
                            )}
                        >
                            <ChatCircle className="size-3.5" weight="regular" />
                            New chat
                        </Link>
                    </div>
                </header>

                {isBotsRoute ? (
                    <BotsView
                        botId={routeBotId}
                        customBots={allCustomBots}
                        onStartChat={startChat}
                        onCreateBot={() => setCreateBotOpen(true)}
                    />
                ) : isLanding ? (
                    <PulseLanding
                        selectedBot={selectedBot}
                        selectedConnectorIds={selectedConnectorIds}
                        onSelectBot={handleBotSelect}
                        onAttachConnector={handleAttachConnector}
                        onRemoveConnector={(connectorId) =>
                            setSelectedConnectorIds((current) =>
                                current.filter((id) => id !== connectorId),
                            )
                        }
                        onCreateBot={() => setCreateBotOpen(true)}
                        onSend={handleSend}
                        onPulseChip={handlePulseChip}
                    />
                ) : (
                    <ChatView
                        chat={activeChat}
                        selectedBot={selectedBot}
                        selectedConnectorIds={selectedConnectorIds}
                        onSelectBot={handleBotSelect}
                        onAttachConnector={handleAttachConnector}
                        onRemoveConnector={(connectorId) =>
                            setSelectedConnectorIds((current) =>
                                current.filter((id) => id !== connectorId),
                            )
                        }
                        onCreateBot={() => setCreateBotOpen(true)}
                        onSend={handleSend}
                        onQuickPrompt={handleSend}
                    />
                )}
            </main>
            <CreateBotSheet
                open={createBotOpen || isNewBotRoute}
                onOpenChange={handleCreateBotOpenChange}
                onCreated={handleCreated}
            />
        </>
    );
}

function PulseLanding({
    selectedBot,
    selectedConnectorIds,
    onSelectBot,
    onAttachConnector,
    onRemoveConnector,
    onCreateBot,
    onSend,
    onPulseChip,
}: {
    selectedBot: BotDefinition;
    selectedConnectorIds: string[];
    onSelectBot: (bot: BotDefinition) => void;
    onAttachConnector: (connector: ConnectorDefinition) => void;
    onRemoveConnector: (connectorId: string) => void;
    onCreateBot: () => void;
    onSend: (prompt: string) => void;
    onPulseChip: (botId: string, prompt: string) => void;
}) {
    return (
        <section className="min-h-0 flex-1 overflow-y-auto" data-pulse-landing>
            <div className="mx-auto flex min-h-full w-full max-w-[640px] flex-col items-center px-5 py-12 text-center sm:py-16">
                <BloubAvatar size={72} state="idle" />
                <h1 className="mt-6 text-[34px] font-semibold tracking-[-0.05em] text-[#0D1B24] sm:text-[42px]">
                    What should we do next?
                </h1>
                <p className="mt-3 max-w-[520px] text-[13px] leading-6 text-[#0D1B24]/58">
                    Ask for the next useful move across deals, leads, quotes, or
                    a WhatsApp thread.
                </p>

                {/* composer */}
                <div className="mt-8 w-full text-left">
                    <AgentsComposer
                        selectedBot={selectedBot}
                        selectedConnectorIds={selectedConnectorIds}
                        onSelectBot={onSelectBot}
                        onAttachConnector={onAttachConnector}
                        onRemoveConnector={onRemoveConnector}
                        onCreateBot={onCreateBot}
                        onSend={onSend}
                    />
                    <p className="mt-3 text-center text-[10px] text-[#0D1B24]/38">
                        Stub replies only in this slice. No CRM records are
                        written.
                    </p>
                </div>

                {/* chips */}
                <div
                    role="group"
                    aria-label="Command shortcuts"
                    className="mt-5 flex flex-wrap justify-center gap-2"
                >
                    {PULSE_CHIPS.map((chip) => (
                        <button
                            key={chip.label}
                            type="button"
                            className={cn(
                                'inline-flex min-h-8 items-center rounded-full border border-[#0D1B24]/10 bg-white px-3 text-[11px] font-medium text-[#0D1B24]/68 transition-colors hover:border-[#E8530E]/30 hover:bg-[#E8530E]/[0.05] hover:text-[#E8530E]',
                                focusRing,
                            )}
                            onClick={() => onPulseChip(chip.botId, chip.prompt)}
                        >
                            {chip.label}
                        </button>
                    ))}
                </div>

                <AgentsRoster className="mt-8 text-left" />
            </div>
        </section>
    );
}

function ChatView({
    chat,
    selectedBot,
    selectedConnectorIds,
    onSelectBot,
    onAttachConnector,
    onRemoveConnector,
    onCreateBot,
    onSend,
    onQuickPrompt,
}: {
    chat?: AgentChat;
    selectedBot: BotDefinition;
    selectedConnectorIds: string[];
    onSelectBot: (bot: BotDefinition) => void;
    onAttachConnector: (connector: ConnectorDefinition) => void;
    onRemoveConnector: (connectorId: string) => void;
    onCreateBot: () => void;
    onSend: (prompt: string) => void;
    onQuickPrompt: (prompt: string) => void;
}) {
    return (
        <section className="flex min-h-0 flex-1 flex-col" data-agents-chat-view>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-7 sm:px-7">
                <div className="mx-auto flex w-full max-w-[760px] flex-1 flex-col">
                    <div className="mb-8 flex items-start justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-semibold tracking-[0.12em] text-[#0D1B24]/45 uppercase">
                                {chat
                                    ? 'Active conversation'
                                    : 'Command surface'}
                            </p>
                            <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-[#0D1B24] sm:text-[34px]">
                                {chat ? chat.title : 'Ask the desk.'}
                            </h2>
                            <p className="mt-2 max-w-[520px] text-[13px] leading-6 text-[#0D1B24]/58">
                                {chat
                                    ? `${selectedBot.name} is ready to keep the next step moving.`
                                    : 'Grounded help for deals, leads, quotes, and the conversations behind them.'}
                            </p>
                        </div>
                        <div className="hidden shrink-0 rounded-lg border border-[#E8530E]/15 bg-[#E8530E]/[0.05] px-3 py-2 text-right sm:block">
                            <p className="text-[10px] font-semibold tracking-[0.1em] text-[#E8530E] uppercase">
                                one bot
                            </p>
                            <p className="mt-0.5 text-[11px] text-[#0D1B24]/58">
                                one clear thread
                            </p>
                        </div>
                    </div>

                    {chat && chat.messages.length > 0 ? (
                        <div className="space-y-5" aria-live="polite">
                            {chat.messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={cn(
                                        'flex',
                                        message.role === 'user'
                                            ? 'justify-end'
                                            : 'justify-start',
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'max-w-[min(100%,580px)] rounded-xl border px-4 py-3 text-[13px] leading-6',
                                            message.role === 'user'
                                                ? 'border-[#0D1B24] bg-[#0D1B24] text-white'
                                                : 'border-black/8 bg-white text-[#0D1B24]',
                                        )}
                                    >
                                        {message.body}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid flex-1 content-center py-8">
                            <div className="max-w-[540px]">
                                <div className="grid size-11 place-items-center rounded-xl bg-[#0D1B24] text-[#E8530E] shadow-[0_8px_22px_rgba(13,27,36,0.14)]">
                                    <Lightning
                                        className="size-5"
                                        weight="fill"
                                    />
                                </div>
                                <p className="mt-4 text-[15px] font-medium text-[#0D1B24]">
                                    Start with a useful question.
                                </p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {QUICK_PROMPTS.map((prompt) => (
                                        <button
                                            key={prompt}
                                            type="button"
                                            className={cn(
                                                'inline-flex min-h-8 items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 text-[11px] text-[#0D1B24]/70 hover:border-[#0F4C5C]/25 hover:bg-[#0F4C5C]/[0.05] hover:text-[#0F4C5C]',
                                                focusRing,
                                            )}
                                            onClick={() =>
                                                onQuickPrompt(prompt)
                                            }
                                        >
                                            {prompt}
                                            <CaretRight
                                                className="size-3"
                                                weight="bold"
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-8">
                        <AgentsComposer
                            selectedBot={selectedBot}
                            selectedConnectorIds={selectedConnectorIds}
                            onSelectBot={onSelectBot}
                            onAttachConnector={onAttachConnector}
                            onRemoveConnector={onRemoveConnector}
                            onCreateBot={onCreateBot}
                            onSend={onSend}
                        />
                        <p className="mt-3 text-center text-[10px] text-[#0D1B24]/38">
                            Stub replies only in this slice. No CRM records are
                            written.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

function BotsView({
    botId,
    customBots,
    onStartChat,
    onCreateBot,
}: {
    botId: string | null;
    customBots: BotDefinition[];
    onStartChat: (bot: BotDefinition) => void;
    onCreateBot: () => void;
}) {
    const selectedBot = getBotById(botId);

    if (botId && selectedBot) {
        return (
            <section className="min-h-0 flex-1 overflow-y-auto px-5 py-7 sm:px-7">
                <div className="mx-auto max-w-[760px]">
                    <Link
                        href="/agents/bots"
                        className={cn(
                            'inline-flex items-center gap-1.5 text-[12px] text-[#0D1B24]/55 hover:text-[#0F4C5C]',
                            focusRing,
                        )}
                    >
                        <ArrowLeft className="size-3.5" weight="bold" />
                        All bots
                    </Link>
                    <div className="mt-8 flex flex-wrap items-start justify-between gap-5">
                        <div className="flex items-start gap-3">
                            <BotBadge bot={selectedBot} size="lg" />
                            <div>
                                <p className="text-[10px] font-semibold tracking-[0.12em] text-[#E8530E] uppercase">
                                    {selectedBot.group === 'custom'
                                        ? 'Custom bot'
                                        : selectedBot.group}
                                </p>
                                <h2 className="mt-1 text-[28px] font-semibold tracking-[-0.04em] text-[#0D1B24]">
                                    {selectedBot.name}
                                </h2>
                                <p className="mt-2 text-[13px] leading-6 text-[#0D1B24]/58">
                                    {selectedBot.description}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            className={cn(
                                'inline-flex h-9 items-center gap-1.5 rounded-md bg-[#E8530E] px-3.5 text-[12px] font-semibold text-white hover:bg-[#C9480B]',
                                focusRing,
                            )}
                            onClick={() => onStartChat(selectedBot)}
                        >
                            <ChatCircle className="size-3.5" weight="regular" />
                            Start a chat
                        </button>
                    </div>
                    <div className="mt-9 grid gap-3 sm:grid-cols-2">
                        <DetailPanel label="Job">
                            <p className="text-[13px] leading-6 text-[#0D1B24]">
                                {selectedBot.job}
                            </p>
                        </DetailPanel>
                        <DetailPanel label="Mode">
                            <p className="text-[13px] leading-6 text-[#0D1B24]">
                                {selectedBot.custom
                                    ? 'Custom instructions'
                                    : 'EvoCRM desk catalog'}
                            </p>
                        </DetailPanel>
                    </div>
                    {selectedBot.custom ? (
                        <DetailPanel label="Tools" className="mt-3">
                            <div className="flex flex-wrap gap-2">
                                {(selectedBot.tools ?? []).length > 0 ? (
                                    selectedBot.tools?.map((tool) => (
                                        <span
                                            key={tool}
                                            className="inline-flex items-center gap-1.5 rounded-full border border-[#0F4C5C]/15 bg-[#0F4C5C]/[0.05] px-2.5 py-1 text-[11px] text-[#0F4C5C]"
                                        >
                                            <CheckCircle
                                                className="size-3"
                                                weight="fill"
                                            />
                                            {tool}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-[12px] text-[#0D1B24]/52">
                                        No tools selected.
                                    </span>
                                )}
                            </div>
                        </DetailPanel>
                    ) : null}
                </div>
            </section>
        );
    }

    const salesBots = BOT_CATALOG.filter((bot) => bot.group === 'sales');
    const internalBots = BOT_CATALOG.filter(
        (bot) => bot.group === 'internal' || bot.group === 'evopulse',
    );

    return (
        <section className="min-h-0 flex-1 overflow-y-auto px-5 py-7 sm:px-7">
            <div className="mx-auto max-w-[900px]">
                <div className="max-w-[620px]">
                    <p className="text-[13px] leading-6 text-[#0D1B24]/58">
                        Small, focused operators for the work that keeps a
                        revenue team moving. Pick one to start a thread, or
                        create a custom Bot for a repeatable job.
                    </p>
                </div>
                <BotSection
                    label="Sales"
                    bots={salesBots}
                    onStartChat={onStartChat}
                />
                <BotSection
                    label="Internal"
                    bots={internalBots}
                    onStartChat={onStartChat}
                />
                {customBots.length > 0 ? (
                    <BotSection
                        label="Custom"
                        bots={customBots}
                        onStartChat={onStartChat}
                    />
                ) : (
                    <section className="mt-8 rounded-xl border border-dashed border-black/12 bg-white/55 px-4 py-5">
                        <p className="text-[12px] font-medium text-[#0D1B24]">
                            No custom bots yet.
                        </p>
                        <p className="mt-1 text-[12px] leading-5 text-[#0D1B24]/52">
                            Make one when a repeatable workflow deserves its own
                            operator.
                        </p>
                        <button
                            type="button"
                            className={cn(
                                'mt-3 inline-flex h-8 items-center gap-1.5 rounded-md border border-[#E8530E]/25 px-3 text-[11px] font-medium text-[#E8530E] hover:bg-[#E8530E]/[0.05]',
                                focusRing,
                            )}
                            onClick={onCreateBot}
                        >
                            <Plus className="size-3.5" weight="bold" />
                            Create a new Bot
                        </button>
                    </section>
                )}
            </div>
        </section>
    );
}

function BotSection({
    label,
    bots,
    onStartChat,
}: {
    label: string;
    bots: BotDefinition[];
    onStartChat: (bot: BotDefinition) => void;
}) {
    return (
        <section className="mt-8" aria-labelledby={`bot-section-${label}`}>
            <h2
                id={`bot-section-${label}`}
                className="text-[10px] font-semibold tracking-[0.12em] text-[#0D1B24]/45 uppercase"
            >
                {label}
            </h2>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
                {bots.map((bot) => (
                    <BotCard key={bot.id} bot={bot} onStartChat={onStartChat} />
                ))}
            </div>
        </section>
    );
}

function BotCard({
    bot,
    onStartChat,
}: {
    bot: BotDefinition;
    onStartChat: (bot: BotDefinition) => void;
}) {
    return (
        <article className="flex min-h-[112px] items-start gap-3 rounded-xl border border-black/8 bg-white p-4 transition-colors hover:border-[#0F4C5C]/25 hover:bg-[#0F4C5C]/[0.025]">
            <Link
                href={`/agents/bots/${bot.id}`}
                className={cn(
                    'group flex min-w-0 flex-1 items-start gap-3',
                    focusRing,
                )}
            >
                <BotBadge bot={bot} />
                <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                        <span className="truncate text-[13px] font-semibold text-[#0D1B24]">
                            {bot.name}
                        </span>
                        <ArrowUpRight
                            className="size-4 shrink-0 text-[#0D1B24]/35 transition-colors group-hover:text-[#0F4C5C]"
                            weight="regular"
                        />
                    </span>
                    <span className="mt-1 block text-[12px] leading-5 text-[#0D1B24]/55">
                        {bot.description}
                    </span>
                </span>
            </Link>
            <button
                type="button"
                className={cn(
                    'mt-auto inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-[#E8530E] hover:text-[#C9480B]',
                    focusRing,
                )}
                onClick={() => onStartChat(bot)}
            >
                Start <CaretRight className="size-3" weight="bold" />
            </button>
        </article>
    );
}

function DetailPanel({
    label,
    children,
    className,
}: {
    label: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            className={cn(
                'rounded-xl border border-black/8 bg-white p-4',
                className,
            )}
        >
            <p className="text-[10px] font-semibold tracking-[0.1em] text-[#0D1B24]/45 uppercase">
                {label}
            </p>
            <div className="mt-2">{children}</div>
        </section>
    );
}

function BotBadge({
    bot,
    size = 'sm',
}: {
    bot: BotDefinition;
    size?: 'sm' | 'lg';
}) {
    return (
        <span
            className={cn(
                'grid shrink-0 place-items-center rounded-lg',
                size === 'lg' ? 'size-12' : 'size-9',
                bot.avatarTone === 'orange' && 'bg-[#E8530E]/12 text-[#E8530E]',
                bot.avatarTone === 'teal' && 'bg-[#0F4C5C]/12 text-[#0F4C5C]',
                bot.avatarTone === 'night' && 'bg-[#0D1B24] text-white',
                bot.avatarTone === 'ink' && 'bg-[#0D1B24]/8 text-[#0D1B24]',
            )}
            aria-hidden="true"
        >
            {size === 'lg' ? (
                <Robot className="size-6" weight="regular" />
            ) : (
                <Robot className="size-4" weight="regular" />
            )}
        </span>
    );
}
