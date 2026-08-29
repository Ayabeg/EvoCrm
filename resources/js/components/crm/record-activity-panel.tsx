import { Form, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import CatchUpBlock from '@/components/crm/catch-up-block';
import type { CatchUpItem } from '@/components/crm/catch-up-block';
import type { RecordActivity } from '@/components/crm/record-activity';
import {
    deriveRecordNext,
    filterRecordActivity,
    hasCatchUpItems,
    RECORD_ACTIVITY_TABS,
} from '@/components/crm/record-activity';
import { ActivityTabs } from '@/components/crm/record-chrome';
import {
    RecordNextAction,
    RecordTimelineItem,
} from '@/components/crm/record-hub';
import { Button } from '@/components/ui/button';

export default function RecordActivityPanel({
    timeline,
    catchUp,
    dealNext,
}: {
    timeline: RecordActivity[];
    catchUp?: { inbound?: CatchUpItem[]; outbound?: CatchUpItem[] } | null;
    dealNext?: string | null;
}) {
    const [tab, setTab] = useState('activity');
    const items = useMemo(
        () => filterRecordActivity(timeline, tab),
        [tab, timeline],
    );
    const next = deriveRecordNext({ catchUp, timeline, dealNext });
    const showCatchUp = hasCatchUpItems(catchUp);

    return (
        <div className="space-y-4">
            {next ? (
                <RecordNextAction
                    title={next.title}
                    detail={next.detail}
                    action={
                        next.taskId ? (
                            <Form
                                action={`/crm/activities/${next.taskId}/complete`}
                                method="post"
                                options={{ preserveScroll: true }}
                            >
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-[11px]"
                                >
                                    Mark done
                                </Button>
                            </Form>
                        ) : next.href ? (
                            <Link
                                href={next.href}
                                className="shrink-0 text-[12px] font-medium text-ink hover:underline"
                            >
                                Open
                            </Link>
                        ) : null
                    }
                />
            ) : null}
            {showCatchUp && catchUp ? (
                <CatchUpBlock
                    inbound={catchUp.inbound}
                    outbound={catchUp.outbound}
                    compact
                />
            ) : null}
            <ActivityTabs
                tabs={[...RECORD_ACTIVITY_TABS]}
                active={tab}
                onChange={setTab}
            />
            <div>
                {items.length === 0 ? (
                    <p className="py-2 text-[13px] text-mute">
                        {tab === 'activity'
                            ? 'No activity yet.'
                            : `No ${tab} yet.`}
                    </p>
                ) : (
                    items.map((item) => (
                        <RecordTimelineItem
                            key={item.id}
                            type={item.type}
                            title={item.subject ?? item.body}
                            at={item.created_at}
                            author={
                                item.actor?.name ?? item.owner?.name ?? null
                            }
                        >
                            {item.body && item.subject ? (
                                <p className="mt-0.5 text-[13px] text-mute">
                                    {item.body}
                                </p>
                            ) : null}
                            {item.type === 'task' && !item.done ? (
                                <Form
                                    action={`/crm/activities/${item.id}/complete`}
                                    method="post"
                                    options={{ preserveScroll: true }}
                                >
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="mt-1.5 h-7 text-[11px]"
                                    >
                                        Mark done
                                    </Button>
                                </Form>
                            ) : null}
                        </RecordTimelineItem>
                    ))
                )}
            </div>
        </div>
    );
}
