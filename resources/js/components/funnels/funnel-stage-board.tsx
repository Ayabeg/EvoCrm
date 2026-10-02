export type FunnelStageRow = {
    key: string;
    label: string;
    count: number;
    rate_from_previous: number | null;
    rate_from_top: number | null;
};

function pct(value: number | null): string {
    if (value === null) {
        return '—';
    }

    return `${value}%`;
}

/**
 * HubSpot-style vertical funnel: stage label, relative bar, count + step %.
 */
export function FunnelStageBoard({ stages }: { stages: FunnelStageRow[] }) {
    const top = Math.max(stages[0]?.count ?? 0, 1);

    return (
        <div className="space-y-1.5">
            {stages.map((stage, index) => {
                const width =
                    stage.count > 0 ? Math.max((stage.count / top) * 100, 3) : 0;

                return (
                    <div
                        key={stage.key}
                        className="grid grid-cols-[10rem_minmax(0,1fr)_auto] items-center gap-3"
                    >
                        <div className="truncate text-[12px] text-muted-foreground">
                            {stage.label}
                        </div>
                        <div className="h-5 rounded-sm bg-canvas-soft">
                            {stage.count > 0 ? (
                                <div
                                    className="h-5 rounded-sm bg-brand"
                                    style={{
                                        width: `${Math.min(width, 100)}%`,
                                        opacity: 1 - index * 0.12,
                                    }}
                                />
                            ) : null}
                        </div>
                        <div className="text-end text-[12px] whitespace-nowrap">
                            <span className="money font-medium text-ink">
                                {stage.count.toLocaleString()}
                            </span>{' '}
                            <span className="text-muted-foreground">
                                {index === 0
                                    ? pct(stage.rate_from_top)
                                    : pct(stage.rate_from_previous)}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
