/**
 * Evo Design System — SegmentedControl
 * Registry: shadcn/ui — toggle-group
 * Source: https://github.com/shadcn-ui/ui
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: product size/layout API; teal selected; Evo tokens. PR2 owns the rail switch.
 */

import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import * as React from 'react';

import { cn } from '@/evo/lib/cn';

export type SegmentedControlProps = React.ComponentProps<typeof ToggleGroupPrimitive.Root> & {
    size?: 'sm' | 'md' | 'lg';
    layout?: 'hug' | 'fill';
};

function SegmentedControl({ className, size = 'md', layout = 'hug', ...props }: SegmentedControlProps) {
    return (
        <ToggleGroupPrimitive.Root
            data-slot="segmented-control"
            className={cn(
                'inline-flex items-center rounded-[var(--evo-radius-standard)] bg-[var(--evo-surface-subtle)] p-0.5',
                layout === 'fill' && 'w-full',
                size === 'sm' && 'h-8',
                size === 'md' && 'h-9',
                size === 'lg' && 'h-9',
                className,
            )}
            {...props}
        />
    );
}

function SegmentedControlItem({
    className,
    ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
    return (
        <ToggleGroupPrimitive.Item
            className={cn(
                'inline-flex flex-1 items-center justify-center rounded-[var(--evo-radius-compact)] px-2.5 text-[12px] font-medium text-[var(--evo-ink-secondary)]',
                'data-[state=on]:bg-[var(--evo-surface)] data-[state=on]:text-[var(--evo-ink)] data-[state=on]:shadow-[var(--evo-shadow-pill)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-focus)]',
                'disabled:pointer-events-none disabled:opacity-50',
                className,
            )}
            {...props}
        />
    );
}

export { SegmentedControl, SegmentedControlItem };
