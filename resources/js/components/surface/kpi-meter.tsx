export function KpiMeter({
    items,
}: {
    items: { label: string; value: string }[];
}) {
    return (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-hairline bg-canvas px-4 py-3">
            {items.map((item) => (
                <div key={item.label} className="flex items-baseline gap-2">
                    <span className="aurora-text-eyebrow text-mute">
                        {item.label}
                    </span>
                    <span className="aurora-text-body-sm money font-semibold tabular-nums text-ink">
                        {item.value}
                    </span>
                </div>
            ))}
        </div>
    );
}
