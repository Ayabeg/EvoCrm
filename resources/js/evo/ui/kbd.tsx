/**
 * Evo Design System — Kbd
 * Registry: shadcn/ui — kbd
 * Source: https://ui.shadcn.com/docs/components/radix/kbd
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: Evo tokens; 11px mono.
 */

import * as React from 'react';

import { cn } from '@/evo/lib/cn';

function Kbd({ className, ...props }: React.ComponentProps<'kbd'>) {
    return (
        <kbd
            data-slot="kbd"
            className={cn(
                'inline-flex h-5 min-w-5 items-center justify-center rounded-[6px] border border-[var(--evo-hairline)] bg-[var(--evo-surface-subtle)] px-1 font-mono text-[11px] text-[var(--evo-ink-secondary)]',
                className,
            )}
            {...props}
        />
    );
}

function KbdGroup({ className, ...props }: React.ComponentProps<'span'>) {
    return <span className={cn('inline-flex items-center gap-0.5', className)} {...props} />;
}

export { Kbd, KbdGroup };
