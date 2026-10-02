import { Form, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import ActivityComposer from '@/components/crm/activity-composer';
import type { AskEvoPayload } from '@/components/crm/ask-evo-panel';
import CatchUpBlock from '@/components/crm/catch-up-block';
import type { CatchUpItem } from '@/components/crm/catch-up-block';
import { MeetingAttendanceButtons } from '@/components/crm/meeting-attendance';
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
import { Button } from '@/evo/ui/button';
import { t } from '@/lib/i18n';

const ACTIVITY_CHIPS = [
    { key: 'all', label: 'All' },
    { key: 'call', label: 'Calls' },
    { key: 'email', label: 'Emails' },
    { key: 'task', label: 'Tasks' },
    { key: 'meeting', label: 'Meetings' },
    { key: 'note', label: 'Notes' },
];

export default function RecordActivityPanel({
    timeline,
    catchUp,
    dealNext,
    insight,
    highlights,
    contactId,
    dealId,
    companyId,
}: {
    timeline: RecordActivity[];
    catchUp?: { inbound?: CatchUpItem[]; outbound?: CatchUpItem[] } | null;
    dealNext?: string | null;
    insight?: AskEvoPayload | null;
    highlights?: { label: string; value?: string | null }[];
    contactId?: number | null;
    dealId?: number | null;
    companyId?: number | null;
}) {
    const [tab, setTab] = useState('overview');
    const [chip, setChip] = useState('all');
    const items = useMemo(() => {
        const filtered = filterRecordActivity(timeline, tab);

        if (tab !== 'activities' || chip === 'all') {
            return filtered;
        }

        return filtered.filter((item) => item.type === chip);
    }, [tab, timeline, chip]);
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
                                    {t('Mark done')}
                                </Button>
                            </Form>
                        ) : next.href ? (
                            <Link
                                href={next.href}
                                className="shrink-0 text-[12px] font-medium text-ink hover:underline"
                            >
                                {t('Open')}
                            </Link>
                        ) : null
                    }
                />
            ) : null}
            {showCatchUp && catchUp && tab === 'overview' ? (
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
            {tab === 'intelligence' ? (
                <div className="space-y-2">
                    <p className="text-[13px] text-ink">
                        {insight?.summary ??
                            t('Ask Evo in the right rail. Context is this record, not a generic agent.')}
                    </p>
                    {insight?.answer ? (
                        <p className="text-[13px] text-mute">{insight.answer}</p>
                    ) : (
                        <p className="text-[13px] text-mute">
                            {t('No generated note yet. Use Ask Evo — source chip stays “This record”.')}
                        </p>
                    )}
                </div>
            ) : (
                <div>
                    {tab === 'overview' && highlights && highlights.length > 0 ? (
                        <dl className="mb-3 grid gap-2 sm:grid-cols-2">
                            {highlights
                                .filter((item) => item.value)
                                .map((item) => (
                                    <div key={item.label}>
                                        <dt className="text-[11px] text-mute">
                                            {t(item.label)}
                                        </dt>
                                        <dd className="text-[13px] text-ink">
                                            {item.value}
                                        </dd>
                                    </div>
                                ))}
                        </dl>
                    ) : null}
                    {tab === 'activities' ? (
                        <div className="mb-3 space-y-2">
                            <ActivityComposer
                                contactId={contactId}
                                dealId={dealId}
                                companyId={companyId}
                                emailHref={
                                    contactId
                                        ? `/outbound?contact_id=${contactId}`
                                        : '/outbound'
                                }
                            />
                            <div className="flex flex-wrap gap-1">
                            {ACTIVITY_CHIPS.map((item) => (
                                <Button
                                    key={item.key}
                                    type="button"
                                    size="sm"
                                    variant={
                                        chip === item.key ? 'secondary' : 'ghost'
                                    }
                                    className="h-7 text-[11px]"
                                    onClick={() => setChip(item.key)}
                                >
                                    {t(item.label)}
                                </Button>
                            ))}
                            </div>
                        </div>
                    ) : null}
                    {items.length === 0 ? (
                        <p className="py-2 text-[13px] text-mute">
                            {tab === 'overview'
                                ? t('No recent activity yet.')
                                : t('No activities yet.')}
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
                                {item.type === 'call' && item.meta?.outcome ? (
                                    <p className="mt-0.5 text-[12px] text-mute">
                                        {item.meta.direction === 'inbound'
                                            ? t('Inbound')
                                            : t('Outbound')}
                                        {' · '}
                                        {item.meta.outcome}
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
                                            {t('Mark done')}
                                        </Button>
                                    </Form>
                                ) : null}
                                {item.type === 'meeting' ? (
                                    <MeetingAttendanceButtons
                                        activityId={item.id}
                                        attendance={item.meta?.attendance}
                                    />
                                ) : null}
                            </RecordTimelineItem>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
