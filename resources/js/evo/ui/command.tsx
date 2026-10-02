/**
 * Evo Design System — Command (cmdk primitive)
 * Registry: shadcn/ui — command
 * Source: https://ui.shadcn.com/docs/components/radix/command
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: generic primitive only — PR2 owns CommandPalette surface.
 */

import { Command as CommandPrimitive } from 'cmdk';
import * as React from 'react';

import { MagnifyingGlass } from '@/evo/icons';
import { sr } from '@/evo/lib/a11y';
import { cn } from '@/evo/lib/cn';

function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
    return (
        <CommandPrimitive
            data-slot="command"
            className={cn(
                'flex h-full w-full flex-col overflow-hidden rounded-[var(--evo-radius-standard)] bg-[var(--evo-surface-raised)] text-[var(--evo-ink)]',
                className,
            )}
            {...props}
        />
    );
}

function CommandInput({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Input>) {
    return (
        <div className="flex items-center gap-2 border-b border-[var(--evo-hairline)] px-3" cmdk-input-wrapper="">
            <MagnifyingGlass className="size-3.5 shrink-0 text-[var(--evo-ink-muted)]" aria-hidden />
            <CommandPrimitive.Input
                aria-label={sr.search}
                className={cn(
                    'flex h-9 w-full bg-transparent text-[13px] outline-none placeholder:text-[var(--evo-ink-faint)]',
                    className,
                )}
                {...props}
            />
        </div>
    );
}

function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
    return (
        <CommandPrimitive.List
            className={cn('max-h-64 overflow-y-auto p-1', className)}
            {...props}
        />
    );
}

function CommandEmpty({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Empty>) {
    return (
        <CommandPrimitive.Empty
            className={cn('px-3 py-6 text-center text-[13px] text-[var(--evo-ink-muted)]', className)}
            {...props}
        />
    );
}

function CommandGroup({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Group>) {
    return (
        <CommandPrimitive.Group
            className={cn(
                'overflow-hidden p-1 text-[var(--evo-ink)] [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:text-[var(--evo-ink-muted)]',
                className,
            )}
            {...props}
        />
    );
}

function CommandItem({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) {
    return (
        <CommandPrimitive.Item
            className={cn(
                'relative flex cursor-default items-center gap-2 rounded-[var(--evo-radius-compact)] px-2 py-1.5 text-[13px] outline-none',
                'data-[selected=true]:bg-[var(--evo-teal-soft)] data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
                className,
            )}
            {...props}
        />
    );
}

function CommandSeparator({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Separator>) {
    return <CommandPrimitive.Separator className={cn('-mx-1 h-px bg-[var(--evo-hairline)]', className)} {...props} />;
}

export {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
};
