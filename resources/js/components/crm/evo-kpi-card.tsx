import type { ReactNode } from 'react';
import { StatCard } from '@/components/ui/aurora/stat-card';
import { cn } from '@/lib/utils';

export function EvoKpiCard({
    label,
    value,
    hint,
    change,
    changeLabel,
    format = 'number',
    icon,
    className,
}: {
    label: string;
    value: number | string | null;
    hint?: string;
    change?: number | null;
    changeLabel?: string;
    format?: 'number' | 'money' | 'percent';
    icon?: ReactNode;
    className?: string;
}) {
    const display =
        value === null || value === undefined
            ? '—'
            : format === 'money' && typeof value === 'number'
              ? new Intl.NumberFormat('fr-DZ', {
                    style: 'currency',
                    currency: 'DZD',
                    maximumFractionDigits: 0,
                }).format(value)
              : format === 'percent' && typeof value === 'number'
                ? `${value}%`
                : typeof value === 'number'
                  ? new Intl.NumberFormat('en-US').format(value)
                  : value;

    const changeDisplay =
        change === null || change === undefined
            ? undefined
            : `${change > 0 ? '+' : ''}${change}%`;

    const trend =
        change === null || change === undefined
            ? undefined
            : change > 0
              ? ('up' as const)
              : change < 0
                ? ('down' as const)
                : ('flat' as const);

    const description = [changeLabel, hint].filter(Boolean).join(' · ') || undefined;

    return (
        <StatCard
            label={label}
            value={<span className="money">{display}</span>}
            delta={changeDisplay}
            trend={trend}
            description={description}
            icon={icon}
            className={cn('h-full @container/kpi', className)}
        />
    );
}
