/**
 * Evo Design System — Avatar
 * Registry: shadcn/ui — avatar
 * Source: https://ui.shadcn.com/docs/components/radix/avatar
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: AvatarGroup + product src/initials/fallback/size=md API kept; Evo tokens.
 */

import * as AvatarPrimitive from '@radix-ui/react-avatar';
import * as React from 'react';

import { cn } from '@/evo/lib/cn';

export type AvatarSize = 'sm' | 'md' | 'default' | 'lg';

export interface AvatarProps extends React.ComponentProps<typeof AvatarPrimitive.Root> {
    size?: AvatarSize;
    src?: string;
    alt?: string;
    initials?: string;
    fallback?: string;
    tone?: string;
    ring?: boolean;
    status?: string;
}

const sizeClass: Record<AvatarSize, string> = {
    sm: 'size-6',
    md: 'size-8',
    default: 'size-8',
    lg: 'size-10',
};

function Avatar({
    className,
    size = 'default',
    src,
    alt = '',
    initials,
    fallback,
    tone,
    ring,
    children,
    ...props
}: AvatarProps) {
    const label = initials ?? fallback;

    return (
        <AvatarPrimitive.Root
            data-slot="avatar"
            className={cn(
                'relative flex shrink-0 overflow-hidden rounded-full bg-[var(--evo-surface-subtle)]',
                sizeClass[size],
                ring && 'ring-2 ring-[var(--evo-hairline)]',
                className,
            )}
            style={tone ? { color: tone, ...props.style } : props.style}
            {...props}
        >
            {src ? <AvatarImage src={src} alt={alt} /> : null}
            {label ? <AvatarFallback>{label}</AvatarFallback> : children}
        </AvatarPrimitive.Root>
    );
}

function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
    return (
        <AvatarPrimitive.Image
            data-slot="avatar-image"
            className={cn('aspect-square size-full object-cover', className)}
            {...props}
        />
    );
}

function AvatarFallback({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
    return (
        <AvatarPrimitive.Fallback
            data-slot="avatar-fallback"
            className={cn(
                'flex size-full items-center justify-center bg-[var(--evo-surface-subtle)] text-[11px] font-medium text-[var(--evo-ink-secondary)]',
                className,
            )}
            {...props}
        />
    );
}

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    max?: number;
}

function AvatarGroup({ className, children, max = 4, ...props }: AvatarGroupProps) {
    const items = React.Children.toArray(children);
    const visible = items.slice(0, max);
    const overflow = items.length - visible.length;

    return (
        <div className={cn('flex items-center -space-x-2', className)} {...props}>
            {visible}
            {overflow > 0 ? (
                <span className="relative z-10 flex size-8 items-center justify-center rounded-full border border-[var(--evo-surface)] bg-[var(--evo-surface-subtle)] text-[11px] text-[var(--evo-ink-secondary)]">
                    +{overflow}
                </span>
            ) : null}
        </div>
    );
}

export { Avatar, AvatarFallback, AvatarGroup, AvatarImage };
