/**
 * Evo Design System — Tooltip
 * Registry: shadcn/ui — tooltip
 * Source: https://ui.shadcn.com/docs/components/radix/tooltip
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: Evo raised surface; 11px type; no source glow.
 */

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as React from 'react';

import { cn } from '@/evo/lib/cn';

function TooltipProvider({
    delayDuration = 200,
    ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
    return <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />;
}

const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

function TooltipContent({
    className,
    sideOffset = 6,
    ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
    return (
        <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
                data-slot="tooltip-content"
                sideOffset={sideOffset}
                className={cn(
                    'z-[var(--evo-z-dropdown)] max-w-xs rounded-[var(--evo-radius-compact)] border border-[var(--evo-hairline)] bg-[var(--evo-surface-raised)] px-2 py-1 text-[11px] text-[var(--evo-ink)] shadow-[var(--evo-shadow-floating)]',
                    className,
                )}
                {...props}
            />
        </TooltipPrimitive.Portal>
    );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
