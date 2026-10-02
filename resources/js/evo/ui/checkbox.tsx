/**
 * Evo Design System — Checkbox
 * Registry: shadcn/ui — checkbox
 * Source: https://github.com/shadcn-ui/ui
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: keeps product onCheckedChange + indeterminate; Phosphor check; teal checked.
 */

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as React from 'react';

import { Check, Minus } from '@/evo/icons';
import { cn } from '@/evo/lib/cn';

export interface CheckboxProps
    extends Omit<React.ComponentProps<typeof CheckboxPrimitive.Root>, 'onChange'> {
    indeterminate?: boolean;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    onCheckedChange?: (checked: boolean) => void;
    children?: React.ReactNode;
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox(
    { className, checked, indeterminate, onCheckedChange, onChange, children, id, disabled, ...props },
    ref,
) {
    const generatedId = React.useId();
    const resolvedId = id ?? (children ? generatedId : undefined);
    const value = indeterminate ? 'indeterminate' : checked;

    const control = (
        <CheckboxPrimitive.Root
            ref={ref}
            id={resolvedId}
            data-slot="checkbox"
            checked={value}
            disabled={disabled}
            onCheckedChange={(next) => {
                const bool = next === true;
                onCheckedChange?.(bool);
                onChange?.({
                    target: { checked: bool },
                    currentTarget: { checked: bool },
                } as React.ChangeEvent<HTMLInputElement>);
            }}
            className={cn(
                'peer size-4 shrink-0 rounded-[4px] border border-[var(--evo-hairline-strong)] bg-[var(--evo-surface)]',
                'data-[state=checked]:border-[var(--evo-teal)] data-[state=checked]:bg-[var(--evo-teal)] data-[state=checked]:text-white',
                'data-[state=indeterminate]:border-[var(--evo-teal)] data-[state=indeterminate]:bg-[var(--evo-teal)] data-[state=indeterminate]:text-white',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--evo-canvas)]',
                'disabled:cursor-not-allowed disabled:opacity-50',
                className,
            )}
            {...props}
        >
            <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
                {indeterminate ? <Minus className="size-3" aria-hidden /> : <Check className="size-3" aria-hidden />}
            </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
    );

    if (!children) {
        return control;
    }

    return (
        <label
            htmlFor={resolvedId}
            className={cn(
                'inline-flex items-center gap-2 text-[13px] text-[var(--evo-ink)]',
                disabled && 'opacity-50',
            )}
        >
            {control}
            <span>{children}</span>
        </label>
    );
});

export { Checkbox };
