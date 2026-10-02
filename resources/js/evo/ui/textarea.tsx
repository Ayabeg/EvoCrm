/**
 * Evo Design System — Textarea
 * Registry: shadcn/ui — textarea
 * Source: https://github.com/shadcn-ui/ui
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: Evo tokens; error/warn/success states from product API.
 */

import * as React from 'react';

import { cn } from '@/evo/lib/cn';

export type TextareaState = 'error' | 'warn' | 'success';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    state?: TextareaState;
    error?: boolean;
    autoResize?: boolean;
    autoGrow?: boolean;
    showCount?: boolean;
    unstyled?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
    { className, state, error, autoResize, autoGrow, showCount, unstyled, onChange, maxLength, value, ...props },
    ref,
) {
    const resolved = state ?? (error ? 'error' : undefined);
    const grow = Boolean(autoResize || autoGrow);
    const innerRef = React.useRef<HTMLTextAreaElement | null>(null);

    const setRefs = React.useCallback(
        (node: HTMLTextAreaElement | null) => {
            innerRef.current = node;

            if (typeof ref === 'function') {
                ref(node);
            } else if (ref) {
                ref.current = node;
            }
        },
        [ref],
    );

    const resize = React.useCallback(() => {
        const node = innerRef.current;

        if (!node || !grow) {
            return;
        }

        node.style.height = 'auto';
        node.style.height = `${node.scrollHeight}px`;
    }, [grow]);

    React.useLayoutEffect(() => {
        resize();
    }, [resize, value]);

    if (unstyled) {
        return (
            <textarea
                ref={setRefs}
                value={value}
                maxLength={maxLength}
                onChange={(event) => {
                    onChange?.(event);

                    if (grow) {
                        event.currentTarget.style.height = 'auto';
                        event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px`;
                    }
                }}
                className={className}
                {...props}
            />
        );
    }

    return (
        <div className="relative">
            <textarea
                ref={setRefs}
                data-slot="textarea"
                aria-invalid={resolved === 'error' || undefined}
                value={value}
                maxLength={maxLength}
                onChange={(event) => {
                    onChange?.(event);

                    if (grow) {
                        event.currentTarget.style.height = 'auto';
                        event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px`;
                    }
                }}
                className={cn(
                    'min-h-20 w-full rounded-[var(--evo-radius-compact)] border border-[var(--evo-hairline-strong)] bg-[var(--evo-surface)] px-3 py-2 text-[13px] text-[var(--evo-ink)]',
                    'placeholder:text-[var(--evo-ink-faint)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--evo-canvas)]',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    resolved === 'error' && 'border-[var(--evo-danger)]',
                    resolved === 'warn' && 'border-[var(--evo-warning)]',
                    resolved === 'success' && 'border-[var(--evo-success)]',
                    className,
                )}
                {...props}
            />
            {showCount && maxLength ? (
                <span className="pointer-events-none absolute bottom-1.5 right-2 text-[11px] text-[var(--evo-ink-muted)]">
                    {String(value ?? '').length}/{maxLength}
                </span>
            ) : null}
        </div>
    );
});

export { Textarea };
export default Textarea;
