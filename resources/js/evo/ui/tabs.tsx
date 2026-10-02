/**
 * Evo Design System — Tabs / Segmented pills
 * Registry: shadcn/ui — tabs
 * Source: https://ui.shadcn.com/docs/components/radix/tabs
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: PillGroup API kept; teal selected; Evo tokens.
 */

import * as TabsPrimitive from '@radix-ui/react-tabs';
import * as React from 'react';

import { cn } from '@/evo/lib/cn';

const Tabs = TabsPrimitive.Root;

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
    return (
        <TabsPrimitive.List
            className={cn(
                'inline-flex h-9 items-center gap-1 rounded-[var(--evo-radius-standard)] bg-[var(--evo-surface-subtle)] p-1 text-[13px]',
                className,
            )}
            {...props}
        />
    );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
    return (
        <TabsPrimitive.Trigger
            className={cn(
                'inline-flex h-7 items-center justify-center rounded-[var(--evo-radius-compact)] px-2.5 font-medium text-[var(--evo-ink-secondary)]',
                'data-[state=active]:bg-[var(--evo-surface)] data-[state=active]:text-[var(--evo-ink)] data-[state=active]:shadow-[var(--evo-shadow-pill)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-focus)]',
                'disabled:pointer-events-none disabled:opacity-50',
                className,
            )}
            {...props}
        />
    );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
    return <TabsPrimitive.Content className={cn('mt-3 focus-visible:outline-none', className)} {...props} />;
}

export type PillGroupProps = React.ComponentProps<typeof TabsPrimitive.List>;

function PillGroup({ className, ...props }: PillGroupProps) {
    return (
        <TabsPrimitive.List
            className={cn('inline-flex flex-wrap gap-1', className)}
            {...props}
        />
    );
}

function PillTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
    return (
        <TabsPrimitive.Trigger
            className={cn(
                'inline-flex h-8 items-center rounded-[var(--evo-radius-pill)] border border-[var(--evo-hairline)] px-3 text-[12px] text-[var(--evo-ink-secondary)]',
                'data-[state=active]:border-[var(--evo-teal)] data-[state=active]:bg-[var(--evo-teal-soft)] data-[state=active]:text-[var(--evo-ink)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-focus)]',
                className,
            )}
            {...props}
        />
    );
}

export { PillGroup, PillTrigger, Tabs, TabsContent, TabsList, TabsTrigger };
