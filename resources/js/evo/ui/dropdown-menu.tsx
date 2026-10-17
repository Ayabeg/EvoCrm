/**
 * Evo Design System — DropdownMenu
 * Registry: shadcn/ui — dropdown-menu
 * Source: https://github.com/shadcn-ui/ui
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: Phosphor carets/checks; teal focus; Evo tokens.
 */

import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import * as React from 'react';

import { CaretRight, Check } from '@/evo/icons';
import { cn } from '@/evo/lib/cn';
import { MOTION_DROPDOWN_CLASS } from '@/lib/motion';

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

function DropdownMenuContent({
    className,
    sideOffset = 8,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
    return (
        <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.Content
                sideOffset={sideOffset}
                className={cn(
                    'z-[var(--evo-z-dropdown)] min-w-40 max-w-[min(24rem,calc(100vw-1rem))] overflow-hidden rounded-[var(--evo-radius-standard)] border border-[var(--evo-hairline)] bg-[var(--evo-surface-raised)] p-1 text-[13px] shadow-[var(--evo-shadow-floating)]',
                    MOTION_DROPDOWN_CLASS,
                    className,
                )}
                {...props}
            />
        </DropdownMenuPrimitive.Portal>
    );
}

export interface DropdownMenuItemProps extends React.ComponentProps<typeof DropdownMenuPrimitive.Item> {
    inset?: boolean;
}

function DropdownMenuItem({ className, inset, ...props }: DropdownMenuItemProps) {
    return (
        <DropdownMenuPrimitive.Item
            className={cn(
                'relative flex cursor-default items-center gap-2 rounded-[var(--evo-radius-compact)] px-2 py-2 outline-none',
                'focus:bg-[var(--evo-teal-soft)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                inset && 'ps-8',
                className,
            )}
            {...props}
        />
    );
}

function DropdownMenuCheckboxItem({
    className,
    children,
    checked,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
    return (
        <DropdownMenuPrimitive.CheckboxItem
            className={cn(
                'relative flex cursor-default items-center rounded-[var(--evo-radius-compact)] py-2 ps-8 pe-2 outline-none focus:bg-[var(--evo-teal-soft)]',
                className,
            )}
            checked={checked}
            {...props}
        >
            <span className="absolute start-2 flex size-3.5 items-center justify-center">
                <DropdownMenuPrimitive.ItemIndicator>
                    <Check className="size-3.5" aria-hidden />
                </DropdownMenuPrimitive.ItemIndicator>
            </span>
            {children}
        </DropdownMenuPrimitive.CheckboxItem>
    );
}

function DropdownMenuRadioItem({
    className,
    children,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
    return (
        <DropdownMenuPrimitive.RadioItem
            className={cn(
                'relative flex cursor-default items-center rounded-[var(--evo-radius-compact)] py-2 ps-8 pe-2 outline-none focus:bg-[var(--evo-teal-soft)]',
                className,
            )}
            {...props}
        >
            <span className="absolute start-2 flex size-3.5 items-center justify-center">
                <DropdownMenuPrimitive.ItemIndicator>
                    <Check className="size-3.5" aria-hidden />
                </DropdownMenuPrimitive.ItemIndicator>
            </span>
            {children}
        </DropdownMenuPrimitive.RadioItem>
    );
}

function DropdownMenuLabel({
    className,
    inset,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & { inset?: boolean }) {
    return (
        <DropdownMenuPrimitive.Label
            className={cn('px-2 py-2 text-[12px] font-medium text-[var(--evo-ink-muted)]', inset && 'ps-8', className)}
            {...props}
        />
    );
}

function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
    return <DropdownMenuPrimitive.Separator className={cn('-mx-1 my-1 h-px bg-[var(--evo-hairline)]', className)} {...props} />;
}

function DropdownMenuShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
    return <span className={cn('ms-auto text-[12px] text-[var(--evo-ink-muted)]', className)} {...props} />;
}

function DropdownMenuSubTrigger({
    className,
    inset,
    children,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & { inset?: boolean }) {
    return (
        <DropdownMenuPrimitive.SubTrigger
            className={cn(
                'flex cursor-default items-center rounded-[var(--evo-radius-compact)] px-2 py-2 outline-none focus:bg-[var(--evo-teal-soft)]',
                inset && 'ps-8',
                className,
            )}
            {...props}
        >
            {children}
            <CaretRight className="ms-auto size-3.5" aria-hidden />
        </DropdownMenuPrimitive.SubTrigger>
    );
}

function DropdownMenuSubContent({
    className,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
    return (
        <DropdownMenuPrimitive.SubContent
            className={cn(
                'z-[var(--evo-z-dropdown)] min-w-32 overflow-hidden rounded-[var(--evo-radius-standard)] border border-[var(--evo-hairline)] bg-[var(--evo-surface-raised)] p-1 shadow-[var(--evo-shadow-floating)]',
                className,
            )}
            {...props}
        />
    );
}

export {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
};
