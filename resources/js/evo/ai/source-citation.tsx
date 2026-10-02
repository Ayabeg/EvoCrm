/**
 * Evo Design System — SourceCitation
 * Registry: Prompt Kit — source
 * Source: https://github.com/ibelick/prompt-kit
 * Upstream: https://github.com/ibelick/prompt-kit @ 5a9496635cc0e1bf7679fe2a9e35d9b36b99c08a
 * License: MIT (LICENCE.md, verified 2026-10-02)
 * Copied: 2026-10-02
 * Modified: HoverCard + Evo tokens; Phosphor; French labels.
 */

import { evoFocus } from '@/evo/ai/types';
import { ArrowSquareOut } from '@/evo/icons';
import { cn } from '@/evo/lib/cn';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/evo/ui/hover-card';

export function SourceCitation({
    href,
    title,
    description,
    className,
}: {
    href: string;
    title: string;
    description?: string;
    className?: string;
}) {
    return (
        <HoverCard>
            <HoverCardTrigger asChild>
                <a
                    href={href}
                    className={cn(
                        'inline-flex min-h-8 items-center gap-1 rounded-[var(--evo-radius-compact)] border border-evo-hairline bg-evo-surface px-2 text-[11px] font-medium text-evo-teal',
                        evoFocus,
                        className,
                    )}
                >
                    {title}
                    <ArrowSquareOut className="size-3" weight="regular" aria-hidden />
                </a>
            </HoverCardTrigger>
            <HoverCardContent>
                <p className="text-[12px] font-medium text-evo-ink">{title}</p>
                {description ? (
                    <p className="mt-1 text-[12px] text-evo-ink-muted">{description}</p>
                ) : null}
                <p className="mt-2 truncate text-[11px] text-evo-ink-faint">{href}</p>
            </HoverCardContent>
        </HoverCard>
    );
}
