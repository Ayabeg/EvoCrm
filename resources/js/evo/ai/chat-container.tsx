/**
 * Evo Design System — AgentConversation / ChatContainer
 * Registry: Prompt Kit — chat-container
 * Source: https://www.prompt-kit.com/docs/chat-container · https://github.com/ibelick/prompt-kit
 * Upstream: https://github.com/ibelick/prompt-kit @ 5a9496635cc0e1bf7679fe2a9e35d9b36b99c08a
 * License: MIT (LICENCE.md, verified 2026-10-02)
 * Copied: 2026-10-02
 * Modified: --evo-* tokens; role=log + aria-live; reduced-motion uses instant scroll.
 */

import type { ComponentProps, ReactNode } from 'react';
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom';
import { cn } from '@/evo/lib/cn';
import { usePrefersReducedMotion } from '@/evo/lib/motion';

export type ChatContainerRootProps = {
    children: ReactNode;
    className?: string;
} & ComponentProps<typeof StickToBottom>;

export type ChatContainerContentProps = {
    children: ReactNode;
    className?: string;
} & ComponentProps<typeof StickToBottom.Content>;

export type ChatContainerScrollAnchorProps = {
    className?: string;
} & ComponentProps<'div'>;

export function ChatContainerRoot({
    children,
    className,
    resize,
    initial,
    ...props
}: ChatContainerRootProps) {
    const reduceMotion = usePrefersReducedMotion();

    return (
        <StickToBottom
            className={cn('flex min-h-0 overflow-y-auto', className)}
            resize={resize ?? (reduceMotion ? 'instant' : 'smooth')}
            initial={initial ?? 'instant'}
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            {...props}
        >
            {children}
        </StickToBottom>
    );
}

export function ChatContainerContent({
    children,
    className,
    ...props
}: ChatContainerContentProps) {
    return (
        <StickToBottom.Content className={cn('flex w-full flex-col', className)} {...props}>
            {children}
        </StickToBottom.Content>
    );
}

export function ChatContainerScrollAnchor({
    className,
    ...props
}: ChatContainerScrollAnchorProps) {
    return (
        <div
            className={cn('h-px w-full shrink-0 scroll-mt-4', className)}
            aria-hidden="true"
            {...props}
        />
    );
}

export { useStickToBottomContext };
