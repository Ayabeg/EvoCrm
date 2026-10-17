/**
 * Evo Design System — ContextMenu
 * Registry: shadcn/ui — context-menu
 * Source: https://ui.shadcn.com/docs/components/radix/context-menu
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: per-package @radix-ui/react-context-menu; Evo tokens.
 */

import * as ContextMenuPrimitive from '@radix-ui/react-context-menu';
import * as React from 'react';

import { CaretRight, Check } from '@/evo/icons';
import { cn } from '@/evo/lib/cn';

const ContextMenu = ContextMenuPrimitive.Root;
const ContextMenuTrigger = ContextMenuPrimitive.Trigger;
const ContextMenuGroup = ContextMenuPrimitive.Group;
const ContextMenuPortal = ContextMenuPrimitive.Portal;
const ContextMenuSub = ContextMenuPrimitive.Sub;
const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;

function ContextMenuContent({ className, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Content>) {
    return (
        <ContextMenuPrimitive.Portal>
            <ContextMenuPrimitive.Content
                className={cn(
                    'z-[var(--evo-z-dropdown)] min-w-40 overflow-hidden rounded-[var(--evo-radius-standard)] border border-[var(--evo-hairline)] bg-[var(--evo-surface-raised)] p-1 text-[13px] shadow-[var(--evo-shadow-floating)]',
                    className,
                )}
                {...props}
            />
        </ContextMenuPrimitive.Portal>
    );
}

function ContextMenuItem({
    className,
    inset,
    ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Item> & { inset?: boolean }) {
    return (
        <ContextMenuPrimitive.Item
            className={cn(
                'relative flex cursor-default items-center rounded-[var(--evo-radius-compact)] px-2 py-1.5 outline-none focus:bg-[var(--evo-teal-soft)]',
                inset && 'ps-8',
                className,
            )}
            {...props}
        />
    );
}

function ContextMenuCheckboxItem({
    className,
    children,
    checked,
    ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.CheckboxItem>) {
    return (
        <ContextMenuPrimitive.CheckboxItem
            className={cn('relative flex cursor-default items-center rounded-[var(--evo-radius-compact)] py-1.5 ps-8 pe-2 outline-none focus:bg-[var(--evo-teal-soft)]', className)}
            checked={checked}
            {...props}
        >
            <span className="absolute start-2 flex size-3.5 items-center justify-center">
                <ContextMenuPrimitive.ItemIndicator>
                    <Check className="size-3.5" aria-hidden />
                </ContextMenuPrimitive.ItemIndicator>
            </span>
            {children}
        </ContextMenuPrimitive.CheckboxItem>
    );
}

function ContextMenuRadioItem({
    className,
    children,
    ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.RadioItem>) {
    return (
        <ContextMenuPrimitive.RadioItem
            className={cn('relative flex cursor-default items-center rounded-[var(--evo-radius-compact)] py-1.5 ps-8 pe-2 outline-none focus:bg-[var(--evo-teal-soft)]', className)}
            {...props}
        >
            <span className="absolute start-2 flex size-3.5 items-center justify-center">
                <ContextMenuPrimitive.ItemIndicator>
                    <Check className="size-3.5" aria-hidden />
                </ContextMenuPrimitive.ItemIndicator>
            </span>
            {children}
        </ContextMenuPrimitive.RadioItem>
    );
}

function ContextMenuLabel({
    className,
    inset,
    ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Label> & { inset?: boolean }) {
    return (
        <ContextMenuPrimitive.Label
            className={cn('px-2 py-2 text-[12px] font-medium text-[var(--evo-ink-muted)]', inset && 'ps-8', className)}
            {...props}
        />
    );
}

function ContextMenuSeparator({ className, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Separator>) {
    return <ContextMenuPrimitive.Separator className={cn('-mx-1 my-1 h-px bg-[var(--evo-hairline)]', className)} {...props} />;
}

function ContextMenuShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
    return <span className={cn('ms-auto text-[12px] text-[var(--evo-ink-muted)]', className)} {...props} />;
}

function ContextMenuSubTrigger({
    className,
    inset,
    children,
    ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.SubTrigger> & { inset?: boolean }) {
    return (
        <ContextMenuPrimitive.SubTrigger
            className={cn(
                'flex cursor-default items-center rounded-[var(--evo-radius-compact)] px-2 py-1.5 outline-none focus:bg-[var(--evo-teal-soft)]',
                inset && 'ps-8',
                className,
            )}
            {...props}
        >
            {children}
            <CaretRight className="ms-auto size-3.5" aria-hidden />
        </ContextMenuPrimitive.SubTrigger>
    );
}

function ContextMenuSubContent({ className, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.SubContent>) {
    return (
        <ContextMenuPrimitive.SubContent
            className={cn(
                'z-[var(--evo-z-dropdown)] min-w-32 overflow-hidden rounded-[var(--evo-radius-standard)] border border-[var(--evo-hairline)] bg-[var(--evo-surface-raised)] p-1 shadow-[var(--evo-shadow-floating)]',
                className,
            )}
            {...props}
        />
    );
}

export {
    ContextMenu,
    ContextMenuCheckboxItem,
    ContextMenuContent,
    ContextMenuGroup,
    ContextMenuItem,
    ContextMenuLabel,
    ContextMenuPortal,
    ContextMenuRadioGroup,
    ContextMenuRadioItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
};
