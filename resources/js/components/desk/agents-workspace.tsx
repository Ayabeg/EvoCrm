import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { AgentChatLayout } from '@/components/desk/agent-chat-layout';
import { AgentsComposer } from '@/components/desk/agents-composer';
import { BloubAvatar } from '@/components/desk/bloub-avatar';
import {
    AgentMessage,
    ApprovalCard,
    CrmResult,
    PromptSuggestion,
    ReasoningDisclosure,
    ThinkingState,
    ToolCall,
    ToolResult,
    UserMessage,
} from '@/evo/ai';
import { evoFocus } from '@/evo/ai/types';
import { ArrowUpRight, DotsThree, Plus, StarFour } from '@/evo/icons';
import { cn } from '@/evo/lib/cn';
import type { AgentProfile } from '@/lib/desk/agent-profiles';
import { setChatMessageApproval } from '@/lib/desk/bot-catalog';
import type {
    AgentChat,
    AgentRecordContext,
    BotDefinition,
    ChatMessage,
} from '@/lib/desk/bot-catalog';

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
            className="evo-agents light flex min-h-0 min-w-0 flex-1 flex-col"
            data-agent-id={profile.bot.id}
            data-agents-page
            data-agent-workspace
            data-theme="light"
        >
            <header
                className="flex min-h-[64px] shrink-0 items-center justify-between gap-4 border-b border-evo-hairline bg-evo-surface px-5 py-3 sm:px-7"
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
                            <h1 className="truncate text-[17px] font-semibold tracking-[-0.025em] text-evo-ink">
                                {profile.bot.name}
                            </h1>
                            {chat ? (
                                <>
                                    <span
                                        aria-hidden="true"
                                        className="text-[13px] text-evo-ink-muted"
                                    >
                                        /
                                    </span>
                                    <span className="truncate text-[13px] font-medium text-evo-ink-secondary">
                                        {chat.title}
                                    </span>
                                </>
                            ) : null}
                        </div>
                        <p className="mt-0.5 truncate text-[12px] text-evo-ink-muted">
                            {chat ? profile.summary : profile.availability}
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    {!chat ? (
                        <button
                            type="button"
                            className={cn(
                                'evo-agents-primary-btn inline-flex h-8 items-center gap-1.5 rounded-[var(--evo-radius-compact)] text-[12px] font-semibold transition-colors duration-[var(--evo-duration-micro)] ease-evo motion-reduce:transition-none',
                                evoFocus,
                            )}
                            onClick={onNewChat}
                        >
                            <Plus
                                className="size-3.5"
                                weight="bold"
                                aria-hidden
                            />
                            Nouvelle conversation
                        </button>
                    ) : (
                        <>
                            {chat.recordContext ? (
                                <Link
                                    href={chat.recordContext.href}
                                    className={cn(
                                        'inline-flex h-8 max-w-[190px] items-center gap-1.5 truncate rounded-[var(--evo-radius-compact)] border border-evo-hairline px-2.5 text-[11px] font-medium text-evo-ink-secondary transition-colors hover:bg-evo-surface-subtle motion-reduce:transition-none',
                                        evoFocus,
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
                                        'hidden h-8 items-center rounded-[var(--evo-radius-compact)] border border-evo-hairline px-2.5 text-[11px] font-medium text-evo-ink-secondary transition-colors hover:bg-evo-surface-subtle motion-reduce:transition-none sm:inline-flex',
                                        evoFocus,
                                    )}
                                >
                                    Contexte · {primaryContext.label}
                                </Link>
                            ) : null}
                            <div className="relative">
                                <button
                                    type="button"
                                    className={cn(
                                        'grid size-8 place-items-center rounded-[var(--evo-radius-compact)] text-evo-ink-muted transition-colors hover:bg-evo-surface-subtle hover:text-evo-ink motion-reduce:transition-none',
                                        evoFocus,
                                    )}
                                    aria-label="Autres actions de conversation"
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
                                        aria-label="Actions de conversation"
                                        className="absolute top-[calc(100%+6px)] right-0 z-30 min-w-40 rounded-[var(--evo-radius-standard)] border border-evo-hairline bg-evo-surface p-1 shadow-evo-floating"
                                    >
                                        <button
                                            type="button"
                                            role="menuitem"
                                            className={cn(
                                                'flex h-8 w-full items-center rounded-[var(--evo-radius-compact)] px-2 text-left text-[12px] text-evo-ink hover:bg-evo-surface-subtle',
                                                evoFocus,
                                            )}
                                            onClick={() => {
                                                setMoreOpen(false);
                                                onNewChat();
                                            }}
                                        >
                                            Nouvelle conversation
                                        </button>
                                        <Link
                                            href={`/agents/bots/${profile.bot.id}`}
                                            role="menuitem"
                                            className={cn(
                                                'flex h-8 items-center rounded-[var(--evo-radius-compact)] px-2 text-[12px] text-evo-ink hover:bg-evo-surface-subtle',
                                                evoFocus,
                                            )}
                                            onClick={() => setMoreOpen(false)}
                                        >
                                            Paramètres de l’agent
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
                                aria-label="Suggestions"
                                className="mt-2.5 flex flex-wrap justify-center gap-1.5"
                            >
                                {quickPrompts.map((prompt) => (
                                    <PromptSuggestion
                                        key={prompt.label}
                                        disabled={sending}
                                        onClick={() =>
                                            onSend(
                                                prompt.prompt,
                                                selectedContext,
                                            )
                                        }
                                    >
                                        {prompt.label}
                                    </PromptSuggestion>
                                ))}
                            </div>
                        ) : null}
                    </div>
                }
                scrollKey={`${chat?.id ?? 'empty'}:${messages.length}`}
            >
                {hasMessages && chat ? (
                    <Conversation
                        agentName={profile.bot.name}
                        chatId={chat.id}
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
            className="evo-agents light flex min-h-0 min-w-0 flex-1 flex-col"
            data-agents-page
            data-agents-home
            data-theme="light"
        >
            <header className="flex min-h-[64px] shrink-0 items-center justify-between border-b border-evo-hairline bg-evo-surface px-5 sm:px-7">
                <div>
                    <p className="text-[10px] font-semibold tracking-[0.12em] text-evo-teal uppercase">
                        Opérations CRM
                    </p>
                    <h1 className="mt-0.5 text-[17px] font-semibold tracking-[-0.025em] text-evo-ink">
                        Agents
                    </h1>
                </div>
            </header>
            <div className="evo-scroll min-h-0 flex-1 overflow-y-auto">
                <section className="mx-auto flex min-h-full w-full max-w-[760px] flex-col justify-center px-6 py-12 sm:px-10">
                    <div className="grid size-11 place-items-center rounded-[var(--evo-radius-standard)] border border-evo-teal/15 bg-evo-teal-soft text-evo-teal">
                        <StarFour
                            className="size-5"
                            weight="regular"
                            aria-hidden
                        />
                    </div>
                    <h2 className="mt-5 max-w-[560px] text-[26px] leading-tight font-semibold tracking-[-0.04em] text-evo-ink sm:text-[30px]">
                        Choisissez un agent pour démarrer.
                    </h2>
                    <p className="mt-3 max-w-[500px] text-[13px] leading-6 text-evo-ink-secondary">
                        Chaque agent travaille avec le contexte CRM adapté à sa
                        mission. Les conversations et les fiches restent dans
                        EvoCRM.
                    </p>
                    <div className="mt-8 grid max-w-[620px] gap-2 sm:grid-cols-2">
                        {[
                            {
                                id: 'closer',
                                label: 'Closer',
                                detail: 'Affaires et prochaines actions',
                            },
                            {
                                id: 'qualifier',
                                label: 'Qualifier',
                                detail: 'Leads et enrichissement',
                            },
                            {
                                id: 'quote-desk',
                                label: 'Quote desk',
                                detail: 'Devis et tarification',
                            },
                            {
                                id: 'after-sale',
                                label: 'After-sale',
                                detail: 'Suivi client',
                            },
                        ].map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                className={cn(
                                    'flex min-h-[58px] items-center justify-between gap-3 rounded-[var(--evo-radius-standard)] border border-evo-hairline bg-evo-surface px-3.5 text-left transition-colors hover:border-evo-teal/25 hover:bg-evo-surface-subtle motion-reduce:transition-none',
                                    evoFocus,
                                )}
                                onClick={() => onSelectAgent(item.id)}
                            >
                                <span>
                                    <span className="block text-[13px] font-medium text-evo-ink">
                                        {item.label}
                                    </span>
                                    <span className="mt-0.5 block text-[11px] text-evo-ink-muted">
                                        {item.detail}
                                    </span>
                                </span>
                                <ArrowUpRight
                                    className="size-4 shrink-0 text-evo-ink-muted"
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
            <h2 className="mt-3 text-[18px] font-semibold tracking-[-0.02em] text-evo-ink">
                {profile.bot.name}
            </h2>
            <p className="mt-1.5 max-w-[420px] text-[13px] leading-6 text-evo-ink-secondary">
                {profile.emptyMessage}
            </p>
        </div>
    );
}

function Conversation({
    agentName,
    chatId,
    messages,
    sending,
}: {
    agentName: string;
    chatId: string;
    messages: ChatMessage[];
    sending: boolean;
}) {
    return (
        <div
            className="flex flex-col gap-5 pb-3"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-label={`${agentName} conversation`}
        >
            {messages.map((message) => (
                <div key={message.id}>
                    {message.role === 'user' ? (
                        <div className="flex w-full flex-col items-end gap-2">
                            <UserMessage>{message.body}</UserMessage>
                            {message.recordContext ? (
                                <CrmResult
                                    type={message.recordContext.type}
                                    label={message.recordContext.label}
                                    href={message.recordContext.href}
                                />
                            ) : null}
                        </div>
                    ) : (
                        <AssistantResponse
                            chatId={chatId}
                            message={message}
                        />
                    )}
                </div>
            ))}
            {sending ? (
                <ThinkingState
                    label={`${agentName} consulte le contexte CRM…`}
                />
            ) : null}
        </div>
    );
}

function AssistantResponse({
    chatId,
    message,
}: {
    chatId: string;
    message: ChatMessage;
}) {
    return (
        <div className="flex w-full flex-col items-start gap-2">
            {message.reasoning ? (
                <ReasoningDisclosure defaultOpen={Boolean(message.streaming)}>
                    {message.reasoning}
                </ReasoningDisclosure>
            ) : null}
            {message.toolCalls?.map((call) => (
                <div key={call.id} className="w-full max-w-[650px] space-y-1.5">
                    <ToolCall call={call} />
                    {call.output && call.status === 'done' ? (
                        <ToolResult title={`Résultat · ${call.name}`}>
                            {call.output}
                        </ToolResult>
                    ) : null}
                </div>
            ))}
            {message.approval ? (
                <div className="w-full max-w-[650px]">
                    <ApprovalCard
                        approval={message.approval}
                        onApprove={(approval) => {
                            setChatMessageApproval(
                                chatId,
                                message.id,
                                'approved',
                            );
                            void approval;
                        }}
                        onDeny={(approval) => {
                            setChatMessageApproval(
                                chatId,
                                message.id,
                                'denied',
                            );
                            void approval;
                        }}
                    />
                </div>
            ) : null}
            {message.error ? (
                <AgentMessage markdown={false}>
                    <p className="rounded-[var(--evo-radius-standard)] border border-evo-danger/20 bg-[var(--evo-danger-soft)] px-3 py-2 text-evo-danger">
                        {message.body}
                    </p>
                </AgentMessage>
            ) : (
                <AgentMessage>{message.body}</AgentMessage>
            )}
            {message.crmActions && message.crmActions.length > 0 ? (
                <section
                    className="w-full max-w-[650px] rounded-[var(--evo-radius-floating)] border border-evo-hairline bg-evo-surface p-3"
                    aria-label="CRM actions"
                >
                    <p className="text-[10px] font-semibold tracking-[0.1em] text-evo-ink-muted uppercase">
                        CRM
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                        {message.crmActions.map((action) => (
                            <li key={action.id}>
                                {isInternalHref(action.href) ? (
                                    <Link
                                        href={action.href}
                                        className={cn(
                                            'inline-flex min-h-8 items-center rounded-[var(--evo-radius-compact)] border border-evo-hairline bg-evo-surface px-2.5 text-[11px] font-medium text-evo-teal transition-colors hover:bg-evo-teal-soft motion-reduce:transition-none',
                                            evoFocus,
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
