/**
 * Evo Design System — EmptyState
 * Registry: shadcn/ui — empty
 * Source: https://ui.shadcn.com/docs/components/radix/empty
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: product EmptyState API kept; Evo tokens; no Aurora dashed identity.
 */

import * as React from 'react';

import {
    EmptyIllustration,
    inferEmptyKind
    
} from '@/components/ui/empty-illustration';
import type {EmptyKind} from '@/components/ui/empty-illustration';
import { cn } from '@/evo/lib/cn';

export type EmptyStateDensity = 'page' | 'panel' | 'banner';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
    icon?: React.ReactNode;
    illustration?: React.ReactNode;
    kind?: EmptyKind;
    title: string;
    description?: React.ReactNode;
    action?: React.ReactNode;
    density?: EmptyStateDensity;
    as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p';
}

export function EmptyState({
    icon,
    illustration,
    kind,
    title,
    description,
    action,
    className,
    density = 'page',
    as: Heading = 'p',
    ...rest
}: EmptyStateProps) {
    const titleId = React.useId();
    const descriptionId = React.useId();
    const resolvedKind = kind ?? inferEmptyKind(title);
    const art =
        illustration ??
        (icon ? null : (
            <EmptyIllustration kind={resolvedKind} size={density === 'page' ? 'md' : 'sm'} />
        ));
    const banner = density === 'banner';

    return (
        <div
            role="status"
            data-empty-state={density}
            data-slot="empty-state"
            className={cn(
                'text-[var(--evo-ink)]',
                banner
                    ? 'flex items-start gap-3 px-4 py-3 text-left sm:px-6'
                    : 'flex flex-col items-center justify-center text-center',
                density === 'page' && 'gap-4 px-6 py-12',
                density === 'panel' && 'gap-3 px-3 py-4',
                className,
            )}
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            {...rest}
        >
            {art || icon ? (
                <div className={cn(banner ? 'mt-0.5' : 'mb-1')} aria-hidden>
                    {art ?? icon}
                </div>
            ) : null}
            <div className="min-w-0">
                <Heading id={titleId} className="text-[14px] font-medium">
                    {title}
                </Heading>
                {description ? (
                    <div
                        id={descriptionId}
                        className="mt-1 text-[13px] text-[var(--evo-ink-secondary)]"
                    >
                        {description}
                    </div>
                ) : null}
            </div>
            {action ? <div className="mt-2">{action}</div> : null}
        </div>
    );
}

export { EmptyIllustration, inferEmptyKind };
export type { EmptyKind };
