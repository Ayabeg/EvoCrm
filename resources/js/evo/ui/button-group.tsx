/**
 * Evo Design System — ButtonGroup
 * Registry: shadcn/ui — button-group
 * Source: https://ui.shadcn.com/docs/components/radix/button-group
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: Evo tokens; joined 32/36 controls.
 */

import * as React from 'react';

import { cn } from '@/evo/lib/cn';
import { Separator } from '@/evo/ui/separator';

function ButtonGroup({
    className,
    orientation = 'horizontal',
    ...props
}: React.ComponentProps<'div'> & { orientation?: 'horizontal' | 'vertical' }) {
    return (
        <div
            role="group"
            data-slot="button-group"
            data-orientation={orientation}
            className={cn(
                'inline-flex items-stretch',
                orientation === 'vertical' ? 'flex-col' : 'flex-row',
                '[&_[data-slot=button]]:rounded-none [&_[data-slot=button]:first-child]:rounded-l-[var(--evo-radius-compact)] [&_[data-slot=button]:last-child]:rounded-r-[var(--evo-radius-compact)]',
                orientation === 'vertical' &&
                    '[&_[data-slot=button]:first-child]:rounded-t-[var(--evo-radius-compact)] [&_[data-slot=button]:first-child]:rounded-l-none [&_[data-slot=button]:last-child]:rounded-b-[var(--evo-radius-compact)] [&_[data-slot=button]:last-child]:rounded-r-none',
                className,
            )}
            {...props}
        />
    );
}

function ButtonGroupSeparator({
    className,
    orientation = 'vertical',
    ...props
}: React.ComponentProps<typeof Separator>) {
    return (
        <Separator
            orientation={orientation}
            className={cn('bg-[var(--evo-hairline)]', className)}
            {...props}
        />
    );
}

export { ButtonGroup, ButtonGroupSeparator };
