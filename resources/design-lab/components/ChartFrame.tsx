import type { ReactNode } from 'react';

type Props = {
    title: string;
    children: ReactNode;
    loading?: boolean;
    hint?: string;
};

export function ChartFrame({ title, children, loading = false, hint }: Props) {
    return (
        <section className="min-w-0 border border-[var(--evo-border)] bg-[var(--evo-surface)]">
            <header className="flex items-end justify-between gap-3 border-b border-[var(--evo-border-subtle)] px-4 py-3">
                <h2 className="text-[15px] font-semibold text-[var(--evo-ink)]">{title}</h2>
                {hint ? (
                    <p className="text-[12px] text-[var(--evo-ink-muted)]">{hint}</p>
                ) : null}
            </header>
            <div className="relative h-[280px] px-2 py-2">
                <div className="h-full w-full [&_[data-slot=chart]]:!aspect-auto">
                    {children}
                </div>
                {loading ? (
                    <div
                        className="absolute inset-2 animate-pulse bg-[var(--evo-track)]"
                        aria-busy="true"
                        aria-label="Chargement du graphique"
                    />
                ) : null}
            </div>
        </section>
    );
}
