import type { ReactNode } from 'react';

type Props = {
    title: string;
    hint?: string;
    question?: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
    padded?: boolean;
    flush?: boolean;
};

export function Module({
    title,
    hint,
    question,
    action,
    children,
    className = '',
    padded = false,
    flush = false,
}: Props) {
    const frame = flush
        ? ''
        : padded
            ? 'rounded-[8px] border border-[var(--evo-hairline)] bg-white px-4 py-3'
            : 'rounded-[8px] border border-[var(--evo-hairline)] bg-white';

    return (
        <section className={`min-w-0 ${className}`}>
            <header className="mb-2 flex items-end justify-between gap-3">
                <div className="min-w-0">
                    {question ? (
                        <p className="mb-1 text-[12px] text-[var(--evo-ink-muted)]">{question}</p>
                    ) : null}
                    <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--evo-ink)]">
                        {title}
                    </h2>
                    {hint ? <p className="mt-0.5 text-[12px] text-[var(--evo-ink-muted)]">{hint}</p> : null}
                </div>
                {action}
            </header>
            <div className={frame}>{children}</div>
        </section>
    );
}
