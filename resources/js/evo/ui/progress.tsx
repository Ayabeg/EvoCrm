/**
 * Evo Design System — Progress
 * Registry: shadcn/ui — progress
 * Source: https://ui.shadcn.com/docs/components/radix/progress
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: per-package @radix-ui/react-progress; teal fill; French value text.
 */

import * as ProgressPrimitive from '@radix-ui/react-progress';
import * as React from 'react';

import { cn } from '@/evo/lib/cn';

function Progress({
    className,
    value = 0,
    ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
    const pct = Math.min(100, Math.max(0, value ?? 0));

    return (
        <ProgressPrimitive.Root
            data-slot="progress"
            value={pct}
            className={cn('relative h-1.5 w-full overflow-hidden rounded-full bg-[var(--evo-track)]', className)}
            {...props}
        >
            <ProgressPrimitive.Indicator
                className="h-full bg-[var(--evo-teal)] transition-transform duration-[var(--evo-duration-normal)] ease-[var(--evo-ease)] motion-reduce:transition-none"
                style={{ transform: `translateX(-${100 - pct}%)` }}
            />
        </ProgressPrimitive.Root>
    );
}

export { Progress };
