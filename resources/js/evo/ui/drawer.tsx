/**
 * Evo Design System — Drawer (Sheet alias, no vaul)
 * Registry: shadcn/ui — sheet
 * Source: https://ui.shadcn.com/docs/components/radix/sheet
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: default side=right; product Drawer* aliases preserved.
 */

import type { ComponentProps } from 'react';

import {
    Sheet,
    SheetBody,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger
    
} from '@/evo/ui/sheet';
import type {SheetContentProps} from '@/evo/ui/sheet';

function DrawerContent({ side = 'right', ...props }: SheetContentProps) {
    return <SheetContent side={side} {...props} />;
}

export {
    Sheet as Drawer,
    SheetBody as DrawerBody,
    SheetClose as DrawerClose,
    DrawerContent,
    SheetDescription as DrawerDescription,
    SheetFooter as DrawerFooter,
    SheetHeader as DrawerHeader,
    SheetTitle as DrawerTitle,
    SheetTrigger as DrawerTrigger,
    type SheetContentProps as DrawerContentProps,
};

export type { ComponentProps };
