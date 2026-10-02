/**
 * Evo Design System — Skeleton
 * Registry: shadcn/ui — skeleton
 * Source: https://ui.shadcn.com/docs/components/radix/skeleton
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: SkeletonRow kept; reduced-motion kills pulse.
 */

import * as React from 'react';

import { cn } from '@/evo/lib/cn';

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            data-slot="skeleton"
            className={cn(
                'animate-pulse rounded-[var(--evo-radius-compact)] bg-[var(--evo-surface-subtle)] motion-reduce:animate-none',
                className,
            )}
            {...props}
        />
    );
}

export type SkeletonRowProps = React.HTMLAttributes<HTMLDivElement>;

function SkeletonRow({ className, ...rest }: SkeletonRowProps) {
    return <Skeleton className={cn('h-9 w-full', className)} {...rest} />;
}

export { Skeleton, SkeletonRow };
