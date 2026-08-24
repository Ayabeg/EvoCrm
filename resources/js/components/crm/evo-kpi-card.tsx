import { cn } from '@/lib/utils';

export function EvoKpiCard({
    label,
    value,
    hint,
    format = 'number',
    className,
}: {
    label: string;
    value: number | string | null;
    hint?: string;
    format?: 'number' | 'money';
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
              : value;

    return (
        <section
            className={cn(
                'rounded-md border border-hairline bg-canvas p-4 transition-colors hover:border-brand/40',
                className,
            )}
        >
            <p className="text-section-label text-muted-foreground">{label}</p>
            <p className="money text-kpi mt-2 font-semibold tracking-tight">{display}</p>
            {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
        </section>
    );
}
