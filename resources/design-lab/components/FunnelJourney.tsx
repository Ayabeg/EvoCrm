import { formatCount, formatRatioPercent } from '../data/format';

type Step = {
    label: string;
    value: number;
};

type Props = {
    steps: Step[];
    footnote?: string;
};

export function FunnelJourney({ steps, footnote }: Props) {
    return (
        <div className="px-5 py-4">
            <ol className="flex flex-col gap-0">
                {steps.map((step, index) => {
                    const previous = steps[index - 1];
                    const rate = previous && previous.value > 0 ? step.value / previous.value : null;

                    return (
                        <li key={step.label}>
                            {previous ? (
                                <p className="py-2 pl-1 text-[12px] text-[var(--evo-ink-muted)]">
                                    ↓ {formatRatioPercent(rate, rate !== null && rate < 0.05 ? 2 : 1)}
                                </p>
                            ) : null}
                            <div className="flex items-baseline justify-between gap-4">
                                <p className="text-[22px] font-semibold tracking-[-0.03em] tabular-nums">
                                    {formatCount(step.value)}
                                </p>
                                <p className="text-[13px] text-[var(--evo-ink-muted)]">{step.label}</p>
                            </div>
                        </li>
                    );
                })}
            </ol>
            {footnote ? (
                <p className="mt-4 border-t border-[var(--evo-hairline)] pt-3 text-[12px] text-[var(--evo-ink-muted)]">
                    {footnote}
                </p>
            ) : null}
        </div>
    );
}
