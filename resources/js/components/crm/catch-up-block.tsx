type CatchUpItem = {
    id: string;
    label: string;
    at?: string | null;
    source?: string;
};

export default function CatchUpBlock({
    inbound = [],
    outbound = [],
}: {
    inbound?: CatchUpItem[];
    outbound?: CatchUpItem[];
}) {
    return (
        <section className="rounded border border-hairline bg-canvas p-3 text-sm">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-mute">Catch-up</h3>
            <div className="grid gap-3 md:grid-cols-2">
                <div>
                    <p className="mb-1 text-[11px] font-medium text-ink">Inbound</p>
                    {inbound.length === 0 ? (
                        <p className="text-[11px] text-mute">No recent inbound activity.</p>
                    ) : (
                        inbound.map((item) => (
                            <p key={item.id} className="truncate text-[12px]">
                                {item.label}
                            </p>
                        ))
                    )}
                </div>
                <div>
                    <p className="mb-1 text-[11px] font-medium text-ink">Outbound</p>
                    {outbound.length === 0 ? (
                        <p className="text-[11px] text-mute">No recent outbound activity.</p>
                    ) : (
                        outbound.map((item) => (
                            <p key={item.id} className="truncate text-[12px]">
                                {item.label}
                            </p>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}
