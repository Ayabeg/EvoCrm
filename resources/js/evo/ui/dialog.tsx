/**
 * Evo Design System — Dialog
 * Registry: shadcn/ui — dialog
 * Source: https://ui.shadcn.com/docs/components/radix/dialog
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: hideClose + size API kept; Phosphor close; Evo tokens; French SR; focus trap via Radix.
 */

import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as React from 'react';

import { X } from '@/evo/icons';
import { sr } from '@/evo/lib/a11y';
import { cn } from '@/evo/lib/cn';
import { MOTION_MODAL_CLASS } from '@/lib/motion';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
    return (
        <DialogPrimitive.Overlay
            data-slot="dialog-overlay"
            className={cn(
                'fixed inset-0 z-[var(--evo-z-overlay)] bg-[color-mix(in_srgb,var(--evo-ink)_40%,transparent)]',
                'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                MOTION_MODAL_CLASS,
                'motion-reduce:animate-none',
                className,
            )}
            {...props}
        />
    );
}

export interface DialogContentProps extends React.ComponentProps<typeof DialogPrimitive.Content> {
    hideClose?: boolean;
    size?: 'sm' | 'default' | 'lg' | 'xl' | 'full';
}

const sizeClasses: Record<NonNullable<DialogContentProps['size']>, string> = {
    sm: 'max-w-[min(24rem,calc(100vw-2rem))]',
    default: 'max-w-[min(32rem,calc(100vw-2rem))]',
    lg: 'max-w-[min(42rem,calc(100vw-2rem))]',
    xl: 'max-w-[min(56rem,calc(100vw-2rem))]',
    full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
};

function DialogContent({
    className,
    children,
    hideClose = false,
    size = 'default',
    ...props
}: DialogContentProps) {
    return (
        <DialogPortal>
            <DialogOverlay />
            <DialogPrimitive.Content
                data-slot="dialog-content"
                className={cn(
                    'fixed left-1/2 top-1/2 z-[var(--evo-z-modal)] flex w-full -translate-x-1/2 -translate-y-1/2 flex-col',
                    'rounded-[var(--evo-radius-floating)] border border-[var(--evo-hairline)] bg-[var(--evo-surface-raised)] text-[var(--evo-ink)] shadow-[var(--evo-shadow-modal)]',
                    'focus-visible:outline-none',
                    MOTION_MODAL_CLASS,
                    'motion-reduce:animate-none',
                    sizeClasses[size],
                    className,
                )}
                {...props}
            >
                {children}
                {hideClose ? null : (
                    <DialogPrimitive.Close
                        className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-[var(--evo-radius-compact)] text-[var(--evo-ink-muted)] hover:bg-[var(--evo-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-focus)]"
                        aria-label={sr.close}
                    >
                        <X className="size-4" aria-hidden />
                    </DialogPrimitive.Close>
                )}
            </DialogPrimitive.Content>
        </DialogPortal>
    );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
    return <div data-slot="dialog-header" className={cn('flex flex-col gap-1.5 px-5 pt-5', className)} {...props} />;
}

function DialogBody({ className, ...props }: React.ComponentProps<'div'>) {
    return <div data-slot="dialog-body" className={cn('px-5 py-3 text-[13px]', className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="dialog-footer"
            className={cn('flex flex-col-reverse gap-2 px-5 pb-5 pt-2 sm:flex-row sm:justify-end', className)}
            {...props}
        />
    );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
    return (
        <DialogPrimitive.Title
            className={cn('text-[16px] font-semibold leading-6 text-[var(--evo-ink)]', className)}
            {...props}
        />
    );
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
    return (
        <DialogPrimitive.Description
            className={cn('text-[13px] text-[var(--evo-ink-secondary)]', className)}
            {...props}
        />
    );
}

export {
    Dialog,
    DialogBody,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
    DialogTrigger,
};
