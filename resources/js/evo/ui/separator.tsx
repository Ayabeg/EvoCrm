/**
 * Evo Design System — Separator
 * Registry: shadcn/ui — separator
 * Source: https://ui.shadcn.com/docs/components/radix/separator
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: --evo-hairline only.
 */

import * as SeparatorPrimitive from '@radix-ui/react-separator';
import * as React from 'react';

import { cn } from '@/evo/lib/cn';

export type SeparatorProps = React.ComponentProps<typeof SeparatorPrimitive.Root>;

function Separator({
    className,
    orientation = 'horizontal',
    decorative = true,
    ...props
}: SeparatorProps) {
    return (
        <SeparatorPrimitive.Root
            data-slot="separator"
            decorative={decorative}
            orientation={orientation}
            className={cn(
                'shrink-0 bg-[var(--evo-hairline)]',
                orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
                className,
            )}
            {...props}
        />
    );
}

export { Separator };
export default Separator;
