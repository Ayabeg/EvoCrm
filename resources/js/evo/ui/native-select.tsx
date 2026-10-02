/**
 * Evo Design System — NativeSelect
 * Registry: shadcn/ui — select (native)
 * Source: https://github.com/shadcn-ui/ui
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: 32/36 height; Evo tokens; product NativeSelect API.
 */

import * as React from 'react';

import { cn } from '@/evo/lib/cn';

export type NativeSelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(function NativeSelect(
    { className, ...props },
    ref,
) {
    return (
        <select
            ref={ref}
            data-slot="native-select"
            className={cn(
                'h-9 w-full rounded-[var(--evo-radius-compact)] border border-[var(--evo-hairline-strong)] bg-[var(--evo-surface)] px-3 text-[13px] text-[var(--evo-ink)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--evo-canvas)]',
                'disabled:cursor-not-allowed disabled:opacity-50',
                className,
            )}
            {...props}
        />
    );
});

export { NativeSelect };
export default NativeSelect;
