import { CaretDown } from '@phosphor-icons/react';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { BloubAvatar } from '@/components/desk/bloub-avatar';
import type { BloubState } from '@/components/desk/bloub-avatar';
import type { BotDefinition } from '@/lib/desk/bot-catalog';
import { cn } from '@/lib/utils';

/**
 * Tailwind adaptation of Astryx ChatLayout IA.
 * Source: https://astryx.atmeta.com/components/ChatLayout
 *
 * Official `@astryxdesign/core/Chat` ChatLayout is StyleX-backed and needs
 * `@stylexjs/stylex` plus a theme peer. That install is heavy for this Vite
 * + Tailwind 4 app, so regions are composed locally:
 * - navigation (optional): bot + chat list. EvoShell already mounts AgentsSidebar.
 * - header: conversation chrome (avatar, name, status)
 * - thread: scrollable messages (`role="log"`)
 * - composer: sticky dock with a frosted glass fade
 */

const focusRing =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8530E]';

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
    const reduceMotion = useReducedMotion();
    const threadRef = useRef<HTMLDivElement>(null);
    const [showJump, setShowJump] = useState(false);
    const hasMessages = hasVisibleContent(children);

    function updateJumpVisibility() {
        const node = threadRef.current;

        if (!node) {
            return;
        }

        const distance = node.scrollHeight - node.scrollTop - node.clientHeight;
        setShowJump(distance > 72);
    }

    function scrollToBottom() {
        const node = threadRef.current;

        if (!node) {
            return;
        }

        node.scrollTo({
            top: node.scrollHeight,
            behavior: reduceMotion ? 'auto' : 'smooth',
        });
        updateJumpVisibility();
    }

    useEffect(() => {
        const node = threadRef.current;

        if (!node) {
            return;
        }

        node.scrollTo({
            top: node.scrollHeight,
            behavior: reduceMotion ? 'auto' : 'smooth',
        });
        updateJumpVisibility();
    }, [scrollKey, reduceMotion]);

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
                        className="shrink-0 border-b border-black/8 bg-white"
                        data-agent-chat-header
                    >
                        {header}
                    </div>
                ) : null}

                <div
                    ref={threadRef}
                    className="evo-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
                    data-agent-chat-thread
                    onScroll={updateJumpVisibility}
                >
                    <div className="mx-auto flex min-h-full w-full max-w-[760px] flex-col px-5 py-5 sm:px-7">
                        {hasMessages ? (
                            <div className="flex min-h-0 flex-1 flex-col">
                                <div
                                    aria-hidden="true"
                                    className="min-h-0 flex-1"
                                />
                                {children}
                            </div>
                        ) : (
                            <div
                                className="grid flex-1 content-center py-6"
                                data-agent-chat-empty
                            >
                                {emptyState}
                            </div>
                        )}
                    </div>
                </div>

                <div
                    className="relative isolate shrink-0"
                    data-agent-chat-composer
                >
                    {showJump ? (
                        <div className="pointer-events-none absolute inset-x-0 -top-12 z-10 flex justify-center">
                            <button
                                type="button"
                                className={cn(
                                    'pointer-events-auto inline-flex size-8 items-center justify-center rounded-full border border-black/10 bg-white text-[#0D1B24] shadow-[0_6px_16px_rgba(13,27,36,0.08)] hover:bg-[#F7F8F5]',
                                    focusRing,
                                )}
                                aria-label="Jump to latest message"
                                onClick={scrollToBottom}
                            >
                                <CaretDown className="size-4" weight="bold" />
                            </button>
                        </div>
                    ) : null}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-[#F7F8F5]/80 [mask-image:linear-gradient(to_bottom,transparent,black_36px)] backdrop-blur-[12px] motion-reduce:backdrop-blur-none"
                    />
                    <div className="relative mx-auto w-full max-w-[760px] px-5 pt-2 pb-4 sm:px-7">
                        {composer}
                    </div>
                </div>
            </section>
        </div>
    );
}

export function AgentChatHeader({
    bot,
    status = 'Ready',
    avatarState = 'idle',
}: {
    bot: BotDefinition;
    status?: string;
    avatarState?: BloubState;
}) {
    return (
        <div className="flex items-center gap-3 px-5 py-3 sm:px-7">
            <BloubAvatar
                label={`${bot.name} avatar`}
                size={28}
                state={avatarState}
            />
            <div className="min-w-0">
                <h2 className="truncate text-[15px] font-semibold tracking-[-0.02em] text-[#0D1B24]">
                    {bot.name}
                </h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[#0D1B24]/55">
                    <span
                        aria-hidden="true"
                        className="size-1.5 rounded-full bg-[#0F4C5C]"
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
    const reduceMotion = useReducedMotion();

    return (
        <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.22,
                ease: [0.16, 1, 0.3, 1],
            }}
            className={cn(
                'flex',
                align === 'end' ? 'justify-end' : 'justify-start',
            )}
        >
            {children}
        </motion.div>
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
