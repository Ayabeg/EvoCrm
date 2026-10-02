/**
 * Evo Design System — Alert
 * Registry: ReUI — alert
 * Source: https://reui.io/components/alert
 * Upstream: https://github.com/keenthemes/reui @ 6e433ddaba3a4be38182c8c8883b6cc335183c42
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: Evo tokens; Phosphor icons; default + destructive variants.
 */

import { cva  } from 'class-variance-authority';
import type {VariantProps} from 'class-variance-authority';
import * as React from 'react';

import { WarningCircle } from '@/evo/icons';
import { cn } from '@/evo/lib/cn';

const alertVariants = cva(
    'relative w-full rounded-[var(--evo-radius-standard)] border px-3 py-2.5 text-[13px]',
    {
        variants: {
            variant: {
                default: 'border-[var(--evo-hairline)] bg-[var(--evo-surface)] text-[var(--evo-ink)]',
                destructive: 'border-[var(--evo-danger)] bg-[var(--evo-danger-soft)] text-[var(--evo-danger)]',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

function Alert({
    className,
    variant,
    ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
    return (
        <div
            role="alert"
            data-slot="alert"
            className={cn(alertVariants({ variant }), className)}
            {...props}
        />
    );
}

function AlertTitle({ className, ...props }: React.ComponentProps<'h5'>) {
    return <h5 className={cn('mb-0.5 font-medium leading-none', className)} {...props} />;
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
    return <div className={cn('text-[12px] text-[var(--evo-ink-secondary)] [&_p]:leading-relaxed', className)} {...props} />;
}

function AlertIcon() {
    return <WarningCircle className="mb-1 size-4" aria-hidden />;
}

export { Alert, AlertDescription, AlertIcon, AlertTitle };
