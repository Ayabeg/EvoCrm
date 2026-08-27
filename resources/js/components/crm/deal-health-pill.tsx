export type DealHealthPayload = {
    score: number;
    band?: string;
    label?: string;
    reason?: string;
};

function bandClass(band?: string): string {
    if (band === 'healthy') {
        return 'border-brand bg-brand text-canvas';
    }

    if (band === 'stalled' || band === 'risk') {
        return 'border-hairline bg-canvas text-ink';
    }

    return 'border-hairline bg-canvas text-ink';
}

export default function DealHealthPill({
    health,
}: {
    health?: DealHealthPayload | null;
}) {
    if (!health) {
        return null;
    }

    return (
        <section
            data-testid="deal-health"
            className="flex flex-wrap items-center gap-2 text-sm"
        >
            <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${bandClass(health.band)}`}
            >
                <span>Deal health</span>
                <span className="tabular-nums">{health.score}</span>
                {health.label ? <span>{health.label}</span> : null}
            </span>
            <p className="text-[12px] text-ink">{health.reason}</p>
        </section>
    );
}
