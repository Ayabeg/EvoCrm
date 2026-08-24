import { Form } from '@inertiajs/react';
import type { ReactNode } from 'react';
import TimelineFilter from '@/components/crm/timeline-filter';
import { Button } from '@/components/ui/button';

/**
 * Evotechly record workspace — three panes, Aurora 24px rhythm.
 * Not a HubSpot clone: no Breeze, no Deal Score, Evotechly tokens only.
 */
export function RecordWorkspace({
    facts,
    center,
    associations,
}: {
    facts: ReactNode;
    center: ReactNode;
    associations: ReactNode;
}) {
    return (
        <div
            data-evo-record-workspace=""
            className="flex min-h-0 flex-1 flex-col overflow-hidden bg-canvas-soft xl:flex-row"
        >
            <aside className="flex w-full shrink-0 flex-col overflow-y-auto border-b border-hairline bg-canvas xl:w-80 xl:border-b-0 xl:border-r">
                <div className="space-y-6 p-6">{facts}</div>
            </aside>
            <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-canvas">
                <div className="mx-auto w-full max-w-3xl space-y-6 p-6">{center}</div>
            </section>
            <aside className="flex w-full shrink-0 flex-col overflow-y-auto border-t border-hairline bg-canvas xl:w-80 xl:border-t-0 xl:border-l">
                <div className="space-y-6 p-6">{associations}</div>
            </aside>
        </div>
    );
}

export function RecordFact({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-mute">{label}</p>
            <div className="text-sm text-ink">{children ?? '—'}</div>
        </div>
    );
}

type TimelineItem = {
    id: number;
    type: string;
    subject?: string | null;
    body?: string | null;
    done?: boolean;
};

export function RecordTimeline({ timeline = [] }: { timeline?: TimelineItem[] }) {
    return (
        <section>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-mute">Timeline</h3>
            <TimelineFilter timeline={timeline}>
                {(items) =>
                    items.length === 0 ? (
                        <p className="text-sm text-mute">No activity on this record yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div key={item.id} className="border-l-2 border-brand pl-4">
                                    <p className="text-[11px] uppercase tracking-wide text-mute">{item.type}</p>
                                    <p className="font-medium text-ink">{item.subject ?? item.body}</p>
                                    {item.body && item.subject ? <p className="mt-1 text-sm text-mute">{item.body}</p> : null}
                                    {item.type === 'task' && !item.done ? (
                                        <Form action={`/crm/activities/${item.id}/complete`} method="post">
                                            <Button variant="secondary" className="mt-2 h-7 text-[11px]">
                                                Done
                                            </Button>
                                        </Form>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    )
                }
            </TimelineFilter>
        </section>
    );
}
