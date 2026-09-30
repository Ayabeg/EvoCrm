import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowUpRight,
    CaretRight,
    ChatCircle,
    CheckCircle,
    Plus,
} from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
    AgentsWorkspace,
    AgentsDirectoryHome,
} from '@/components/desk/agents-workspace';
import { BloubAvatar } from '@/components/desk/bloub-avatar';
import { CreateBotSheet } from '@/components/desk/create-bot-sheet';
import { resolveAgentProfile } from '@/lib/desk/agent-profiles';
import {
    dispatchAgentsWorkspace,
    useAgentsWorkspaceState,
} from '@/lib/desk/agents-workspace-state';
import { agentAskError, askAgent } from '@/lib/desk/ask-agent';
import type {
    AgentChat,
    AgentRecordContext,
    BotDefinition,
} from '@/lib/desk/bot-catalog';
import {
    addAssistantChatMessage,
    addUserChatMessage,
    BOT_CATALOG,
    createChat,
    getBotById,
    getChatById,
    setChatRecordContext,
    useBotDeskStore,
} from '@/lib/desk/bot-catalog';
import { cn } from '@/lib/utils';

const focusRing =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8530E]';

type PageProps = {
    chats?: AgentChat[];
    customBots?: BotDefinition[];
};

export default function AgentsIndex() {
    const page = usePage<PageProps>();
    const { chats, customBots } = useBotDeskStore();
    const workspace = useAgentsWorkspaceState();
    const path = (page.url.split('?')[0] ?? '/').split('#')[0] ?? '/';
    const query = new URLSearchParams(page.url.split('?')[1] ?? '');
    const routeChatId = path.startsWith('/agents/chats/')
        ? path.split('/').pop() || null
        : null;
    const routeBotId = path.startsWith('/agents/bots/')
        ? path.split('/').pop() || null
        : null;
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
    const activeChatId =
        workspace.view === 'agent'
            ? (workspace.selectedChatId ??
              (routeChat?.botId === workspace.selectedAgentId
                  ? routeChatId
                  : null))
            : routeChatId;
    const activeChat = allChats.find((chat) => chat.id === activeChatId);
    const selectedAgentId =
        activeChat?.botId ??
        workspace.selectedAgentId ??
        routeChat?.botId ??
        routeBot?.id ??
        requestedBot?.id ??
        'closer';
    const selectedBot = getBotById(selectedAgentId) ?? BOT_CATALOG[1];
    const profile =
        resolveAgentProfile(selectedAgentId) ?? resolveAgentProfile('closer')!;
    const [draftContext, setDraftContext] = useState<AgentRecordContext | null>(
        null,
    );
    const [sendingChatId, setSendingChatId] = useState<string | null>(null);
    const [createBotOpen, setCreateBotOpen] = useState(false);

    useEffect(() => {
        if (isBotsRoute) {
            return;
        }

        if (routeChatId && routeChat) {
            dispatchAgentsWorkspace({
                type: 'open-chat',
                agentId: routeChat.botId,
                chatId: routeChat.id,
            });

            return;
        }

        if (path === '/agents/chats') {
            dispatchAgentsWorkspace({
                type: 'set-directory-tab',
                tab: 'chats',
            });

            return;
        }

        if (path === '/agents') {
            if (requestedBot) {
                dispatchAgentsWorkspace({
                    type: 'select-agent',
                    agentId: requestedBot.id,
                });
            } else {
                dispatchAgentsWorkspace({
                    type: 'set-directory-tab',
                    tab: 'agents',
                });
            }
        }
    }, [isBotsRoute, path, requestedBot, routeChat, routeChatId]);

    function startChat(bot: BotDefinition) {
        const chat = createChat(bot.id);
        setDraftContext(null);
        dispatchAgentsWorkspace({
            type: 'open-chat',
            agentId: bot.id,
            chatId: chat.id,
        });
    }

    function handleBotSelect(bot: BotDefinition) {
        if (bot.id !== selectedAgentId) {
            setDraftContext(null);
        }

        dispatchAgentsWorkspace({
            type: 'select-agent',
            agentId: bot.id,
        });
    }

    function handleContextSelect(context: AgentRecordContext | null) {
        setDraftContext(context);

        if (activeChat) {
            setChatRecordContext(activeChat.id, context);
        }
    }

    async function handleSend(
        prompt: string,
        context: AgentRecordContext | null,
    ) {
        let chat = activeChat;

        if (!chat || chat.botId !== selectedAgentId) {
            chat = createChat(selectedAgentId);
            dispatchAgentsWorkspace({
                type: 'open-chat',
                agentId: selectedAgentId,
                chatId: chat.id,
            });
        }

        const chatId = chat.id;
        const recordContext = context ?? chat.recordContext ?? null;
        setDraftContext(recordContext);
        setChatRecordContext(chatId, recordContext);
        addUserChatMessage(chatId, prompt, recordContext);
        setSendingChatId(chatId);

        try {
            const response = await askAgent(prompt, profile, recordContext);
            const answer =
                response.ok && response.answer?.trim()
                    ? response.answer.trim()
                    : agentAskError(response);
            addAssistantChatMessage(chatId, answer, response.context);
        } catch {
            addAssistantChatMessage(
                chatId,
                'Le service est momentanément indisponible. Réessayez.',
            );
        } finally {
            setSendingChatId((current) =>
                current === chatId ? null : current,
            );
        }
    }

    function handleCreated(bot: BotDefinition) {
        setCreateBotOpen(false);
        handleBotSelect(bot);

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

    if (isBotsRoute) {
        return (
            <>
                <Head title="Bots · Agents" />
                <main
                    aria-label="Agents workspace"
                    className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#F7F8F5] text-[#0D1B24]"
                    data-agents-page
                    data-agents-route={path}
                >
                    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-black/8 bg-white px-5 py-4 sm:px-7">
                        <div>
                            <p className="text-[10px] font-semibold tracking-[0.12em] text-[#E8530E] uppercase">
                                Agents
                            </p>
                            <h1 className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">
                                Bots
                            </h1>
                        </div>
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
                    </header>
                    <BotsView
                        botId={routeBotId}
                        customBots={allCustomBots}
                        onStartChat={startChat}
                        onCreateBot={() => setCreateBotOpen(true)}
                    />
                </main>
                <CreateBotSheet
                    open={createBotOpen || isNewBotRoute}
                    onOpenChange={handleCreateBotOpenChange}
                    onCreated={handleCreated}
                />
            </>
        );
    }

    return (
        <>
            <Head title={`${selectedBot.name} · Agents`} />
            {workspace.view === 'agent' ? (
                <AgentsWorkspace
                    profile={profile}
                    selectedBot={selectedBot}
                    chat={activeChat}
                    selectedContext={activeChat?.recordContext ?? draftContext}
                    sending={sendingChatId === activeChat?.id}
                    onNewChat={() => startChat(selectedBot)}
                    onSelectBot={handleBotSelect}
                    onSelectContext={handleContextSelect}
                    onCreateBot={() => setCreateBotOpen(true)}
                    onSend={handleSend}
                />
            ) : (
                <AgentsDirectoryHome
                    onSelectAgent={(agentId) => {
                        setDraftContext(null);
                        dispatchAgentsWorkspace({
                            type: 'select-agent',
                            agentId,
                        });
                    }}
                />
            )}
            <CreateBotSheet
                open={createBotOpen}
                onOpenChange={handleCreateBotOpenChange}
                onCreated={handleCreated}
            />
        </>
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
        <BloubAvatar
            bot={bot}
            label={`${bot.name} avatar`}
            size={size === 'lg' ? 72 : 28}
            state="idle"
        />
    );
}
