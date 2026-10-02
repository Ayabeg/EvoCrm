/**
 * Evo Design System — ChartTooltip
 * Registry: evilcharts — recharts-tooltip (wrapper)
 * Source: https://github.com/legions-developer/evilcharts
 * License: MIT
 * Copied: 2026-10-02
 * Modified: Recharts Tooltip with Evo surface; no hex.
 */

import type { ReactNode } from 'react';
import { Tooltip as RechartsTooltip } from 'recharts';
import type { TooltipProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

import { cn } from '@/evo/lib/cn';

export type ChartTooltipProps = TooltipProps<ValueType, NameType>;

export function ChartTooltip(props: ChartTooltipProps) {
    return (
        <RechartsTooltip
            cursor={{ stroke: 'var(--evo-hairline)', strokeDasharray: '3 3' }}
            contentStyle={{
                background: 'var(--evo-surface-raised)',
                border: '1px solid var(--evo-hairline)',
                borderRadius: 'var(--evo-radius-compact)',
                color: 'var(--evo-ink)',
                fontSize: 12,
                boxShadow: 'var(--evo-shadow-floating)',
            }}
            labelStyle={{ color: 'var(--evo-ink-secondary)', fontSize: 11 }}
            itemStyle={{ color: 'var(--evo-ink)' }}
            {...props}
        />
    );
}

export function ChartTooltipCard({
    className,
    children,
}: {
    className?: string;
    children: ReactNode;
}) {
    return (
        <div
            className={cn(
                'rounded-[var(--evo-radius-compact)] border border-[var(--evo-hairline)] bg-[var(--evo-surface-raised)] px-2.5 py-2 text-[12px] text-[var(--evo-ink)] shadow-[var(--evo-shadow-floating)]',
                className,
            )}
        >
            {children}
        </div>
    );
}
