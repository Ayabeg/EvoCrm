/**
 * Evo Design System — ErrorState
 * Registry: shadcn/ui — empty (error preset)
 * Source: https://ui.shadcn.com/docs/components/radix/empty
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: French defaults; retry action; Evo danger tokens.
 */

import * as React from 'react';

import { WarningCircle } from '@/evo/icons';
import { EmptyState  } from '@/evo/patterns/empty-state';
import type {EmptyStateProps} from '@/evo/patterns/empty-state';
import { Button } from '@/evo/ui/button';

export type ErrorStateProps = Omit<EmptyStateProps, 'title'> & {
    title?: string;
    onRetry?: () => void;
    retryLabel?: string;
};

export function ErrorState({
    title = 'Impossible de charger les données',
    description = 'Une erreur s’est produite. Réessayez ou contactez le support.',
    onRetry,
    retryLabel = 'Réessayer',
    action,
    ...props
}: ErrorStateProps) {
    return (
        <EmptyState
            title={title}
            description={description}
            icon={<WarningCircle className="size-8 text-[var(--evo-danger)]" aria-hidden />}
            action={
                action ??
                (onRetry ? (
                    <Button variant="outline" onClick={onRetry}>
                        {retryLabel}
                    </Button>
                ) : null)
            }
            {...props}
        />
    );
}
