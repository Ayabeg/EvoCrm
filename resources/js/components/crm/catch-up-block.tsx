import { Link } from '@inertiajs/react';

export type CatchUpItem = {
    id: string;
    label: string;
    at?: string | null;
    source?: string;
    href?: string | null;
};

const ALGIERS = 'Africa/Algiers';

function formatWhen(iso?: string | null): string | null {
    if (!iso) {
        return null;
    }

    try {
        return new Intl.DateTimeFormat('en-GB', {
            timeZone: ALGIERS,
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(iso));
    } catch {
        return null;
    }
}

function CatchUpRow({ item }: { item: CatchUpItem }) {
    const when = formatWhen(item.at);
    const body = (
        <>
            <span className="block truncate text-[13px] text-ink">{item.label}</span>
            {when ? <span className="block text-[11px] text-mute">{when}</span> : null}
        </>
    );

    if (item.href) {
        return (
            <Link href={item.href} className="block rounded-md px-1 py-1.5 hover:bg-canvas-soft">
                {body}
            </Link>
        );
    }

    return <div className="px-1 py-1.5">{body}</div>;
}

export default function CatchUpBlock({
    inbound = [],
    outbound = [],
}: {
    inbound?: CatchUpItem[];
    outbound?: CatchUpItem[];
}) {
    return (
        <section className="rounded-lg border border-hairline bg-canvas p-4 text-sm">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-mute">Catch-up</h3>
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink">Inbound</p>
                    {inbound.length === 0 ? (
                        <p className="text-[13px] text-mute">Nothing inbound to catch up on.</p>
                    ) : (
                        <div className="divide-y divide-hairline">
                            {inbound.map((item) => (
                                <CatchUpRow key={item.id} item={item} />
                            ))}
                        </div>
                    )}
                </div>
                <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink">Outbound</p>
                    {outbound.length === 0 ? (
                        <p className="text-[13px] text-mute">No recent outbound from this record.</p>
                    ) : (
                        <div className="divide-y divide-hairline">
                            {outbound.map((item) => (
                                <CatchUpRow key={item.id} item={item} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
