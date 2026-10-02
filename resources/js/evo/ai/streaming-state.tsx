/**
 * Evo Design System — StreamingState
 * Registry: Prompt Kit — loader
 * Source: https://github.com/ibelick/prompt-kit
 * Upstream: https://github.com/ibelick/prompt-kit @ 5a9496635cc0e1bf7679fe2a9e35d9b36b99c08a
 * License: MIT (LICENCE.md, verified 2026-10-02)
 * Copied: 2026-10-02
 * Modified: trimmed loader variants; --evo-* tokens; reduced-motion gate; French status.
 */

import { CircleNotch } from '@/evo/icons';
import { cn } from '@/evo/lib/cn';
import { usePrefersReducedMotion } from '@/evo/lib/motion';

export function StreamingState({
    label = 'Réponse en cours…',
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
            data-agent-state="streaming"
        >
            {reduceMotion ? (
                <CircleNotch className="size-3.5" weight="bold" aria-hidden />
            ) : (
                <span className="flex items-center gap-0.5" aria-hidden>
                    <span className="size-1.5 animate-pulse rounded-full bg-evo-teal" />
                    <span className="size-1.5 animate-pulse rounded-full bg-evo-teal [animation-delay:120ms]" />
                    <span className="size-1.5 animate-pulse rounded-full bg-evo-teal [animation-delay:240ms]" />
                </span>
            )}
            <span>{label}</span>
        </div>
    );
}
