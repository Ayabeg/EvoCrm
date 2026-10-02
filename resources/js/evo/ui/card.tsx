/**
 * Evo Design System — Card
 * Registry: shadcn/ui — card
 * Source: https://github.com/shadcn-ui/ui
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: Evo surface + hairline; no glass.
 */

import * as React from 'react';

import { cn } from '@/evo/lib/cn';

export type CardAccent = 'cyan' | 'rose';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    interactive?: boolean;
    accent?: CardAccent | false;
    elevated?: boolean;
}

function Card({ className, interactive, accent, elevated, tabIndex, ...props }: CardProps) {
    return (
        <div
            data-slot="card"
            data-elevated={elevated === false ? 'false' : 'true'}
            data-interactive={interactive ? 'true' : undefined}
            data-accent={accent || undefined}
            tabIndex={tabIndex ?? (interactive ? 0 : undefined)}
            className={cn(
                'rounded-[var(--evo-radius-standard)] border border-[var(--evo-hairline)] bg-[var(--evo-surface)] text-[var(--evo-ink)]',
                elevated === false && 'bg-[var(--evo-surface-subtle)]',
                interactive && 'cursor-pointer hover:bg-[var(--evo-hover)]',
                className,
            )}
            {...props}
        />
    );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
    return <div data-slot="card-header" className={cn('flex flex-col gap-1 px-4 pt-4', className)} {...props} />;
}

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
    as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';
}

function CardTitle({ className, as: Tag = 'h3', ...props }: CardTitleProps) {
    return <Tag data-slot="card-title" className={cn('text-[14px] font-medium', className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<'p'>) {
    return (
        <p
            data-slot="card-description"
            className={cn('text-[12px] text-[var(--evo-ink-secondary)]', className)}
            {...props}
        />
    );
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
    return <div data-slot="card-action" className={cn('ms-auto', className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
    return <div data-slot="card-content" className={cn('px-4 py-3', className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
    return <div data-slot="card-footer" className={cn('flex items-center px-4 pb-4', className)} {...props} />;
}

export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
export default Card;
