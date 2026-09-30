import { Link } from '@inertiajs/react';
import { ArrowUpRight, DotsThree, Plus, StarFour } from '@phosphor-icons/react';
import { useState } from 'react';
import {
    AgentChatLayout,
    AgentChatMessage,
} from '@/components/desk/agent-chat-layout';
import { AgentsComposer } from '@/components/desk/agents-composer';
import { BloubAvatar } from '@/components/desk/bloub-avatar';
import type { AgentProfile } from '@/lib/desk/agent-profiles';
import type {
    AgentChat,
    AgentRecordContext,
    BotDefinition,
    ChatMessage,
} from '@/lib/desk/bot-catalog';
import { cn } from '@/lib/utils';

const focusRing =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EC6025]';

type AgentWorkspaceProps = {
    profile: AgentProfile;
    selectedBot: BotDefinition;
    chat?: AgentChat;
    selectedContext: AgentRecordContext | null;
    sending: boolean;
    onNewChat: () => void;
    onSelectBot: (bot: BotDefinition) => void;
    onSelectContext: (context: AgentRecordContext | null) => void;
    onCreateBot: () => void;
    onSend: (prompt: string, context: AgentRecordContext | null) => void;
};

export function AgentsWorkspace({
    profile,
    selectedBot,
    chat,
    selectedContext,
    sending,
    onNewChat,
    onSelectBot,
    onSelectContext,
    onCreateBot,
    onSend,
}: AgentWorkspaceProps) {
    const [moreOpen, setMoreOpen] = useState(false);
    const messages = chat?.messages ?? [];
    const hasMessages = messages.length > 0;
    const quickPrompts = profile.prompts.slice(0, 4);
    const primaryContext = profile.contexts[0];

    return (
        <main
            aria-label={`${profile.bot.name} workspace`}
            className="evo-agents flex min-h-0 min-w-0 flex-1 flex-col"
            data-agent-id={profile.bot.id}
            data-agents-page
            data-agent-workspace
        >
            <header
                className="flex min-h-[64px] shrink-0 items-center justify-between gap-4 border-b border-black/[0.08] bg-white px-5 py-3 sm:px-7"
                data-agent-chat-header
            >
                <div className="flex min-w-0 items-center gap-3">
                    <BloubAvatar
                        bot={profile.bot}
                        label={`${profile.bot.name} avatar`}
                        size={28}
                        state="idle"
                    />
                    <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                            <h1 className="truncate text-[17px] font-semibold tracking-[-0.025em] text-[#0D1B24]">
                                {profile.bot.name}
                            </h1>
                            {chat ? (
                                <>
                                    <span
                                        aria-hidden="true"
                                        className="text-[13px] text-[#8A969A]"
                                    >
                                        /
                                    </span>
                                    <span className="truncate text-[13px] font-medium text-[#42545B]">
                                        {chat.title}
                                    </span>
                                </>
                            ) : null}
                        </div>
                        <p className="mt-0.5 truncate text-[12px] text-[#69777C]">
                            {chat ? profile.summary : profile.availability}
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    {!chat ? (
                        <button
                            type="button"
                            className={cn(
                                'inline-flex h-8 items-center gap-1.5 rounded-md bg-[#EC6025] px-3 text-[12px] font-semibold text-white transition-colors hover:bg-[#D8511E] motion-reduce:transition-none',
                                focusRing,
                            )}
                            onClick={onNewChat}
                        >
                            <Plus
                                className="size-3.5"
                                weight="bold"
                                aria-hidden
                            />
                            New chat
                        </button>
                    ) : (
                        <>
                            {chat.recordContext ? (
                                <Link
                                    href={chat.recordContext.href}
                                    className={cn(
                                        'inline-flex h-8 max-w-[190px] items-center gap-1.5 truncate rounded-md border border-black/[0.09] px-2.5 text-[11px] font-medium text-[#42545B] transition-colors hover:bg-[#F7F8F5] motion-reduce:transition-none',
                                        focusRing,
                                    )}
                                    title={chat.recordContext.label}
                                >
                                    <span className="truncate">
                                        {chat.recordContext.label}
                                    </span>
                                    <ArrowUpRight
                                        className="size-3.5 shrink-0"
                                        weight="regular"
                                        aria-hidden
                                    />
                                </Link>
                            ) : primaryContext ? (
                                <Link
                                    href={primaryContext.href}
                                    className={cn(
                                        'hidden h-8 items-center rounded-md border border-black/[0.09] px-2.5 text-[11px] font-medium text-[#42545B] transition-colors hover:bg-[#F7F8F5] motion-reduce:transition-none sm:inline-flex',
                                        focusRing,
                                    )}
                                >
                                    Context · {primaryContext.label}
                                </Link>
                            ) : null}
                            <div className="relative">
                                <button
                                    type="button"
                                    className={cn(
                                        'grid size-8 place-items-center rounded-md text-[#59686F] transition-colors hover:bg-[#F2F4F0] hover:text-[#0D1B24] motion-reduce:transition-none',
                                        focusRing,
                                    )}
                                    aria-label="More conversation actions"
                                    aria-haspopup="menu"
                                    aria-expanded={moreOpen}
                                    onClick={() =>
                                        setMoreOpen((current) => !current)
                                    }
                                    onKeyDown={(event) => {
                                        if (event.key === 'Escape') {
                                            setMoreOpen(false);
                                        }
                                    }}
                                >
                                    <DotsThree
                                        className="size-5"
                                        weight="bold"
                                        aria-hidden
                                    />
                                </button>
                                {moreOpen ? (
                                    <div
                                        role="menu"
                                        aria-label="Conversation actions"
                                        className="absolute top-[calc(100%+6px)] right-0 z-30 min-w-40 rounded-lg border border-[#E6E8E3] bg-white p-1 shadow-[0_10px_24px_rgba(13,27,36,0.1)]"
                                    >
                                        <button
                                            type="button"
                                            role="menuitem"
                                            className={cn(
                                                'flex h-8 w-full items-center rounded-md px-2 text-left text-[12px] text-[#0D1B24] hover:bg-[#F3F5F1]',
                                                focusRing,
                                            )}
                                            onClick={() => {
                                                setMoreOpen(false);
                                                onNewChat();
                                            }}
                                        >
                                            Start a new chat
                                        </button>
                                        <Link
                                            href={`/agents/bots/${profile.bot.id}`}
                                            role="menuitem"
                                            className={cn(
                                                'flex h-8 items-center rounded-md px-2 text-[12px] text-[#0D1B24] hover:bg-[#F3F5F1]',
                                                focusRing,
                                            )}
                                            onClick={() => setMoreOpen(false)}
                                        >
                                            Agent settings
                                        </Link>
                                    </div>
                                ) : null}
                            </div>
                        </>
                    )}
                </div>
            </header>

            <AgentChatLayout
                emptyState={<AgentEmptyState profile={profile} />}
                composer={
                    <div className="w-full">
                        <AgentsComposer
                            selectedBot={selectedBot}
                            profile={profile}
                            selectedContext={selectedContext}
                            sending={sending}
                            onSelectBot={onSelectBot}
                            onSelectContext={onSelectContext}
                            onCreateBot={onCreateBot}
                            onSend={onSend}
                        />
                        {!hasMessages ? (
                            <div
                                role="group"
                                aria-label="Suggested agent actions"
                                className="mt-2.5 flex flex-wrap justify-center gap-1.5"
                            >
                                {quickPrompts.map((prompt) => (
                                    <button
                                        key={prompt.label}
                                        type="button"
                                        disabled={sending}
                                        className={cn(
                                            'min-h-7 rounded-md px-2.5 text-[11px] text-[#52636A] transition-colors hover:bg-white hover:text-[#0F4C5C] disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none',
                                            focusRing,
                                        )}
                                        onClick={() =>
                                            onSend(
                                                prompt.prompt,
                                                selectedContext,
                                            )
                                        }
                                    >
                                        {prompt.label}
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </div>
                }
                scrollKey={`${chat?.id ?? 'empty'}:${messages.length}`}
            >
                {hasMessages ? (
                    <Conversation
                        agentName={profile.bot.name}
                        messages={messages}
                        sending={sending}
                    />
                ) : null}
            </AgentChatLayout>
        </main>
    );
}

export function AgentsDirectoryHome({
    onSelectAgent,
}: {
    onSelectAgent: (agentId: string) => void;
}) {
    return (
        <main
            aria-label="Agents directory workspace"
            className="evo-agents flex min-h-0 min-w-0 flex-1 flex-col"
            data-agents-page
            data-agents-home
        >
            <header className="flex min-h-[64px] shrink-0 items-center justify-between border-b border-black/[0.08] bg-white px-5 sm:px-7">
                <div>
                    <p className="text-[10px] font-semibold tracking-[0.12em] text-[#0F4C5C] uppercase">
                        CRM operations
                    </p>
                    <h1 className="mt-0.5 text-[17px] font-semibold tracking-[-0.025em] text-[#0D1B24]">
                        Agents
                    </h1>
                </div>
            </header>
            <div className="evo-scroll min-h-0 flex-1 overflow-y-auto">
                <section className="mx-auto flex min-h-full w-full max-w-[760px] flex-col justify-center px-6 py-12 sm:px-10">
                    <div className="grid size-11 place-items-center rounded-xl border border-[#0F4C5C]/15 bg-[#0F4C5C]/[0.06] text-[#0F4C5C]">
                        <StarFour
                            className="size-5"
                            weight="regular"
                            aria-hidden
                        />
                    </div>
                    <h2 className="mt-5 max-w-[560px] text-[26px] leading-tight font-semibold tracking-[-0.04em] text-[#0D1B24] sm:text-[30px]">
                        Choisissez un agent pour démarrer.
                    </h2>
                    <p className="mt-3 max-w-[500px] text-[13px] leading-6 text-[#5D6B71]">
                        Chaque agent travaille avec le contexte CRM adapté à sa
                        mission. Les conversations et les fiches restent dans
                        EvoCRM.
                    </p>
                    <div className="mt-8 grid max-w-[620px] gap-2 sm:grid-cols-2">
                        {[
                            {
                                id: 'closer',
                                label: 'Closer',
                                detail: 'Deals and next steps',
                            },
                            {
                                id: 'qualifier',
                                label: 'Qualifier',
                                detail: 'Leads and enrichment',
                            },
                            {
                                id: 'quote-desk',
                                label: 'Quote desk',
                                detail: 'Quotes and pricing',
                            },
                            {
                                id: 'after-sale',
                                label: 'After-sale',
                                detail: 'Customer follow-up',
                            },
                        ].map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                className={cn(
                                    'flex min-h-[58px] items-center justify-between gap-3 rounded-lg border border-[#E6E8E3] bg-white px-3.5 text-left transition-colors hover:border-[#0F4C5C]/25 hover:bg-[#FBFCF9] motion-reduce:transition-none',
                                    focusRing,
                                )}
                                onClick={() => onSelectAgent(item.id)}
                            >
                                <span>
                                    <span className="block text-[13px] font-medium text-[#0D1B24]">
                                        {item.label}
                                    </span>
                                    <span className="mt-0.5 block text-[11px] text-[#69777C]">
                                        {item.detail}
                                    </span>
                                </span>
                                <ArrowUpRight
                                    className="size-4 shrink-0 text-[#7B898E]"
                                    weight="regular"
                                    aria-hidden
                                />
                            </button>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}

function AgentEmptyState({ profile }: { profile: AgentProfile }) {
    return (
        <div className="mx-auto flex max-w-[480px] flex-col items-center px-3 text-center">
            <BloubAvatar
                bot={profile.bot}
                label={`${profile.bot.name} avatar`}
                size={42}
                state="idle"
            />
            <h2 className="mt-3 text-[18px] font-semibold tracking-[-0.02em] text-[#0D1B24]">
                {profile.bot.name}
            </h2>
            <p className="mt-1.5 max-w-[420px] text-[13px] leading-6 text-[#596A71]">
                {profile.emptyMessage}
            </p>
        </div>
    );
}

function Conversation({
    agentName,
    messages,
    sending,
}: {
    agentName: string;
    messages: ChatMessage[];
    sending: boolean;
}) {
    return (
        <div
            className="flex flex-col gap-5 pb-3"
            role="log"
            aria-live="polite"
            aria-label={`${agentName} conversation`}
        >
            {messages.map((message) => (
                <AgentChatMessage
                    key={message.id}
                    align={message.role === 'user' ? 'end' : 'start'}
                >
                    {message.role === 'user' ? (
                        <div className="max-w-[min(100%,610px)]">
                            <div className="rounded-xl bg-[#0D1B24] px-4 py-3 text-[13px] leading-6 whitespace-pre-wrap text-white">
                                {message.body}
                            </div>
                            {message.recordContext ? (
                                <RecordContextCard
                                    context={message.recordContext}
                                />
                            ) : null}
                        </div>
                    ) : (
                        <AssistantResponse message={message} />
                    )}
                </AgentChatMessage>
            ))}
            {sending ? (
                <AgentChatMessage align="start">
                    <div
                        className="flex items-center gap-2 text-[12px] text-[#5C6B71]"
                        role="status"
                    >
                        <span className="size-1.5 animate-pulse rounded-full bg-[#0F4C5C] motion-reduce:animate-none" />
                        {agentName} consulte le contexte CRM…
                    </div>
                </AgentChatMessage>
            ) : null}
        </div>
    );
}

function RecordContextCard({ context }: { context: AgentRecordContext }) {
    return (
        <div className="mt-2 flex max-w-[330px] items-center gap-2 rounded-lg border border-[#E2E8E4] bg-white px-3 py-2 text-left">
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[#0F4C5C]/[0.07] text-[10px] font-semibold tracking-[0.04em] text-[#0F4C5C] uppercase">
                {context.type.slice(0, 2)}
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-[9px] font-semibold tracking-[0.1em] text-[#69777C] uppercase">
                    {recordTypeLabel(context.type)}
                </p>
                <p className="truncate text-[11px] font-medium text-[#0D1B24]">
                    {context.label}
                </p>
            </div>
            <Link
                href={context.href}
                className={cn(
                    'rounded px-1.5 py-1 text-[10px] font-medium text-[#0F4C5C] hover:bg-[#0F4C5C]/[0.06]',
                    focusRing,
                )}
            >
                Ouvrir
            </Link>
        </div>
    );
}

function AssistantResponse({ message }: { message: ChatMessage }) {
    return (
        <div className="max-w-[min(100%,650px)] text-[13px] leading-6 text-[#0D1B24]">
            <div className="whitespace-pre-wrap">{message.body}</div>
            {message.crmActions && message.crmActions.length > 0 ? (
                <section
                    className="mt-3 rounded-xl border border-[#E1E7E3] bg-white p-3"
                    aria-label="CRM actions"
                >
                    <p className="text-[10px] font-semibold tracking-[0.1em] text-[#52636A] uppercase">
                        CRM
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                        {message.crmActions.map((action) => (
                            <li key={action.id}>
                                {isInternalHref(action.href) ? (
                                    <Link
                                        href={action.href}
                                        className={cn(
                                            'inline-flex min-h-8 items-center rounded-md border border-[#DDE5E1] bg-white px-2.5 text-[11px] font-medium text-[#0F4C5C] transition-colors hover:bg-[#F7FAF8] motion-reduce:transition-none',
                                            focusRing,
                                        )}
                                    >
                                        {actionLabel(action.id, action.label)}
                                    </Link>
                                ) : null}
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}
        </div>
    );
}

function isInternalHref(href: string): boolean {
    return href.startsWith('/') && !href.startsWith('//');
}

function recordTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        company: 'Entreprise',
        contact: 'Contact',
        deal: 'Affaire',
        lead: 'Lead',
        quote: 'Devis',
    };

    return labels[type] ?? 'CRM';
}

function actionLabel(id: string, fallback: string): string {
    const labels: Record<string, string> = {
        'open-company': 'Ouvrir l’entreprise',
        'open-contact': 'Ouvrir le contact',
        'open-deal': 'Ouvrir l’affaire',
        'open-quote': 'Ouvrir le devis',
        'open-home': 'Ouvrir l’accueil',
        'open-overdue': 'Voir les activités en retard',
        'draft-email': 'Préparer un e-mail',
    };

    return labels[id] ?? fallback;
}
