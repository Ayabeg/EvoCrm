/**
 * Evo Design System — Select
 * Registry: shadcn/ui — select
 * Source: https://ui.shadcn.com/docs/components/radix/select
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: Phosphor carets; 32/36 trigger; teal selection; Evo tokens.
 */

import * as SelectPrimitive from '@radix-ui/react-select';
import * as React from 'react';

import { CaretDown, CaretUp, Check } from '@/evo/icons';
import { cn } from '@/evo/lib/cn';
import { FieldError } from '@/evo/ui/field';
import { Label } from '@/evo/ui/label';

const SelectRoot = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

export type SelectProps = React.ComponentProps<typeof SelectPrimitive.Root> & {
    label?: string;
    hint?: string;
    error?: boolean | string;
};

function Select({ label, hint, error, children, ...props }: SelectProps) {
    const generatedId = React.useId();
    const errorMessage = typeof error === 'string' ? error : undefined;
    const labelId = label ? `${generatedId}-label` : undefined;
    const hintId = hint && !errorMessage ? `${generatedId}-hint` : undefined;
    const errorId = errorMessage ? `${generatedId}-error` : undefined;
    const control = <SelectRoot {...props}>{children}</SelectRoot>;

    if (!label && !hint && !errorMessage) {
        return control;
    }

    return (
        <div
            className="grid w-full gap-2"
            data-slot="select-field"
            aria-labelledby={labelId}
            aria-describedby={errorId ?? hintId}
        >
            {label ? (
                <Label id={labelId} className="text-foreground">
                    {label}
                </Label>
            ) : null}
            {control}
            {hint && !errorMessage ? (
                <p
                    id={hintId}
                    className="text-muted-foreground text-[length:var(--text-meta)] leading-[var(--text-meta-line)]"
                    data-slot="select-hint"
                >
                    {hint}
                </p>
            ) : null}
            {errorMessage ? <FieldError id={errorId}>{errorMessage}</FieldError> : null}
        </div>
    );
}

function SelectTrigger({
    className,
    size = 'default',
    children,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & { size?: 'sm' | 'default' }) {
    return (
        <SelectPrimitive.Trigger
            data-slot="select-trigger"
            data-size={size}
            className={cn(
                'flex w-full items-center justify-between gap-2 rounded-[var(--evo-radius-compact)] border border-[var(--evo-hairline-strong)] bg-[var(--evo-surface)] px-3 text-[13px] text-[var(--evo-ink)]',
                'data-[placeholder]:text-[var(--evo-ink-faint)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--evo-canvas)]',
                'disabled:cursor-not-allowed disabled:opacity-50',
                size === 'sm' ? 'h-9' : 'h-9',
                className,
            )}
            {...props}
        >
            {children}
            <SelectPrimitive.Icon asChild>
                <CaretDown className="size-3.5 text-[var(--evo-ink-muted)]" aria-hidden />
            </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
    );
}

function SelectContent({
    className,
    children,
    position = 'popper',
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
    return (
        <SelectPrimitive.Portal>
            <SelectPrimitive.Content
                data-slot="select-content"
                className={cn(
                    'z-[var(--evo-z-dropdown)] max-h-72 min-w-[8rem] overflow-hidden rounded-[var(--evo-radius-standard)] border border-[var(--evo-hairline)] bg-[var(--evo-surface-raised)] text-[var(--evo-ink)] shadow-[var(--evo-shadow-floating)]',
                    position === 'popper' && 'data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1',
                    className,
                )}
                position={position}
                {...props}
            >
                <SelectScrollUpButton />
                <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
                <SelectScrollDownButton />
            </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
    );
}

function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
    return (
        <SelectPrimitive.Label
            className={cn('px-2 py-2 text-[12px] font-medium text-[var(--evo-ink-muted)]', className)}
            {...props}
        />
    );
}

function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
    return (
        <SelectPrimitive.Item
            className={cn(
                'relative flex w-full cursor-default items-center rounded-[var(--evo-radius-compact)] py-1.5 ps-8 pe-2 text-[13px] outline-none',
                'focus:bg-[var(--evo-teal-soft)] focus:text-[var(--evo-ink)]',
                'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                className,
            )}
            {...props}
        >
            <span className="absolute start-2 flex size-3.5 items-center justify-center">
                <SelectPrimitive.ItemIndicator>
                    <Check className="size-3.5" aria-hidden />
                </SelectPrimitive.ItemIndicator>
            </span>
            <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        </SelectPrimitive.Item>
    );
}

function SelectSeparator({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Separator>) {
    return <SelectPrimitive.Separator className={cn('-mx-1 my-1 h-px bg-[var(--evo-hairline)]', className)} {...props} />;
}

function SelectScrollUpButton({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
    return (
        <SelectPrimitive.ScrollUpButton className={cn('flex items-center justify-center py-1', className)} {...props}>
            <CaretUp className="size-3.5" aria-hidden />
        </SelectPrimitive.ScrollUpButton>
    );
}

function SelectScrollDownButton({
    className,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
    return (
        <SelectPrimitive.ScrollDownButton className={cn('flex items-center justify-center py-1', className)} {...props}>
            <CaretDown className="size-3.5" aria-hidden />
        </SelectPrimitive.ScrollDownButton>
    );
}

export {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectScrollDownButton,
    SelectScrollUpButton,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
};
