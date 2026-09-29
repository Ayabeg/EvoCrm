import type { ReactNode } from 'react';

type Props = {
    label: string;
    value: string;
    hint?: ReactNode;
};

export function KpiMetric({ label, value, hint }: Props) {
    return (
        <article className="min-w-0">
            <p className="text-[12px] text-[var(--evo-ink-muted)]">{label}</p>
            <p className="mt-1 text-[26px] leading-none font-semibold tracking-[-0.03em] text-[var(--evo-ink)] tabular-nums">
                {value}
            </p>
            {hint ? <p className="mt-2 text-[12px] text-[var(--evo-ink-muted)]">{hint}</p> : null}
        </article>
    );
}

type StripProps = {
    children: ReactNode;
};

export function KpiStrip({ children }: StripProps) {
    return (
        <section className="grid grid-cols-2 gap-x-8 gap-y-6 py-1 md:grid-cols-4 xl:grid-cols-5">
            {children}
        </section>
    );
}
