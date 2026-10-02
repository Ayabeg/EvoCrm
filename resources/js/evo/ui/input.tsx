/**
 * Evo Design System — Input
 * Registry: shadcn/ui — input
 * Source: https://ui.shadcn.com/docs/components/radix/input
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: 32/36 heights; adornments/clearable from prior product API; Evo tokens; teal focus.
 */

import * as React from 'react';

import { X } from '@/evo/icons';
import { sr } from '@/evo/lib/a11y';
import { cn } from '@/evo/lib/cn';

export type InputState = 'error' | 'warn' | 'success';
export type InputSize = 'sm' | 'default' | 'lg';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
    startAdornment?: React.ReactNode;
    endAdornment?: React.ReactNode;
    state?: InputState;
    error?: boolean;
    size?: InputSize;
    clearable?: boolean;
    onClear?: () => void;
    unstyled?: boolean;
}

const sizeClass: Record<InputSize, string> = {
    sm: 'h-8 text-[12px] px-2.5',
    default: 'h-9 text-[13px] px-3',
    lg: 'h-9 text-[13px] px-3',
};

const stateClass: Record<InputState, string> = {
    error: 'border-[var(--evo-danger)] focus-visible:ring-[var(--evo-danger)]',
    warn: 'border-[var(--evo-warning)] focus-visible:ring-[var(--evo-warning)]',
    success: 'border-[var(--evo-success)] focus-visible:ring-[var(--evo-success)]',
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
    {
        className,
        type = 'text',
        startAdornment,
        endAdornment,
        state,
        error,
        size = 'default',
        clearable,
        onClear,
        unstyled,
        disabled,
        value,
        onChange,
        ...props
    },
    ref,
) {
    const resolvedState = state ?? (error ? 'error' : undefined);

    if (unstyled) {
        return (
            <input
                ref={ref}
                type={type}
                className={className}
                disabled={disabled}
                value={value}
                onChange={onChange}
                {...props}
            />
        );
    }

    const showClear = Boolean(clearable && value !== undefined && String(value).length > 0 && !disabled);

    const field = (
        <input
            ref={ref}
            type={type}
            data-slot="input"
            data-size={size}
            aria-invalid={resolvedState === 'error' || undefined}
            disabled={disabled}
            value={value}
            onChange={onChange}
            className={cn(
                'w-full min-w-0 rounded-[var(--evo-radius-compact)] border border-[var(--evo-hairline-strong)] bg-[var(--evo-surface)] text-[var(--evo-ink)]',
                'placeholder:text-[var(--evo-ink-faint)]',
                'transition-[border-color,box-shadow] duration-[var(--evo-duration-micro)] ease-[var(--evo-ease)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--evo-canvas)]',
                'disabled:cursor-not-allowed disabled:opacity-50',
                sizeClass[size],
                startAdornment && 'pl-8',
                (endAdornment || showClear) && 'pr-8',
                resolvedState && stateClass[resolvedState],
                className,
            )}
            {...props}
        />
    );

    if (!startAdornment && !endAdornment && !showClear) {
        return field;
    }

    return (
        <div className="relative w-full" data-slot="input-wrap">
            {startAdornment ? (
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-[var(--evo-ink-muted)]">
                    {startAdornment}
                </span>
            ) : null}
            {field}
            {showClear ? (
                <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center px-2 text-[var(--evo-ink-muted)] hover:text-[var(--evo-ink)]"
                    aria-label={sr.clear}
                    onClick={() => {
                        if (onClear) {
                            onClear();

                            return;
                        }

                        onChange?.({
                            target: { value: '' },
                            currentTarget: { value: '' },
                        } as React.ChangeEvent<HTMLInputElement>);
                    }}
                >
                    <X className="size-3.5" aria-hidden />
                </button>
            ) : endAdornment ? (
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-[var(--evo-ink-muted)]">
                    {endAdornment}
                </span>
            ) : null}
        </div>
    );
});

export { Input };
