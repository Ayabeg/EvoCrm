/**
 * Evo Design System — Status
 * Registry: ReUI — badge (status preset)
 * Source: https://reui.io/components/badge
 * Upstream: https://github.com/keenthemes/reui @ 6e433ddaba3a4be38182c8c8883b6cc335183c42
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: dot + label; never color-only; French default labels.
 */

import * as React from 'react';

import { cn } from '@/evo/lib/cn';
import { Badge  } from '@/evo/ui/badge';
import type {BadgeTone} from '@/evo/ui/badge';

const TONE_LABEL: Record<BadgeTone, string> = {
    info: 'Info',
    success: 'Actif',
    warn: 'Attention',
    error: 'Erreur',
    neutral: 'Neutre',
    rose: 'Critique',
    cyan: 'En cours',
};

export type StatusProps = {
    tone?: BadgeTone;
    label?: string;
    className?: string;
};

function Status({ tone = 'neutral', label, className }: StatusProps) {
    return (
        <Badge tone={tone} fill="soft" className={cn('gap-1.5', className)}>
            <span
                aria-hidden
                className={cn(
                    'size-1.5 rounded-full',
                    tone === 'success' && 'bg-[var(--evo-success)]',
                    tone === 'warn' && 'bg-[var(--evo-warning)]',
                    tone === 'error' && 'bg-[var(--evo-danger)]',
                    tone === 'info' && 'bg-[var(--evo-teal)]',
                    tone === 'cyan' && 'bg-[var(--evo-teal)]',
                    tone === 'rose' && 'bg-[var(--evo-danger)]',
                    tone === 'neutral' && 'bg-[var(--evo-ink-muted)]',
                )}
            />
            {label ?? TONE_LABEL[tone]}
        </Badge>
    );
}

export { Status };
