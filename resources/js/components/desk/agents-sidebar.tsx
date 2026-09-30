import { Link } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    CaretRight,
    ChatCircle,
    GearSix,
    MagnifyingGlass,
    Plus,
    StarFour,
} from '@phosphor-icons/react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import { BloubAvatar } from '@/components/desk/bloub-avatar';
import { AGENT_PROFILES, resolveAgentProfile } from '@/lib/desk/agent-profiles';
import type { AgentProfile } from '@/lib/desk/agent-profiles';
import {
    dispatchAgentsWorkspace,
    useAgentsWorkspaceState,
} from '@/lib/desk/agents-workspace-state';
import type { AgentChat, BotDefinition } from '@/lib/desk/bot-catalog';
import { createChat, useBotDeskStore } from '@/lib/desk/bot-catalog';
import { cn } from '@/lib/utils';

type Props = {
    onNavigate?: () => void;
};

const focusRing =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shell-orange';

const quietButton =
    'inline-flex min-h-8 items-center gap-2 rounded-md px-2 text-[12px] text-shell-ink-2 transition-colors hover:bg-white/[0.08] hover:text-shell-ink motion-reduce:transition-none';

export function AgentsSidebar({ onNavigate }: Props) {
    const workspace = useAgentsWorkspaceState();
    const { chats, customBots } = useBotDeskStore();
    const reduceMotion = useReducedMotion();
    const directoryScrollRef = useRef<HTMLDivElement>(null);
    const agentScrollRef = useRef<HTMLDivElement>(null);
    const [savedScroll, setSavedScroll] = useState({ directory: 0, agent: 0 });
    const selectedProfile =
        resolveAgentProfile(workspace.selectedAgentId) ?? AGENT_PROFILES[0];
    const entryX = workspace.view === 'directory' ? -12 : 16;
    const exitX = workspace.view === 'directory' ? -12 : 16;

    useLayoutEffect(() => {
        if (workspace.view === 'directory' && directoryScrollRef.current) {
            directoryScrollRef.current.scrollTop = savedScroll.directory;
        }

        if (workspace.view === 'agent' && agentScrollRef.current) {
            agentScrollRef.current.scrollTop = savedScroll.agent;
        }
    }, [savedScroll, workspace.view]);

    function selectAgent(agentId: string) {
        setSavedScroll((current) => ({
            directory: directoryScrollRef.current?.scrollTop ?? 0,
            agent: workspace.selectedAgentId === agentId ? current.agent : 0,
        }));

        dispatchAgentsWorkspace({ type: 'select-agent', agentId });
        onNavigate?.();
    }

    function startChat(agentId: string) {
        setSavedScroll((current) => ({
            ...current,
            agent: agentScrollRef.current?.scrollTop ?? 0,
        }));
        const chat = createChat(agentId);
        dispatchAgentsWorkspace({
            type: 'open-chat',
            agentId,
            chatId: chat.id,
        });
        onNavigate?.();
    }

    function backToDirectory() {
        setSavedScroll((current) => ({
            ...current,
            agent: agentScrollRef.current?.scrollTop ?? 0,
        }));
        dispatchAgentsWorkspace({ type: 'back-to-directory' });
        onNavigate?.();
    }

    return (
        <div
            className="evo-agents-sidebar flex h-full min-h-0 w-full shrink-0 flex-col"
            data-agents-sidebar
        >
            <div className="relative min-h-0 flex-1 overflow-hidden">
                <AnimatePresence initial={false} mode="wait">
                    {workspace.view === 'directory' ? (
                        <motion.div
                            key="directory"
                            className="absolute inset-0 flex min-h-0 flex-col"
                            initial={
                                reduceMotion ? false : { opacity: 0, x: entryX }
                            }
                            animate={{ opacity: 1, x: 0 }}
                            exit={
                                reduceMotion
                                    ? { opacity: 0 }
                                    : { opacity: 0, x: exitX }
                            }
                            transition={{
                                duration: reduceMotion ? 0 : 0.2,
                                ease: [0.2, 0.8, 0.2, 1],
                            }}
                        >
                            <DirectoryPane
                                chats={chats}
                                customBots={customBots}
                                scrollRef={directoryScrollRef}
                                initialScrollTop={savedScroll.directory}
                                tab={workspace.tab}
                                selectedAgentId={workspace.selectedAgentId}
                                onSelectAgent={selectAgent}
                                onSelectChat={(chat) => {
                                    setSavedScroll((current) => ({
                                        ...current,
                                        directory:
                                            directoryScrollRef.current
                                                ?.scrollTop ?? 0,
                                    }));
                                    dispatchAgentsWorkspace({
                                        type: 'open-chat',
                                        agentId: chat.botId,
                                        chatId: chat.id,
                                    });
                                    onNavigate?.();
                                }}
                                onChangeTab={(tab) =>
                                    dispatchAgentsWorkspace({
                                        type: 'set-directory-tab',
                                        tab,
                                    })
                                }
                                onNavigate={onNavigate}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="agent"
                            className="absolute inset-0 flex min-h-0 flex-col"
                            initial={
                                reduceMotion ? false : { opacity: 0, x: entryX }
                            }
                            animate={{ opacity: 1, x: 0 }}
                            exit={
                                reduceMotion
                                    ? { opacity: 0 }
                                    : { opacity: 0, x: exitX }
                            }
                            transition={{
                                duration: reduceMotion ? 0 : 0.2,
                                ease: [0.2, 0.8, 0.2, 1],
                            }}
                        >
                            <AgentPane
                                agent={selectedProfile}
                                chats={chats}
                                scrollRef={agentScrollRef}
                                initialScrollTop={savedScroll.agent}
                                onBack={backToDirectory}
                                onStartChat={() =>
                                    startChat(selectedProfile.bot.id)
                                }
                                onOpenChat={(chat) => {
                                    dispatchAgentsWorkspace({
                                        type: 'open-chat',
                                        agentId: chat.botId,
                                        chatId: chat.id,
                                    });
                                    onNavigate?.();
                                }}
                                onNavigate={onNavigate}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function DirectoryPane({
    chats,
    customBots,
    scrollRef,
    initialScrollTop,
    tab,
    selectedAgentId,
    onSelectAgent,
    onSelectChat,
    onChangeTab,
    onNavigate,
}: {
    chats: AgentChat[];
    customBots: BotDefinition[];
    scrollRef: RefObject<HTMLDivElement | null>;
    initialScrollTop: number;
    tab: 'agents' | 'chats';
    selectedAgentId: string | null;
    onSelectAgent: (agentId: string) => void;
    onSelectChat: (chat: AgentChat) => void;
    onChangeTab: (tab: 'agents' | 'chats') => void;
    onNavigate?: () => void;
}) {
    const [query, setQuery] = useState('');
    const needle = query.trim().toLocaleLowerCase();
    const filteredAgents = useMemo(() => {
        const profiles = [
            ...AGENT_PROFILES,
            ...customBots
                .map((bot) => resolveAgentProfile(bot.id))
                .filter(
                    (profile): profile is AgentProfile => profile !== undefined,
                ),
        ];

        return profiles.filter((profile) =>
            `${profile.bot.name} ${profile.summary}`
                .toLocaleLowerCase()
                .includes(needle),
        );
    }, [customBots, needle]);
    const filteredChats = useMemo(
        () =>
            chats.filter((chat) => {
                const agentName =
                    resolveAgentProfile(chat.botId)?.bot.name ?? '';

                return `${chat.title} ${agentName}`
                    .toLocaleLowerCase()
                    .includes(needle);
            }),
        [chats, needle],
    );
    const yourAgents = filteredAgents.filter(
        (profile) => profile.section === 'your',
    );
    const systemAgents = filteredAgents.filter(
        (profile) => profile.section === 'system',
    );

    useLayoutEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = initialScrollTop;
        }
    }, [initialScrollTop, scrollRef]);

    return (
        <div className="flex h-full min-h-0 flex-col">
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-shell-hairline px-4">
                <div className="flex min-w-0 items-center gap-2 text-[15px] font-semibold text-shell-ink">
                    <StarFour
                        className="size-[18px] shrink-0 text-shell-orange"
                        weight="regular"
                        aria-hidden
                    />
                    <span>Agents</span>
                </div>
                <Link
                    href="/agents/bots/new"
                    className={cn(
                        'grid size-8 shrink-0 place-items-center rounded-md text-shell-muted transition-colors hover:bg-white/[0.08] hover:text-shell-ink motion-reduce:transition-none',
                        focusRing,
                    )}
                    aria-label="Add an agent"
                    title="Add an agent"
                    onClick={onNavigate}
                >
                    <Plus className="size-4" weight="bold" aria-hidden />
                </Link>
            </header>

            <label className="relative mx-3 mt-3 block shrink-0">
                <MagnifyingGlass
                    className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-shell-muted"
                    weight="regular"
                    aria-hidden
                />
                <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={
                        tab === 'agents'
                            ? 'Search agents...'
                            : 'Search chats...'
                    }
                    aria-label={
                        tab === 'agents' ? 'Search agents' : 'Search chats'
                    }
                    className={cn(
                        'h-9 w-full rounded-md border border-shell-hairline bg-white/[0.035] pr-3 pl-9 text-[12px] text-shell-ink placeholder:text-shell-muted/75 focus:border-shell-orange/70 focus-visible:outline-none',
                        'motion-reduce:transition-none',
                    )}
                />
            </label>

            <div
                role="tablist"
                aria-label="Agents and chats"
                className="mx-3 mt-3 grid shrink-0 grid-cols-2 rounded-md bg-white/[0.04] p-0.5"
            >
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'agents'}
                    className={cn(
                        'h-7 rounded text-[12px] transition-colors motion-reduce:transition-none',
                        tab === 'agents'
                            ? 'bg-white/[0.1] font-medium text-shell-ink'
                            : 'text-shell-muted hover:text-shell-ink-2',
                        focusRing,
                    )}
                    onClick={() => onChangeTab('agents')}
                >
                    Agents
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'chats'}
                    className={cn(
                        'h-7 rounded text-[12px] transition-colors motion-reduce:transition-none',
                        tab === 'chats'
                            ? 'bg-white/[0.1] font-medium text-shell-ink'
                            : 'text-shell-muted hover:text-shell-ink-2',
                        focusRing,
                    )}
                    onClick={() => onChangeTab('chats')}
                >
                    Chats
                </button>
            </div>

            <div
                ref={scrollRef}
                id={`agents-${tab}-panel`}
                role="tabpanel"
                aria-label={tab === 'agents' ? 'Agents directory' : 'Chats'}
                className="evo-scroll min-h-0 flex-1 overflow-y-auto px-2 pt-5 pb-3"
            >
                {tab === 'agents' ? (
                    <>
                        <SidebarSection title="YOUR AGENTS">
                            {yourAgents.length > 0 ? (
                                <ul className="space-y-1">
                                    {yourAgents.map((profile) => (
                                        <li key={profile.bot.id}>
                                            <AgentRow
                                                agent={profile}
                                                selected={
                                                    selectedAgentId ===
                                                    profile.bot.id
                                                }
                                                onClick={() =>
                                                    onSelectAgent(
                                                        profile.bot.id,
                                                    )
                                                }
                                            />
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="px-2 py-2 text-[12px] text-shell-muted">
                                    No agents match this search.
                                </p>
                            )}
                        </SidebarSection>

                        {systemAgents.length > 0 ? (
                            <SidebarSection title="SYSTEM" className="mt-6">
                                <ul className="space-y-1">
                                    {systemAgents.map((profile) => (
                                        <li key={profile.bot.id}>
                                            <AgentRow
                                                agent={profile}
                                                selected={
                                                    selectedAgentId ===
                                                    profile.bot.id
                                                }
                                                onClick={() =>
                                                    onSelectAgent(
                                                        profile.bot.id,
                                                    )
                                                }
                                            />
                                        </li>
                                    ))}
                                </ul>
                            </SidebarSection>
                        ) : null}
                    </>
                ) : (
                    <ChatDirectory
                        chats={filteredChats}
                        onSelect={onSelectChat}
                    />
                )}
            </div>
        </div>
    );
}

function AgentPane({
    agent,
    chats,
    scrollRef,
    initialScrollTop,
    onBack,
    onStartChat,
    onOpenChat,
    onNavigate,
}: {
    agent: AgentProfile;
    chats: AgentChat[];
    scrollRef: RefObject<HTMLDivElement | null>;
    initialScrollTop: number;
    onBack: () => void;
    onStartChat: () => void;
    onOpenChat: (chat: AgentChat) => void;
    onNavigate?: () => void;
}) {
    const agentChats = chats.filter((chat) => chat.botId === agent.bot.id);
    const today = agentChats.filter(
        (chat) => chat.relativeTime === 'Aujourd’hui',
    );
    const previous = agentChats.filter(
        (chat) => chat.relativeTime !== 'Aujourd’hui',
    );

    useLayoutEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = initialScrollTop;
        }
    }, [agent.bot.id, initialScrollTop, scrollRef]);

    return (
        <div className="flex h-full min-h-0 flex-col">
            <header className="flex h-14 shrink-0 items-center border-b border-shell-hairline px-3">
                <button
                    type="button"
                    className={cn(
                        'inline-flex h-9 items-center gap-2 rounded-md px-2 text-[13px] font-medium text-shell-ink-2 transition-colors hover:bg-white/[0.08] hover:text-shell-ink motion-reduce:transition-none',
                        focusRing,
                    )}
                    aria-label="Retour aux agents"
                    onClick={onBack}
                >
                    <ArrowLeft
                        className="size-4"
                        weight="regular"
                        aria-hidden
                    />
                    <span>Agents</span>
                </button>
            </header>

            <div className="shrink-0 px-4 pt-4 pb-3">
                <div className="flex items-start gap-3">
                    <BloubAvatar
                        bot={agent.bot}
                        label={`${agent.bot.name} avatar`}
                        size={32}
                        state="idle"
                    />
                    <div className="min-w-0 pt-0.5">
                        <h2 className="truncate text-[15px] font-semibold text-shell-ink">
                            {agent.bot.name}
                        </h2>
                        <p className="mt-0.5 text-[12px] leading-4 text-shell-muted">
                            {agent.summary}
                        </p>
                        <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-shell-muted">
                            <span
                                aria-hidden="true"
                                className="size-1.5 rounded-full bg-[#76B49A]"
                            />
                            {agent.availability}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    className={cn(
                        'mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-shell-orange px-3 text-[12px] font-semibold text-white transition-colors hover:bg-[#D8511E] motion-reduce:transition-none',
                        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                    )}
                    onClick={onStartChat}
                >
                    <Plus className="size-4" weight="bold" aria-hidden />
                    New chat
                </button>
            </div>

            <div
                ref={scrollRef}
                className="evo-scroll min-h-0 flex-1 overflow-y-auto px-2 pt-3 pb-4"
            >
                <SidebarSection title="CHATS">
                    {agentChats.length === 0 ? (
                        <p className="px-2 py-2 text-[12px] text-shell-muted">
                            No chats yet.
                        </p>
                    ) : (
                        <>
                            {today.length > 0 ? (
                                <ChatGroup
                                    title="Today"
                                    chats={today}
                                    onSelect={onOpenChat}
                                />
                            ) : null}
                            {previous.length > 0 ? (
                                <ChatGroup
                                    title="Previous"
                                    chats={previous}
                                    onSelect={onOpenChat}
                                    className="mt-5"
                                />
                            ) : null}
                        </>
                    )}
                </SidebarSection>

                <SidebarSection title="CONTEXT" className="mt-6">
                    <ul className="space-y-0.5">
                        {agent.contexts.map((target) => (
                            <li key={target.href}>
                                <Link
                                    href={target.href}
                                    className={cn(
                                        'flex min-h-8 items-center gap-2 rounded-md px-2 text-[12px] text-shell-ink-2 transition-colors hover:bg-white/[0.08] hover:text-shell-ink motion-reduce:transition-none',
                                        focusRing,
                                    )}
                                    onClick={onNavigate}
                                >
                                    <span className="size-1.5 rounded-full bg-shell-teal/90" />
                                    <span className="min-w-0 flex-1 truncate">
                                        {target.label}
                                    </span>
                                    <ArrowRight
                                        className="size-3.5 text-shell-muted/70"
                                        weight="regular"
                                        aria-hidden
                                    />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </SidebarSection>
            </div>

            <footer className="shrink-0 border-t border-shell-hairline px-3 py-2.5">
                <Link
                    href={`/agents/bots/${agent.bot.id}`}
                    className={cn(quietButton, focusRing)}
                    onClick={onNavigate}
                >
                    <GearSix className="size-4" weight="regular" aria-hidden />
                    Agent settings
                </Link>
            </footer>
        </div>
    );
}

function SidebarSection({
    title,
    className,
    children,
}: {
    title: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <section
            aria-labelledby={`agents-section-${title.toLowerCase().replaceAll(' ', '-')}`}
            className={className}
        >
            <h3
                id={`agents-section-${title.toLowerCase().replaceAll(' ', '-')}`}
                className="px-2 pb-1.5 text-[11px] font-semibold tracking-[0.09em] text-shell-muted uppercase"
            >
                {title}
            </h3>
            {children}
        </section>
    );
}

function AgentRow({
    agent,
    selected,
    onClick,
}: {
    agent: AgentProfile;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            className={cn(
                'group flex min-h-[58px] w-full items-center gap-2.5 rounded-lg px-2 text-left transition-colors hover:bg-white/[0.08] motion-reduce:transition-none',
                selected && 'bg-white/[0.075]',
                focusRing,
            )}
            aria-current={selected ? 'page' : undefined}
            onClick={onClick}
        >
            <BloubAvatar
                bot={agent.bot}
                label={`${agent.bot.name} avatar`}
                size={28}
                state="idle"
            />
            <span className="min-w-0 flex-1 py-1">
                <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] font-medium text-shell-ink">
                        {agent.bot.name}
                    </span>
                    <span className="shrink-0 text-[10px] text-shell-muted">
                        <span
                            aria-hidden="true"
                            className="mr-1 inline-block size-1.5 rounded-full bg-[#76B49A] align-middle"
                        />
                        {agent.availability}
                    </span>
                </span>
                <span className="mt-0.5 block truncate text-[11px] leading-4 text-shell-muted">
                    {agent.summary}
                </span>
            </span>
            <CaretRight
                className="size-3.5 shrink-0 text-shell-muted/65 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                weight="bold"
                aria-hidden
            />
        </button>
    );
}

function ChatDirectory({
    chats,
    onSelect,
}: {
    chats: AgentChat[];
    onSelect: (chat: AgentChat) => void;
}) {
    const today = chats.filter((chat) => chat.relativeTime === 'Aujourd’hui');
    const previous = chats.filter(
        (chat) => chat.relativeTime !== 'Aujourd’hui',
    );

    if (chats.length === 0) {
        return (
            <div className="px-2 py-3">
                <div className="flex items-center gap-2 text-[13px] font-medium text-shell-ink-2">
                    <ChatCircle
                        className="size-4"
                        weight="regular"
                        aria-hidden
                    />
                    No chats yet.
                </div>
                <p className="mt-1.5 text-[12px] leading-5 text-shell-muted">
                    Start a chat from any agent workspace.
                </p>
            </div>
        );
    }

    return (
        <>
            {today.length > 0 ? (
                <ChatGroup title="Today" chats={today} onSelect={onSelect} />
            ) : null}
            {previous.length > 0 ? (
                <ChatGroup
                    title="Previous"
                    chats={previous}
                    onSelect={onSelect}
                    className={today.length > 0 ? 'mt-5' : undefined}
                />
            ) : null}
        </>
    );
}

function ChatGroup({
    title,
    chats,
    onSelect,
    className,
}: {
    title: string;
    chats: AgentChat[];
    onSelect: (chat: AgentChat) => void;
    className?: string;
}) {
    return (
        <section aria-label={title} className={className}>
            <h4 className="px-2 pb-1 text-[11px] font-medium text-shell-muted">
                {title}
            </h4>
            <ul className="space-y-0.5">
                {chats.map((chat) => {
                    const profile = resolveAgentProfile(chat.botId);

                    return (
                        <li key={chat.id}>
                            <button
                                type="button"
                                className={cn(
                                    'flex min-h-8 w-full items-center gap-2 rounded-md px-2 text-left text-[12px] text-shell-ink-2 transition-colors hover:bg-white/[0.08] hover:text-shell-ink motion-reduce:transition-none',
                                    focusRing,
                                )}
                                onClick={() => onSelect(chat)}
                            >
                                <BloubAvatar
                                    bot={profile?.bot}
                                    botId={chat.botId}
                                    label={`${profile?.bot.name ?? 'Agent'} avatar`}
                                    size={16}
                                    state="idle"
                                />
                                <span className="min-w-0 flex-1 truncate">
                                    {chat.title}
                                </span>
                                <span className="shrink-0 text-[10px] text-shell-muted">
                                    {chat.relativeTime}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
