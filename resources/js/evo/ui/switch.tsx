/**
 * Evo Design System — Switch
 * Registry: shadcn/ui — switch
 * Source: https://github.com/shadcn-ui/ui
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: teal on-state; Evo tokens; sm/default/lg.
 */

import * as SwitchPrimitive from '@radix-ui/react-switch';
import * as React from 'react';

import { cn } from '@/evo/lib/cn';

export interface SwitchProps extends React.ComponentProps<typeof SwitchPrimitive.Root> {
    size?: 'sm' | 'default' | 'lg';
}

function Switch({ className, size = 'default', ...props }: SwitchProps) {
    return (
        <SwitchPrimitive.Root
            data-slot="switch"
            className={cn(
                'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border border-transparent',
                'bg-[var(--evo-track)] transition-colors duration-[var(--evo-duration-micro)] ease-[var(--evo-ease)]',
                'data-[state=checked]:bg-[var(--evo-teal)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--evo-canvas)]',
                'disabled:cursor-not-allowed disabled:opacity-50',
                size === 'sm' && 'h-4 w-7',
                size === 'default' && 'h-5 w-9',
                size === 'lg' && 'h-6 w-11',
                className,
            )}
            {...props}
        >
            <SwitchPrimitive.Thumb
                className={cn(
                    'pointer-events-none block rounded-full bg-[var(--evo-surface)] shadow-[var(--evo-shadow-pill)]',
                    'transition-transform duration-[var(--evo-duration-micro)] ease-[var(--evo-ease)]',
                    'motion-reduce:transition-none',
                    size === 'sm' && 'size-3 data-[state=checked]:translate-x-3',
                    size === 'default' && 'size-4 data-[state=checked]:translate-x-4',
                    size === 'lg' && 'size-5 data-[state=checked]:translate-x-5',
                    'translate-x-0.5',
                )}
            />
        </SwitchPrimitive.Root>
    );
}

export { Switch };
export default Switch;
