import { cn } from '@/lib/utils';

export function EvoKpiCard({
    label,
    value,
    hint,
    change,
    changeLabel,
    format = 'number',
    className,
}: {
    label: string;
    value: number | string | null;
    hint?: string;
    change?: number | null;
    changeLabel?: string;
    format?: 'number' | 'money' | 'percent';
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
            ? null
            : `${change > 0 ? '+' : ''}${change}%`;

    return (
        <section
            className={cn(
                'relative overflow-hidden rounded-lg border border-hairline bg-canvas p-4 transition-colors',
                className,
            )}
        >
            <div
                className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full opacity-[0.06]"
                style={{
                    background:
                        'radial-gradient(circle, var(--evosales-mark) 0%, transparent 70%)',
                }}
                aria-hidden
            />
            <p className="text-section-label uppercase tracking-wide text-muted-foreground">
                {label}
            </p>
            <p className="money text-kpi mt-2 font-semibold tracking-tight text-ink">
                {display}
            </p>
            {changeDisplay ? (
                <p className="mt-1 flex items-center gap-1.5 text-ui text-muted-foreground">
                    <span
                        className={
                            change !== undefined && change > 0
                                ? 'text-brand'
                                : change !== undefined && change < 0
                                  ? 'text-ink'
                                  : undefined
                        }
                        aria-hidden
                    >
                        {change !== undefined && change > 0
                            ? '↑'
                            : change !== undefined && change < 0
                              ? '↓'
                              : '→'}
                    </span>
                    <span>{changeDisplay}</span>
                    {changeLabel ? (
                        <span className="text-muted-foreground">
                            {changeLabel}
                        </span>
                    ) : null}
                </p>
            ) : null}
            {hint ? (
                <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
                    {hint}
                </p>
            ) : null}
        </section>
    );
}
