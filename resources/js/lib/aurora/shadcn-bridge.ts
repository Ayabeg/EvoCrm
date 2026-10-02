/**
 * shadcn New York → Evo variant map (PR3).
 *
 * Public product API is `@/components/ui/*` → `ds/components` → `@/evo/ui/*`.
 * Color comes from the P02 semantic tokens in `resources/css/app.css`.
 * Aurora primitives were deleted (AGPL-3.0-only).
 *
 * Mapped here: Button, Badge. Other primitives re-export Evo 1:1
 * or Sonner for Toast.
 */
import type { BadgeFill, BadgeTone } from '@/evo/ui/badge';
import type { ButtonSize as EvoButtonSize, ButtonVariant as EvoButtonVariant } from '@/evo/ui/button';

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
): { variant: EvoButtonVariant; filled?: boolean } {
    switch (variant) {
        case 'destructive':
            return { variant: 'destructive', filled: true };
        case 'outline':
            return { variant: 'outline', filled: false };
        case 'secondary':
            return { variant: 'secondary', filled: false };
        case 'ghost':
            return { variant: 'ghost' };
        case 'link':
            return { variant: 'link' };
        case 'default':
        default:
            return { variant: 'default', filled: true };
    }
}

export function mapButtonSize(size?: ShadcnButtonSize): EvoButtonSize {
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
