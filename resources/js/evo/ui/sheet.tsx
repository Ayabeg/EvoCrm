/**
 * Evo Design System — Sheet
 * Registry: shadcn/ui — sheet
 * Source: https://ui.shadcn.com/docs/components/radix/sheet
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: Radix dialog (no vaul); side=bottom drawer; Phosphor close; Evo tokens.
 */

import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as React from 'react';

import { X } from '@/evo/icons';
import { sr } from '@/evo/lib/a11y';
import { cn } from '@/evo/lib/cn';
import { MOTION_DRAWER_CLASS } from '@/lib/motion';

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

function SheetOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
    return (
        <DialogPrimitive.Overlay
            className={cn(
                'fixed inset-0 z-[var(--evo-z-overlay)] bg-[color-mix(in_srgb,var(--evo-ink)_40%,transparent)]',
                MOTION_DRAWER_CLASS,
                'motion-reduce:animate-none',
                className,
            )}
            {...props}
        />
    );
}

export interface SheetContentProps extends React.ComponentProps<typeof DialogPrimitive.Content> {
    side?: 'top' | 'right' | 'bottom' | 'left';
    hideClose?: boolean;
    overlayStyle?: React.CSSProperties;
    overlayClassName?: string;
}

function SheetContent({
    className,
    children,
    side = 'right',
    hideClose = false,
    overlayStyle,
    overlayClassName,
    ...props
}: SheetContentProps) {
    return (
        <SheetPortal>
            <SheetOverlay className={overlayClassName} style={overlayStyle} />
            <DialogPrimitive.Content
                data-slot="sheet-content"
                data-side={side}
                className={cn(
                    'fixed z-[var(--evo-z-modal)] flex flex-col bg-[var(--evo-surface-raised)] text-[var(--evo-ink)] shadow-[var(--evo-shadow-modal)]',
                    'border-[var(--evo-hairline)] focus-visible:outline-none',
                    MOTION_DRAWER_CLASS,
                    'motion-reduce:animate-none',
                    side === 'right' && 'inset-y-0 end-0 h-full w-full border-s sm:max-w-md',
                    side === 'left' && 'inset-y-0 start-0 h-full w-full border-e sm:max-w-md',
                    side === 'top' && 'inset-x-0 top-0 border-b',
                    side === 'bottom' && 'inset-x-0 bottom-0 border-t',
                    className,
                )}
                {...props}
            >
                {children}
                {hideClose ? null : (
                    <DialogPrimitive.Close
                        className="absolute end-3 top-3 inline-flex size-8 items-center justify-center rounded-[var(--evo-radius-compact)] text-[var(--evo-ink-muted)] hover:bg-[var(--evo-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-focus)]"
                        aria-label={sr.close}
                    >
                        <X className="size-4" aria-hidden />
                    </DialogPrimitive.Close>
                )}
            </DialogPrimitive.Content>
        </SheetPortal>
    );
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
    return <div className={cn('flex flex-col gap-1.5 px-5 pt-5', className)} {...props} />;
}

function SheetBody({ className, ...props }: React.ComponentProps<'div'>) {
    return <div className={cn('flex-1 overflow-auto px-5 py-3', className)} {...props} />;
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
    return <div className={cn('flex flex-col gap-2 px-5 pb-5', className)} {...props} />;
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
    return <DialogPrimitive.Title className={cn('text-[16px] font-semibold', className)} {...props} />;
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
    return (
        <DialogPrimitive.Description className={cn('text-[13px] text-[var(--evo-ink-secondary)]', className)} {...props} />
    );
}

export {
    Sheet,
    SheetBody,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
};
