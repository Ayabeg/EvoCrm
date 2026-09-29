import type { ReactNode } from 'react';

type Props = {
    children: ReactNode;
    loading?: boolean;
    height?: number;
};

export function ChartFrame({ children, loading = false, height = 300 }: Props) {
    return (
        <div className="lab-chart relative px-2 py-2" style={{ height }}>
            <div className="h-full w-full [&_[data-slot=chart]]:!aspect-auto">{children}</div>
            {loading ? (
                <div
                    className="absolute inset-2 animate-pulse bg-[var(--evo-track)]"
                    aria-busy="true"
                    aria-label="Chargement du graphique"
                />
            ) : null}
        </div>
    );
}
