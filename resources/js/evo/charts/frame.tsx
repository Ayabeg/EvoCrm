/**
 * Evo Design System — ChartFrame
 * Registry: evilcharts — recharts-chart (wrapper, not a copy)
 * Source: https://github.com/legions-developer/evilcharts
 * License: MIT (LICENSE)
 * Copied: 2026-10-02
 * Modified: generic frame for Ads + Reports; --evo-* only; no evilcharts import.
 */

import type { ReactNode } from 'react';

import { cn } from '@/evo/lib/cn';
import { EmptyState } from '@/evo/patterns/empty-state';
import { Skeleton } from '@/evo/ui/skeleton';
import { t } from '@/lib/i18n';

export type ChartFrameProps = {
    children: ReactNode;
    className?: string;
    height?: number;
    loading?: boolean;
    empty?: boolean;
    emptyTitle?: string;
    emptyDescription?: string;
    label?: string;
};

export function ChartFrame({
    children,
    className,
    height = 280,
    loading = false,
    empty = false,
    emptyTitle,
    emptyDescription,
    label,
}: ChartFrameProps) {
    return (
        <div
            data-slot="chart-frame"
            aria-label={label ? t(label) : undefined}
            className={cn('relative w-full min-w-0', className)}
            style={{ height }}
        >
            {loading ? (
                <Skeleton className="h-full w-full" aria-busy="true" />
            ) : empty ? (
                <EmptyState
                    title={emptyTitle ? t(emptyTitle) : ''}
                    description={
                        emptyDescription ? t(emptyDescription) : undefined
                    }
                    density="panel"
                    className="h-full"
                />
            ) : (
                <div className="h-full w-full" dir="ltr" data-chart-plot="ltr">
                    {children}
                </div>
            )}
        </div>
    );
}
