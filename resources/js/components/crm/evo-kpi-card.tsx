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

    const context = [changeLabel, hint].filter(Boolean).join(' · ');

    return (
        <article
            className={cn(
                'flex h-full min-w-0 flex-col gap-2 rounded-2xl border border-hairline bg-canvas px-4 py-3 md:gap-3 md:px-5 md:py-4',
                className,
            )}
        >
            <p className="text-[11px] leading-4 text-mute">{label}</p>
            <p className="money min-w-0 text-kpi leading-none tracking-tight break-words text-ink">
                {display}
            </p>
            {changeDisplay || context ? (
                <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    {changeDisplay ? (
                        <span className="text-[11px] leading-4 text-mute">
                            {changeDisplay}
                        </span>
                    ) : null}
                    {context ? (
                        <span className="text-[12px] leading-4 text-mute">
                            {context}
                        </span>
                    ) : null}
                </div>
            ) : null}
        </article>
    );
}
