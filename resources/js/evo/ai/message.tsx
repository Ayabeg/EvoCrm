/**
 * Evo Design System — UserMessage / AgentMessage
 * Registry: Prompt Kit — message
 * Source: https://github.com/ibelick/prompt-kit
 * Upstream: https://github.com/ibelick/prompt-kit @ 5a9496635cc0e1bf7679fe2a9e35d9b36b99c08a
 * License: MIT (LICENCE.md, verified 2026-10-02)
 * Copied: 2026-10-02
 * Modified: shiki dropped; lazy markdown; --evo-* tokens; 32/36 density.
 */

import { lazy, Suspense } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/evo/lib/cn';
import './message.css';

const MarkdownBody = lazy(() => import('./markdown'));

export type MessageProps = {
    children: ReactNode;
    className?: string;
} & ComponentProps<'div'>;

export function Message({ children, className, ...props }: MessageProps) {
    return (
        <div className={cn('flex w-full flex-col gap-2', className)} {...props}>
            {children}
        </div>
    );
}

export function MessageContent({
    children,
    className,
    markdown = false,
    ...props
}: {
    children: ReactNode;
    className?: string;
    markdown?: boolean;
} & ComponentProps<'div'>) {
    const text = typeof children === 'string' ? children : null;

    return (
        <div
            className={cn('text-[13px] leading-6 text-evo-ink', className)}
            {...props}
        >
            {markdown && text !== null ? (
                <Suspense fallback={<p className="whitespace-pre-wrap">{text}</p>}>
                    <MarkdownBody>{text}</MarkdownBody>
                </Suspense>
            ) : (
                children
            )}
        </div>
    );
}

export function UserMessage({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <Message className={cn('items-end', className)} data-agent-message="user">
            <MessageContent className="evo-ai-user-chip max-w-[min(100%,610px)] rounded-[var(--evo-radius-floating)] px-4 py-3 whitespace-pre-wrap">
                {children}
            </MessageContent>
        </Message>
    );
}

export function AgentMessage({
    children,
    className,
    markdown = true,
}: {
    children: ReactNode;
    className?: string;
    markdown?: boolean;
}) {
    return (
        <Message className={cn('items-start', className)} data-agent-message="assistant">
            <MessageContent
                markdown={markdown && typeof children === 'string'}
                className="max-w-[min(100%,650px)]"
            >
                {children}
            </MessageContent>
        </Message>
    );
}
