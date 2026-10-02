/**
 * Evo Design System — Button / IconButton base
 * Registry: shadcn/ui — button
 * Source: https://ui.shadcn.com/docs/components/radix/button
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: --evo-* tokens only; 32/36 density; orange primary with #121212 labels;
 * teal focus; Phosphor spinner; Aurora variant aliases for leftover AGPL files;
 * stripped source visual identity.
 */

import { Slot } from '@radix-ui/react-slot';
import { cva  } from 'class-variance-authority';
import type {VariantProps} from 'class-variance-authority';
import * as React from 'react';

import { CircleNotch } from '@/evo/icons';
import { sr } from '@/evo/lib/a11y';
import { cn } from '@/evo/lib/cn';

const focusRing =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--evo-canvas)]';

export const buttonVariants = cva(
    cn(
        'evo-btn inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap border font-medium',
        'rounded-[var(--evo-radius-compact)] text-[13px] leading-none',
        'transition-[background-color,border-color,color,box-shadow] duration-[var(--evo-duration-micro)] ease-[var(--evo-ease)]',
        'disabled:pointer-events-none disabled:opacity-50',
        '[&_svg]:pointer-events-none [&_svg]:shrink-0',
        focusRing,
    ),
    {
        variants: {
            variant: {
                default:
                    'border-[var(--evo-primary)] bg-[var(--evo-primary)] text-[var(--evo-on-primary)] hover:border-[var(--evo-primary-hover)] hover:bg-[var(--evo-primary-hover)] active:border-[var(--evo-primary-pressed)] active:bg-[var(--evo-primary-pressed)]',
                destructive:
                    'border-[var(--evo-danger)] bg-[var(--evo-danger)] text-[var(--evo-on-danger)] hover:brightness-[0.94]',
                outline:
                    'border-[var(--evo-hairline-strong)] bg-[var(--evo-surface)] text-[var(--evo-ink)] hover:bg-[var(--evo-hover)]',
                secondary:
                    'border-[var(--evo-hairline)] bg-[var(--evo-surface-subtle)] text-[var(--evo-ink)] hover:bg-[var(--evo-hover)]',
                ghost:
                    'border-transparent bg-transparent text-[var(--evo-ink)] hover:bg-[var(--evo-hover)]',
                link: 'border-transparent bg-transparent text-[var(--evo-teal)] underline-offset-4 hover:underline',
                aurora:
                    'border-[var(--evo-primary)] bg-[var(--evo-primary)] text-[var(--evo-on-primary)] hover:border-[var(--evo-primary-hover)] hover:bg-[var(--evo-primary-hover)]',
                neutral:
                    'border-[var(--evo-hairline-strong)] bg-[var(--evo-surface)] text-[var(--evo-ink)] hover:bg-[var(--evo-hover)]',
                rose: 'border-[var(--evo-danger)] bg-[var(--evo-danger)] text-[var(--evo-on-danger)] hover:brightness-[0.94]',
                success:
                    'border-[var(--evo-success)] bg-[var(--evo-success)] text-white hover:brightness-[0.94]',
                warn: 'border-[var(--evo-warning)] bg-[var(--evo-warning)] text-[var(--evo-on-primary)] hover:brightness-[0.94]',
                plain: 'border-transparent bg-transparent text-[var(--evo-ink)] hover:bg-transparent',
            },
            size: {
                default: 'h-9 px-3',
                sm: 'h-8 px-2.5 text-[12px]',
                lg: 'h-9 px-3.5',
                icon: 'size-9 p-0',
                unstyled: 'h-auto w-auto border-0 bg-transparent p-0',
            },
            shape: {
                default: '',
                pill: 'rounded-[var(--evo-radius-pill)]',
            },
            block: {
                true: 'w-full',
                false: '',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
            shape: 'default',
            block: false,
        },
    },
);

export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>;
export type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>['size']>;

export interface ButtonProps
    extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    loading?: boolean;
    filled?: boolean;
    pulse?: boolean;
    iconLeft?: React.ReactNode;
    iconRight?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    {
        className,
        variant = 'default',
        size = 'default',
        shape = 'default',
        block = false,
        asChild = false,
        loading = false,
        filled = false,
        pulse = false,
        iconLeft,
        iconRight,
        disabled,
        children,
        type = 'button',
        ...props
    },
    ref,
) {
    const classNameResolved = cn(
        buttonVariants({ variant, size, shape, block }),
        pulse && 'motion-safe:animate-pulse',
        className,
    );

    if (asChild) {
        return (
            <Slot
                ref={ref}
                data-slot="button"
                data-variant={variant}
                data-size={size}
                data-filled={filled || undefined}
                className={classNameResolved}
                {...props}
            >
                {children}
            </Slot>
        );
    }

    return (
        <button
            ref={ref}
            data-slot="button"
            data-variant={variant}
            data-size={size}
            data-filled={filled || undefined}
            type={type}
            className={classNameResolved}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            {...props}
        >
            {loading ? (
                <CircleNotch className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
            ) : (
                iconLeft
            )}
            {children}
            {loading ? <span className="sr-only">{sr.loading}</span> : iconRight}
        </button>
    );
});

export { Button };
