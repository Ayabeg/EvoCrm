/**
 * Evo Design System — ThinkingState
 * Registry: PastaUI — thinking-shimmer
 * Source: https://github.com/syeddhasnainn/pastaui
 * Upstream: https://github.com/syeddhasnainn/pastaui @ d6a8b1b8eeed2f25acac8eb24abcc35651374705
 * License: MIT (LICENSE, verified 2026-10-02)
 * Copied: 2026-10-02
 * Modified: Solar icons → Phosphor; pastaui styles → --evo-*; reduced-motion; aria-live.
 */

import { Sparkle } from '@/evo/icons';
import { cn } from '@/evo/lib/cn';
import { usePrefersReducedMotion } from '@/evo/lib/motion';

export function ThinkingState({
    label = 'L’agent consulte le contexte CRM…',
    className,
}: {
    label?: string;
    className?: string;
}) {
    const reduceMotion = usePrefersReducedMotion();

    return (
        <div
            className={cn('flex items-center gap-2 text-[12px] text-evo-ink-muted', className)}
            role="status"
            aria-live="polite"
            data-agent-state="thinking"
        >
            <Sparkle
                className={cn('size-3.5 text-evo-teal', !reduceMotion && 'animate-pulse')}
                weight="regular"
                aria-hidden
            />
            <span className={cn(!reduceMotion && 'bg-linear-to-r from-evo-ink-muted via-evo-ink to-evo-ink-muted bg-[length:200%_100%] bg-clip-text')}>
                {label}
            </span>
        </div>
    );
}
