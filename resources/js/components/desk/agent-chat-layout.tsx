import type { ReactNode } from 'react';
import { BloubAvatar } from '@/components/desk/bloub-avatar';
import type { BloubState } from '@/components/desk/bloub-avatar';
import {
    ChatContainerContent,
    ChatContainerRoot,
    ChatContainerScrollAnchor,
    useStickToBottomContext,
} from '@/evo/ai/chat-container';
import { evoFocus } from '@/evo/ai/types';
import { CaretDown } from '@/evo/icons';
import { cn } from '@/evo/lib/cn';
import type { BotDefinition } from '@/lib/desk/bot-catalog';

/**
 * Agent conversation chassis.
 * Thread scroll is Prompt Kit ChatContainer (use-stick-to-bottom).
 * EvoShell still mounts AgentsSidebar in the shared mode sidebar.
 */

type AgentChatLayoutProps = {
    navigation?: ReactNode;
    header?: ReactNode;
    children?: ReactNode;
    composer: ReactNode;
    emptyState?: ReactNode;
    scrollKey?: string | number;
    className?: string;
};

export function AgentChatLayout({
    navigation,
    header,
    children,
    composer,
    emptyState,
    scrollKey,
    className,
}: AgentChatLayoutProps) {
    const hasMessages = hasVisibleContent(children);

    return (
        <div
            className={cn('flex min-h-0 min-w-0 flex-1', className)}
            data-agent-chat-layout
        >
            {navigation ? (
                <div
                    className="hidden h-full shrink-0 md:flex"
                    data-agent-chat-navigation
                >
                    {navigation}
                </div>
            ) : null}

            <section
                className="flex min-h-0 min-w-0 flex-1 flex-col"
                data-agents-chat-view
            >
                {header ? (
                    <div
                        className="shrink-0 border-b border-evo-hairline bg-evo-surface"
                        data-agent-chat-header
                    >
                        {header}
                    </div>
                ) : null}

                <ChatContainerRoot
                    className="evo-scroll min-h-0 flex-1 overflow-x-hidden"
                    data-agent-chat-thread
                    aria-label="Conversation"
                >
                    <ChatContainerContent className="mx-auto flex min-h-full w-full max-w-[760px] flex-col px-5 py-5 sm:px-7">
                        {hasMessages ? (
                            <div className="flex min-h-0 flex-1 flex-col">
                                <div aria-hidden="true" className="min-h-0 flex-1" />
                                {children}
                                <ChatContainerScrollAnchor key={scrollKey} />
                            </div>
                        ) : (
                            <div
                                className="grid flex-1 content-center py-6"
                                data-agent-chat-empty
                            >
                                {emptyState}
                            </div>
                        )}
                    </ChatContainerContent>
                    <JumpToLatest />
                </ChatContainerRoot>

                <div
                    className="relative isolate shrink-0"
                    data-agent-chat-composer
                >
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-evo-canvas/80 [mask-image:linear-gradient(to_bottom,transparent,black_36px)] backdrop-blur-[12px] motion-reduce:backdrop-blur-none"
                    />
                    <div className="relative mx-auto w-full max-w-[760px] px-5 pt-2 pb-4 sm:px-7">
                        {composer}
                    </div>
                </div>
            </section>
        </div>
    );
}

function JumpToLatest() {
    const { isAtBottom, scrollToBottom } = useStickToBottomContext();

    if (isAtBottom) {
        return null;
    }

    return (
        <div className="pointer-events-none sticky bottom-3 z-10 flex justify-center">
            <button
                type="button"
                className={cn(
                    'pointer-events-auto inline-flex size-8 items-center justify-center rounded-full border border-evo-hairline bg-evo-surface text-evo-ink shadow-evo-floating hover:bg-evo-surface-subtle',
                    evoFocus,
                )}
                aria-label="Aller au dernier message"
                onClick={() => {
                    void scrollToBottom();
                }}
            >
                <CaretDown className="size-4" weight="bold" />
            </button>
        </div>
    );
}

export function AgentChatHeader({
    bot,
    status = 'Disponible',
    avatarState = 'idle',
}: {
    bot: BotDefinition;
    status?: string;
    avatarState?: BloubState;
}) {
    return (
        <div className="flex items-center gap-3 px-5 py-3 sm:px-7">
            <BloubAvatar
                bot={bot}
                label={`${bot.name} avatar`}
                size={28}
                state={avatarState}
            />
            <div className="min-w-0">
                <h2 className="truncate text-[15px] font-semibold tracking-[-0.02em] text-evo-ink">
                    {bot.name}
                </h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-evo-ink-muted">
                    <span
                        aria-hidden="true"
                        className="size-1.5 rounded-full bg-evo-teal"
                    />
                    <span>{status}</span>
                </p>
            </div>
        </div>
    );
}

export function AgentChatMessage({
    align,
    children,
}: {
    align: 'start' | 'end';
    children: ReactNode;
}) {
    return (
        <div
            className={cn(
                'flex',
                align === 'end' ? 'justify-end' : 'justify-start',
            )}
        >
            {children}
        </div>
    );
}

function hasVisibleContent(children: ReactNode): boolean {
    if (children == null || children === false) {
        return false;
    }

    if (Array.isArray(children) && children.length === 0) {
        return false;
    }

    return true;
}
