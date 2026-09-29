type Props = {
    label: string;
    value: string;
    hint?: string;
};

export function KpiCard({ label, value, hint }: Props) {
    return (
        <article className="min-w-0 border-r border-[var(--evo-border)] px-4 py-3 last:border-r-0">
            <p className="text-[11px] font-medium tracking-wide text-[var(--evo-ink-muted)]">
                {label}
            </p>
            <p className="mt-1 break-words text-[20px] leading-[26px] font-semibold text-[var(--evo-ink)] tabular-nums">
                {value}
            </p>
            {hint ? (
                <p className="mt-1 text-[12px] text-[var(--evo-ink-faint)]">{hint}</p>
            ) : null}
        </article>
    );
}
