/**
 * Evo Design System — PromptSuggestion
 * Registry: Prompt Kit — prompt-suggestion
 * Source: https://github.com/ibelick/prompt-kit
 * Upstream: https://github.com/ibelick/prompt-kit @ 5a9496635cc0e1bf7679fe2a9e35d9b36b99c08a
 * License: MIT (LICENCE.md, verified 2026-10-02)
 * Copied: 2026-10-02
 * Modified: lucide → Phosphor (none needed); --evo-* tokens; 32px chips.
 */

import type { ComponentProps } from 'react';
import { evoFocus } from '@/evo/ai/types';
import { cn } from '@/evo/lib/cn';

export function PromptSuggestion({
    children,
    className,
    disabled,
    ...props
}: ComponentProps<'button'>) {
    return (
        <button
            type="button"
            disabled={disabled}
            className={cn(
                'min-h-8 rounded-[var(--evo-radius-compact)] px-2.5 text-[12px] text-evo-ink-secondary transition-colors duration-[var(--evo-duration-micro)] ease-evo',
                'hover:bg-evo-surface hover:text-evo-teal disabled:cursor-not-allowed disabled:opacity-55',
                evoFocus,
                className,
            )}
            {...props}
        >
            {children}
        </button>
    );
}
