/**
 * shadcn New York → Aurora variant map.
 *
 * Public product API is `@/components/ui/*`. Aurora implements the controls;
 * this file is the only variant translation. Color comes from the P02
 * semantic tokens in `resources/css/app.css` (`--color-accent`, `--color-bg`, …).
 * Do not add a parallel palette here.
 *
 * Mapped here: Button, Badge. Other primitives re-export Aurora 1:1
 * (Input, Select, Tabs, Dialog, Sheet/Drawer, …) or Sonner for Toast.
 */
import type { BadgeFill, BadgeTone } from '@/components/ui/aurora/badge';
import type { ButtonSize as AuroraButtonSize, ButtonVariant as AuroraButtonVariant } from '@/components/ui/aurora/button';

export type ShadcnButtonVariant =
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | null
    | undefined;

export type ShadcnButtonSize = 'default' | 'sm' | 'lg' | 'icon' | null | undefined;

export function mapButtonVariant(
    variant?: ShadcnButtonVariant,
): { variant: AuroraButtonVariant; filled?: boolean } {
    switch (variant) {
        case 'destructive':
            return { variant: 'destructive', filled: true };
        case 'outline':
            return { variant: 'neutral', filled: false };
        case 'secondary':
            return { variant: 'neutral', filled: false };
        case 'ghost':
            return { variant: 'ghost' };
        case 'link':
            return { variant: 'plain' };
        case 'default':
        default:
            return { variant: 'aurora', filled: true };
    }
}

export function mapButtonSize(size?: ShadcnButtonSize): AuroraButtonSize {
    if (size === 'sm') {
return 'sm';
}

    if (size === 'lg') {
return 'lg';
}

    if (size === 'icon') {
return 'icon';
}

    return 'default';
}

export type ShadcnBadgeVariant =
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | null
    | undefined;

export function mapBadgeVariant(variant?: ShadcnBadgeVariant): {
    tone: BadgeTone;
    fill: BadgeFill;
} {
    switch (variant) {
        case 'secondary':
            return { tone: 'neutral', fill: 'soft' };
        case 'destructive':
            return { tone: 'error', fill: 'soft' };
        case 'outline':
            return { tone: 'neutral', fill: 'outline' };
        case 'default':
        default:
            return { tone: 'neutral', fill: 'soft' };
    }
}
