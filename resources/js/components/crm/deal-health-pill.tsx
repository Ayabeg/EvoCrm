export type DealHealthPayload = {
    score: number;
    band?: string;
    label?: string;
    reason?: string;
};

export default function DealHealthPill({ health }: { health?: DealHealthPayload | null }) {
    if (!health) {
        return null;
    }

    const strong = health.band === 'healthy';

    return (
        <section data-testid="deal-health" className="flex flex-wrap items-center gap-2 text-sm">
            <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                    strong
                        ? 'border-brand bg-brand text-canvas'
                        : 'border-hairline bg-canvas text-ink'
                }`}
            >
                <span>Deal health</span>
                <span className="tabular-nums">{health.score}</span>
                {health.label ? <span>{health.label}</span> : null}
            </span>
            <p className="text-[12px] text-ink">{health.reason}</p>
        </section>
    );
}
