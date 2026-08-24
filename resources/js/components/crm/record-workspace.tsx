import { Form } from '@inertiajs/react';
import type { ReactNode } from 'react';
import TimelineFilter from '@/components/crm/timeline-filter';
import { Button } from '@/components/ui/button';

/** Labeled facts inside the existing HubShell selected pane. */
export function RecordFacts({ children }: { children: ReactNode }) {
    return (
        <section className="grid gap-3 rounded border border-hairline bg-canvas p-3 sm:grid-cols-2 lg:grid-cols-3">
            {children}
        </section>
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
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-mute">Timeline</h3>
            <TimelineFilter timeline={timeline}>
                {(items) =>
                    items.length === 0 ? (
                        <p className="text-sm text-mute">No activity on this record yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {items.map((item) => (
                                <div key={item.id} className="border-l-2 border-brand pl-3">
                                    <p className="text-[11px] uppercase tracking-wide text-mute">{item.type}</p>
                                    <p className="font-medium text-ink">{item.subject ?? item.body}</p>
                                    {item.body && item.subject ? <p className="text-sm text-mute">{item.body}</p> : null}
                                    {item.type === 'task' && !item.done ? (
                                        <Form action={`/crm/activities/${item.id}/complete`} method="post">
                                            <Button variant="secondary" className="mt-1 h-6 text-[11px]">
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
