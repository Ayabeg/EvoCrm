/**
 * Evo Design System — Popover
 * Registry: shadcn/ui — popover
 * Source: https://ui.shadcn.com/docs/components/radix/popover
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: Evo tokens; header/title helpers kept.
 */

import * as PopoverPrimitive from '@radix-ui/react-popover';
import * as React from 'react';

import { cn } from '@/evo/lib/cn';
import { MOTION_DROPDOWN_CLASS } from '@/lib/motion';

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverAnchor = PopoverPrimitive.Anchor;

export type PopoverTriggerProps = React.ComponentProps<typeof PopoverPrimitive.Trigger>;
export type PopoverContentProps = React.ComponentProps<typeof PopoverPrimitive.Content>;

function PopoverContent({ className, align = 'center', sideOffset = 6, ...props }: PopoverContentProps) {
    return (
        <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content
                data-slot="popover-content"
                align={align}
                sideOffset={sideOffset}
                className={cn(
                    'z-[var(--evo-z-dropdown)] w-72 max-w-[calc(100vw-1rem)] rounded-[var(--evo-radius-standard)] border border-[var(--evo-hairline)] bg-[var(--evo-surface-raised)] p-3 text-[13px] text-[var(--evo-ink)] shadow-[var(--evo-shadow-floating)] outline-none',
                    MOTION_DROPDOWN_CLASS,
                    className,
                )}
                {...props}
            />
        </PopoverPrimitive.Portal>
    );
}

function PopoverHeader({ className, ...props }: React.ComponentProps<'div'>) {
    return <div className={cn('mb-2 flex flex-col gap-0.5', className)} {...props} />;
}

function PopoverTitle({ className, ...props }: React.ComponentProps<'h3'>) {
    return <h3 className={cn('text-[13px] font-medium', className)} {...props} />;
}

function PopoverDescription({ className, ...props }: React.ComponentProps<'p'>) {
    return <p className={cn('text-[12px] text-[var(--evo-ink-secondary)]', className)} {...props} />;
}

export {
    Popover,
    PopoverAnchor,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
};
