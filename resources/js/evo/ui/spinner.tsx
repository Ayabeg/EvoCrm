/**
 * Evo Design System — Spinner
 * Registry: shadcn/ui — spinner
 * Source: https://github.com/shadcn-ui/ui
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: Phosphor CircleNotch; French SR.
 */

import * as React from 'react';

import { CircleNotch } from '@/evo/icons';
import { sr } from '@/evo/lib/a11y';
import { cn } from '@/evo/lib/cn';

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
    label?: string;
}

function Spinner({ className, label = sr.loading, ...props }: SpinnerProps) {
    return (
        <span
            role="status"
            data-slot="spinner"
            className={cn('inline-flex items-center justify-center text-[var(--evo-ink-muted)]', className)}
            {...props}
        >
            <CircleNotch className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
            <span className="sr-only">{label}</span>
        </span>
    );
}

export { Spinner };
export default Spinner;
