/**
 * Evo Design System — Breadcrumb
 * Registry: shadcn/ui — breadcrumb
 * Source: https://ui.shadcn.com/docs/components/radix/breadcrumb
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: Phosphor separators; French nav label.
 */

import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';

import { CaretRight } from '@/evo/icons';
import { cn } from '@/evo/lib/cn';

function Breadcrumb({ className, ...props }: React.ComponentProps<'nav'>) {
    return <nav aria-label="Fil d'Ariane" className={className} {...props} />;
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<'ol'>) {
    return (
        <ol
            className={cn('flex flex-wrap items-center gap-1.5 text-[12px] text-[var(--evo-ink-secondary)]', className)}
            {...props}
        />
    );
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<'li'>) {
    return <li className={cn('inline-flex items-center gap-1.5', className)} {...props} />;
}

function BreadcrumbLink({
    asChild,
    className,
    ...props
}: React.ComponentProps<'a'> & { asChild?: boolean }) {
    const Comp = asChild ? Slot : 'a';

    return <Comp className={cn('hover:text-[var(--evo-ink)]', className)} {...props} />;
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<'span'>) {
    return <span aria-current="page" className={cn('font-medium text-[var(--evo-ink)]', className)} {...props} />;
}

function BreadcrumbSeparator({ children, className, ...props }: React.ComponentProps<'li'>) {
    return (
        <li role="presentation" aria-hidden className={cn('[&>svg]:size-3', className)} {...props}>
            {children ?? <CaretRight />}
        </li>
    );
}

function BreadcrumbEllipsis({ className, ...props }: React.ComponentProps<'span'>) {
    return (
        <span className={cn('px-1', className)} {...props}>
            …
        </span>
    );
}

export {
    Breadcrumb,
    BreadcrumbEllipsis,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
};
