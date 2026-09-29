type Props = {
    label: string;
    current: string;
    target: string;
    ratio: number;
};

export function ProgressRow({ label, current, target, ratio }: Props) {
    const width = Math.max(0, Math.min(100, Math.round(ratio * 100)));

    return (
        <div>
            <div className="flex items-baseline justify-between gap-3">
                <p className="text-[13px] text-[var(--evo-ink)]">{label}</p>
                <p className="text-[12px] text-[var(--evo-ink-muted)] tabular-nums">
                    {current}
                    <span className="text-[var(--evo-ink-faint)]"> / {target}</span>
                </p>
            </div>
            <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-[var(--evo-hairline)]">
                <div className="h-full bg-[var(--evo-teal)]" style={{ width: `${width}%` }} />
            </div>
        </div>
    );
}
