/**
 * Evo Design System — HoverCard
 * Registry: shadcn/ui — hover-card
 * Source: https://ui.shadcn.com/docs/components/radix/hover-card
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: per-package @radix-ui/react-hover-card; Evo tokens.
 */

import * as HoverCardPrimitive from '@radix-ui/react-hover-card';
import * as React from 'react';

import { cn } from '@/evo/lib/cn';

const HoverCard = HoverCardPrimitive.Root;
const HoverCardTrigger = HoverCardPrimitive.Trigger;

function HoverCardContent({
    className,
    align = 'center',
    sideOffset = 6,
    ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Content>) {
    return (
        <HoverCardPrimitive.Content
            className={cn(
                'z-[var(--evo-z-dropdown)] w-64 rounded-[var(--evo-radius-standard)] border border-[var(--evo-hairline)] bg-[var(--evo-surface-raised)] p-3 text-[13px] shadow-[var(--evo-shadow-floating)] outline-none',
                className,
            )}
            align={align}
            sideOffset={sideOffset}
            {...props}
        />
    );
}

export { HoverCard, HoverCardContent, HoverCardTrigger };
