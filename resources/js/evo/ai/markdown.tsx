/**
 * Evo Design System — Agent markdown
 * Registry: Prompt Kit — message / markdown
 * Source: https://github.com/ibelick/prompt-kit
 * Upstream: https://github.com/ibelick/prompt-kit @ 5a9496635cc0e1bf7679fe2a9e35d9b36b99c08a
 * License: MIT (LICENCE.md, verified 2026-10-02)
 * Copied: 2026-10-02
 * Modified: shiki dropped; react-markdown + remark-gfm + remark-breaks; Evo tokens.
 * Default react-markdown does not render raw HTML.
 */

import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { cn } from '@/evo/lib/cn';

const components: Components = {
    p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
    ul: ({ children }) => (
        <ul className="mb-3 list-disc space-y-1 ps-5 last:mb-0">{children}</ul>
    ),
    ol: ({ children }) => (
        <ol className="mb-3 list-decimal space-y-1 ps-5 last:mb-0">{children}</ol>
    ),
    li: ({ children }) => <li className="leading-6">{children}</li>,
    a: ({ href, children }) => (
        <a
            href={href}
            className="text-evo-teal underline-offset-2 hover:underline"
            rel={href?.startsWith('http') ? 'noreferrer noopener' : undefined}
        >
            {children}
        </a>
    ),
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    code: ({ children, className }) => {
        const block = Boolean(className);

        if (block) {
            return (
                <code
                    className={cn(
                        'block overflow-x-auto rounded-[var(--evo-radius-compact)] bg-evo-surface-subtle px-3 py-2 font-evo-mono text-[12px]',
                        className,
                    )}
                >
                    {children}
                </code>
            );
        }

        return (
            <code className="rounded-[4px] bg-evo-surface-subtle px-1 py-0.5 font-evo-mono text-[12px]">
                {children}
            </code>
        );
    },
    pre: ({ children }) => <pre className="mb-3 last:mb-0">{children}</pre>,
    blockquote: ({ children }) => (
        <blockquote className="mb-3 border-s-2 border-evo-teal-soft ps-3 text-evo-ink-secondary last:mb-0">
            {children}
        </blockquote>
    ),
};

export function MarkdownBody({
    children,
    className,
}: {
    children: string;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'text-[13px] leading-6 text-evo-ink [&_:first-child]:mt-0',
                className,
            )}
        >
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
                {children}
            </ReactMarkdown>
        </div>
    );
}

export default MarkdownBody;
