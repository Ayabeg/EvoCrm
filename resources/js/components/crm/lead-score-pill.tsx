export type LeadScorePayload = {
    score: number;
    fit?: number;
    intent?: number;
    timing?: number;
    reason?: string | null;
    breakdown?: { pillar: string; key: string; label: string; points: number }[];
};

export default function LeadScorePill({
    score,
    compact = false,
}: {
    score?: LeadScorePayload | null;
    compact?: boolean;
}) {
    if (!score) {
        return null;
    }

    return (
        <section
            data-testid="lead-score"
            className={
                compact
                    ? 'mt-1.5 min-w-0'
                    : 'flex flex-col gap-1 text-sm'
            }
        >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-canvas px-2 py-0.5 text-[11px] font-medium text-ink">
                <span>Score</span>
                <span className="tabular-nums">{score.score}</span>
                {score.fit !== undefined ? (
                    <span className="tabular-nums opacity-80">
                        {score.fit}/{score.intent}/{score.timing}
                    </span>
                ) : null}
            </span>
            {score.reason ? (
                <p
                    className={
                        compact
                            ? 'mt-1 truncate text-xs text-mute'
                            : 'text-[12px] text-ink'
                    }
                    title={score.reason}
                >
                    {score.reason}
                </p>
            ) : null}
        </section>
    );
}
