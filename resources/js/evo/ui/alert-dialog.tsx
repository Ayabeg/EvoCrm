/**
 * Evo Design System — AlertDialog
 * Registry: shadcn/ui — alert-dialog
 * Source: https://ui.shadcn.com/docs/components/radix/alert-dialog
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: per-package @radix-ui/react-alert-dialog; Evo tokens; French defaults.
 */

import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import * as React from 'react';

import { cn } from '@/evo/lib/cn';
import { buttonVariants } from '@/evo/ui/button';
import { MOTION_MODAL_CLASS } from '@/lib/motion';

const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
const AlertDialogPortal = AlertDialogPrimitive.Portal;

function AlertDialogOverlay({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
    return (
        <AlertDialogPrimitive.Overlay
            className={cn(
                'fixed inset-0 z-[var(--evo-z-overlay)] bg-[color-mix(in_srgb,var(--evo-ink)_40%,transparent)]',
                MOTION_MODAL_CLASS,
                className,
            )}
            {...props}
        />
    );
}

function AlertDialogContent({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
    return (
        <AlertDialogPortal>
            <AlertDialogOverlay />
            <AlertDialogPrimitive.Content
                className={cn(
                    'fixed left-1/2 top-1/2 z-[var(--evo-z-modal)] w-full max-w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2',
                    'rounded-[var(--evo-radius-floating)] border border-[var(--evo-hairline)] bg-[var(--evo-surface-raised)] p-5 shadow-[var(--evo-shadow-modal)]',
                    MOTION_MODAL_CLASS,
                    className,
                )}
                {...props}
            />
        </AlertDialogPortal>
    );
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
    return <div className={cn('flex flex-col gap-1.5', className)} {...props} />;
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
    return <div className={cn('mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />;
}

function AlertDialogTitle({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
    return <AlertDialogPrimitive.Title className={cn('text-[16px] font-semibold', className)} {...props} />;
}

function AlertDialogDescription({
    className,
    ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
    return (
        <AlertDialogPrimitive.Description
            className={cn('text-[13px] text-[var(--evo-ink-secondary)]', className)}
            {...props}
        />
    );
}

function AlertDialogAction({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
    return <AlertDialogPrimitive.Action className={cn(buttonVariants({ variant: 'destructive' }), className)} {...props} />;
}

function AlertDialogCancel({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
    return <AlertDialogPrimitive.Cancel className={cn(buttonVariants({ variant: 'outline' }), className)} {...props} />;
}

export {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    AlertDialogPortal,
    AlertDialogTitle,
    AlertDialogTrigger,
};
