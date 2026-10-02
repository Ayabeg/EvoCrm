/**
 * Evo Design System — Badge
 * Registry: ReUI — badge + shadcn variant map
 * Source: https://reui.io/components/badge · https://github.com/keenthemes/reui
 * Upstream: https://github.com/keenthemes/reui @ 6e433ddaba3a4be38182c8c8883b6cc335183c42
 * License: MIT (LICENSE.md, verified 2026-10-01) — components only
 * Copied: 2026-10-01
 * Modified: shadcn variant API preserved; Evo tokens; no source identity.
 */

import { Slot } from '@radix-ui/react-slot';
import { cva  } from 'class-variance-authority';
import type {VariantProps} from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/evo/lib/cn';

export type BadgeTone = 'info' | 'success' | 'warn' | 'error' | 'neutral' | 'rose' | 'cyan';
export type BadgeFill = 'soft' | 'solid' | 'outline';

export const badgeVariants = cva(
    'inline-flex items-center gap-1 rounded-[var(--evo-radius-pill)] px-2 py-0.5 text-[11px] font-medium leading-none',
    {
        variants: {
            variant: {
                default: 'bg-[var(--evo-surface-subtle)] text-[var(--evo-ink)]',
                secondary: 'bg-[var(--evo-surface-subtle)] text-[var(--evo-ink-secondary)]',
                destructive: 'bg-[var(--evo-danger-soft)] text-[var(--evo-danger)]',
                outline: 'border border-[var(--evo-hairline)] text-[var(--evo-ink)]',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

const toneClass: Record<BadgeTone, Record<BadgeFill, string>> = {
    info: {
        soft: 'bg-[var(--evo-info-soft)] text-[var(--evo-teal)]',
        solid: 'bg-[var(--evo-teal)] text-white',
        outline: 'border border-[var(--evo-teal)] text-[var(--evo-teal)]',
    },
    success: {
        soft: 'bg-[var(--evo-success-soft)] text-[var(--evo-success)]',
        solid: 'bg-[var(--evo-success)] text-white',
        outline: 'border border-[var(--evo-success)] text-[var(--evo-success)]',
    },
    warn: {
        soft: 'bg-[var(--evo-warning-soft)] text-[var(--evo-warning)]',
        solid: 'bg-[var(--evo-warning)] text-[var(--evo-on-primary)]',
        outline: 'border border-[var(--evo-warning)] text-[var(--evo-warning)]',
    },
    error: {
        soft: 'bg-[var(--evo-danger-soft)] text-[var(--evo-danger)]',
        solid: 'bg-[var(--evo-danger)] text-[var(--evo-on-danger)]',
        outline: 'border border-[var(--evo-danger)] text-[var(--evo-danger)]',
    },
    neutral: {
        soft: 'bg-[var(--evo-surface-subtle)] text-[var(--evo-ink-secondary)]',
        solid: 'bg-[var(--evo-ink)] text-[var(--evo-canvas)]',
        outline: 'border border-[var(--evo-hairline)] text-[var(--evo-ink)]',
    },
    rose: {
        soft: 'bg-[var(--evo-danger-soft)] text-[var(--evo-danger)]',
        solid: 'bg-[var(--evo-danger)] text-[var(--evo-on-danger)]',
        outline: 'border border-[var(--evo-danger)] text-[var(--evo-danger)]',
    },
    cyan: {
        soft: 'bg-[var(--evo-teal-soft)] text-[var(--evo-teal)]',
        solid: 'bg-[var(--evo-teal)] text-white',
        outline: 'border border-[var(--evo-teal)] text-[var(--evo-teal)]',
    },
};

export interface BadgeProps
    extends React.HTMLAttributes<HTMLSpanElement>,
        VariantProps<typeof badgeVariants> {
    asChild?: boolean;
    tone?: BadgeTone;
    fill?: BadgeFill;
}

function Badge({ className, variant, asChild = false, tone, fill = 'soft', ...props }: BadgeProps) {
    const Comp = asChild ? Slot : 'span';

    return (
        <Comp
            data-slot="badge"
            className={cn(
                tone ? ['inline-flex items-center gap-1 rounded-[var(--evo-radius-pill)] px-2 py-0.5 text-[11px] font-medium', toneClass[tone][fill]] : badgeVariants({ variant }),
                className,
            )}
            {...props}
        />
    );
}

export { Badge };
