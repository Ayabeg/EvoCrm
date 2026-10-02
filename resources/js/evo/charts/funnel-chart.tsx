/**
 * Evo Design System — FunnelChart
 * Generic step funnel (not Recharts Funnel — keeps widths readable).
 * License: MIT (original Evo)
 */

import { cn } from '@/evo/lib/cn';
import { formatNumber } from '@/evo/lib/format';

export type FunnelStep = {
    id: string;
    label: string;
    value: number;
    hint?: string;
};

export type FunnelChartProps = {
    steps: FunnelStep[];
    compact?: boolean;
    className?: string;
};

function pct(part: number, whole: number): string {
    if (whole <= 0) {
        return '—';
    }

    return `${Math.round((part / whole) * 100)}\u00A0%`;
}

export function FunnelChart({ steps, compact = false, className }: FunnelChartProps) {
    const top = Math.max(steps[0]?.value ?? 0, 1);

    return (
        <div
            data-slot="funnel-chart"
            className={cn(compact ? 'space-y-1' : 'space-y-1.5', className)}
        >
            {steps.map((step, index) => {
                const width = step.value > 0 ? Math.max((step.value / top) * 100, 3) : 0;
                const previous = index > 0 ? steps[index - 1]?.value ?? 0 : null;
                const opacity = 1 - index * 0.12;

                return (
                    <div
                        key={step.id}
                        className="grid grid-cols-[9.5rem_minmax(0,1fr)_auto] items-center gap-2"
                    >
                        <div
                            className="truncate text-[11px] text-[var(--evo-ink-secondary)]"
                            title={step.hint ?? step.label}
                        >
                            {step.label}
                        </div>
                        <div className="h-4 rounded-[var(--evo-radius-compact)] bg-[var(--evo-surface-subtle)]">
                            {step.value > 0 ? (
                                <div
                                    className="h-4 rounded-[var(--evo-radius-compact)] bg-[var(--evo-teal)]"
                                    style={{ width: `${Math.min(width, 100)}%`, opacity }}
                                />
                            ) : null}
                        </div>
                        <div className="text-right text-[11px] whitespace-nowrap tabular-nums">
                            <span className="font-medium text-[var(--evo-ink)]">
                                {formatNumber(step.value)}
                            </span>{' '}
                            <span className="text-[var(--evo-ink-muted)]">
                                {previous === null ? '' : pct(step.value, previous)}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
