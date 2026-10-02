/**
 * Evo Design System — SplitButton
 * Registry: shadcn/ui — button-group
 * Source: https://ui.shadcn.com/docs/components/radix/button-group
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: primary + menu chevron; Evo tokens; Phosphor caret.
 */

import * as React from 'react';

import { CaretDown } from '@/evo/icons';
import { sr } from '@/evo/lib/a11y';
import { Button  } from '@/evo/ui/button';
import type {ButtonProps} from '@/evo/ui/button';
import { ButtonGroup } from '@/evo/ui/button-group';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/evo/ui/dropdown-menu';

export type SplitButtonProps = {
    children: React.ReactNode;
    menu: React.ReactNode;
    variant?: ButtonProps['variant'];
    disabled?: boolean;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    menuLabel?: string;
};

function SplitButton({
    children,
    menu,
    variant = 'default',
    disabled,
    onClick,
    menuLabel = sr.openMenu,
}: SplitButtonProps) {
    return (
        <ButtonGroup>
            <Button variant={variant} disabled={disabled} onClick={onClick} className="rounded-e-none">
                {children}
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant={variant}
                        disabled={disabled}
                        aria-label={menuLabel}
                        className="rounded-s-none border-s-0 px-2"
                    >
                        <CaretDown className="size-3.5" aria-hidden />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">{menu}</DropdownMenuContent>
            </DropdownMenu>
        </ButtonGroup>
    );
}

export { SplitButton };
