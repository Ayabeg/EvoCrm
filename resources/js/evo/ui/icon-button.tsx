/**
 * Evo Design System — IconButton
 * Registry: shadcn/ui — button (icon size)
 * Source: https://ui.shadcn.com/docs/components/radix/button
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: requires accessible name; 32/36 sizes; Evo tokens.
 */

import * as React from 'react';

import { Button  } from '@/evo/ui/button';
import type {ButtonProps} from '@/evo/ui/button';

export type IconButtonProps = Omit<ButtonProps, 'size'> & {
    label: string;
    size?: 'sm' | 'default';
};

function IconButton({ label, size = 'default', children, ...props }: IconButtonProps) {
    return (
        <Button size={size === 'sm' ? 'sm' : 'icon'} aria-label={label} title={props.title ?? label} {...props}>
            {children}
        </Button>
    );
}

export { IconButton };
