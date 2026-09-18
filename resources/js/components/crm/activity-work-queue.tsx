import { router } from '@inertiajs/react';
import { Check, Circle } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { toast } from 'sonner';
import ActivityComposer from '@/components/crm/activity-composer';
import { MeetingAttendanceButtons } from '@/components/crm/meeting-attendance';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RecordLink } from '@/ds/workspace/quick-record/RecordLink';
import {
    ACTIVITY_QUEUE_TYPES,
    activityQueueHref,
    activityQueueMatchesRequest,
    isStaleActivityQueueVisit,
    parseActivityQueueSearch,
    patchActivityQueueSearch,
    requestedActivityQueueGroup,
} from '@/lib/activity-work-queue';
import type {
    ActivityQueueFilters,
    ActivityQueueItem,
    ActivityQueuePayload,
    ActivityQueueSearch,
    ActivityQueueSection,
} from '@/lib/activity-work-queue';
import { dateLocale, t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const visitGeneration = { current: 0 };

function startQueueVisit(
    next: ActivityQueueSearch,
    onSettled: () => void,
): void {
    const requestId = ++visitGeneration.current;

    router.cancelAll({ prefetch: false });
    router.get(activityQueueHref(next), {}, {
        preserveScroll: true,
        onFinish: () => {
            if (isStaleActivityQueueVisit(visitGeneration.current, requestId)) {
                return;
            }

            onSettled();
        },
    });
}

const OPEN_GROUP_ORDER = ['overdue', 'today', 'upcoming', 'unscheduled'] as const;

function dueLabel(iso: string | null | undefined, group: string): string {
    if (!iso) {
        return group === 'unscheduled' ? t('No due date') : '—';
    }

    try {
        const formatted = new Intl.DateTimeFormat(dateLocale(), {
            timeZone: 'Africa/Algiers',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(iso));

        if (group === 'overdue') {
            return `${t('Overdue')} · ${formatted}`;
        }

        if (group === 'completed') {
            return formatted;
        }

        return formatted;
    } catch {
        return iso.slice(0, 16);
    }
}

function typeLabel(type: string): string {
    return type.charAt(0).toUpperCase() + type.slice(1);
}

function QueueGroupSection({
    section,
    empty,
    viewAllHref,
    children,
}: {
    section: ActivityQueueSection;
    empty: string | null;
    viewAllHref: string | null;
    children: ReactNode;
}) {
    return (
        <section
            data-activity-group={section.key}
            aria-labelledby={`activity-group-${section.key}`}
        >
            <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-hairline bg-canvas px-4 py-2 sm:px-6">
                <h2
                    id={`activity-group-${section.key}`}
                    className={cn(
                        'text-[12px] font-medium tracking-[0.04em] uppercase',
                        section.key === 'overdue' ? 'text-destructive' : 'text-mute',
                    )}
                >
                    {t(section.label)}
                    <span className="ms-2 font-normal normal-case text-mute">
                        {section.count}
                    </span>
                </h2>
                {viewAllHref ? (
                    <a
                        href={viewAllHref}
                        className="text-[12px] text-mute hover:text-ink hover:underline"
                        onClick={(event) => {
                            event.preventDefault();
                            startQueueVisit(parseActivityQueueSearch(viewAllHref.split('?')[1] ?? ''), () => undefined);
                        }}
                    >
                        {t('View all')}
                    </a>
                ) : null}
            </header>
            {empty ? (
                <p className="px-4 py-6 text-[13px] text-mute sm:px-6" role="status">
                    {empty}
                </p>
            ) : (
                children
            )}
        </section>
    );
}

export default function ActivityWorkQueue({
    queue,
    members,
    filters,
    capabilities,
    url,
}: {
    queue: ActivityQueuePayload;
    members: { id: number; name: string }[];
    filters: ActivityQueueFilters;
    capabilities: { can_create: boolean; can_complete: boolean };
    url: string;
}) {
    const [pending, setPending] = useState(false);
    const [completingId, setCompletingId] = useState<number | null>(null);
    const completeRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
    const focusAfterId = useRef<number | null>(null);

    const current: ActivityQueueSearch = {
        scope: filters.scope === 'all' ? 'all' : 'mine',
        group: filters.group as ActivityQueueSearch['group'],
        type: filters.type as ActivityQueueSearch['type'],
        owner_id: filters.owner_id,
        page: filters.page,
        create: filters.create,
    };

    const requestedGroup = requestedActivityQueueGroup(url);
    const matchesRequest = activityQueueMatchesRequest(filters.group, requestedGroup);

    useEffect(() => {
        const nextId = focusAfterId.current;

        if (nextId === null) {
            return;
        }

        const node = completeRefs.current.get(nextId);

        if (node) {
            node.focus();
            focusAfterId.current = null;
        }
    }, [queue]);

    const apply = (patch: Partial<ActivityQueueSearch>) => {
        setPending(true);
        startQueueVisit(patchActivityQueueSearch(current, patch), () => {
            setPending(false);
        });
    };

    const visibleIds = OPEN_GROUP_ORDER.flatMap(
        (key) => queue.groups[key]?.items.map((item) => item.id) ?? [],
    );

    if (queue.groups.completed && current.group === 'completed') {
        visibleIds.push(...queue.groups.completed.items.map((item) => item.id));
    }

    const complete = (item: ActivityQueueItem) => {
        if (item.done || !item.can_complete || completingId !== null) {
            return;
        }

        const index = visibleIds.indexOf(item.id);
        focusAfterId.current = visibleIds[index + 1] ?? visibleIds[index - 1] ?? null;
        setCompletingId(item.id);

        router.post(
            `/crm/activities/${item.id}/complete`,
            {},
            {
                preserveScroll: true,
                onError: () => {
                    toast.error(t('Could not complete this activity.'));
                    setCompletingId(null);
                    focusAfterId.current = null;
                },
                onFinish: () => {
                    setCompletingId(null);
                },
            },
        );
    };

    const onCompleteKey = (event: KeyboardEvent<HTMLButtonElement>, item: ActivityQueueItem) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            complete(item);
        }
    };

    const renderRow = (item: ActivityQueueItem) => {
        const overdue = item.group === 'overdue';
        const busy = completingId === item.id;

        return (
            <li
                key={item.id}
                data-activity-row={item.id}
                className="flex min-h-[52px] max-h-16 items-center gap-3 border-b border-hairline px-4 py-2 sm:px-6"
            >
                <button
                    type="button"
                    ref={(node) => {
                        if (node) {
                            completeRefs.current.set(item.id, node);
                        } else {
                            completeRefs.current.delete(item.id);
                        }
                    }}
                    data-activity-complete={item.id}
                    className="flex size-8 shrink-0 items-center justify-center rounded-sm text-mute hover:bg-canvas-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink disabled:opacity-50"
                    aria-label={
                        item.done
                            ? t('Completed :subject', { subject: item.subject })
                            : t('Complete :subject', { subject: item.subject })
                    }
                    aria-pressed={item.done}
                    disabled={item.done || !item.can_complete || busy || !capabilities.can_complete}
                    onClick={() => complete(item)}
                    onKeyDown={(event) => onCompleteKey(event, item)}
                >
                    {item.done ? (
                        <Check className="size-4" aria-hidden />
                    ) : (
                        <Circle className="size-4" aria-hidden />
                    )}
                </button>

                <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <p
                            className={cn(
                                'min-w-0 truncate text-[13px] font-medium',
                                item.done ? 'text-mute line-through' : 'text-ink',
                            )}
                        >
                            {item.subject}
                        </p>
                        <Badge variant="outline" className="shrink-0 text-[10px] font-normal">
                            {typeLabel(item.type)}
                        </Badge>
                    </div>
                    <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-mute">
                        <span
                            className={cn('shrink-0', overdue && 'text-destructive')}
                        >
                            {item.done
                                ? dueLabel(item.completed_at, 'completed')
                                : dueLabel(item.due_at, item.group)}
                        </span>
                        {item.related.length > 0 ? (
                            <span className="flex min-w-0 flex-wrap items-center gap-1">
                                {item.related.map((record, index) => (
                                    <span key={`${record.type}-${record.id}`} className="min-w-0">
                                        {index > 0 ? (
                                            <span className="text-mute" aria-hidden>
                                                ·{' '}
                                            </span>
                                        ) : null}
                                        {record.type === 'deal' ||
                                        record.type === 'contact' ||
                                        record.type === 'company' ? (
                                            <RecordLink
                                                record={{ type: record.type, id: record.id }}
                                                mode="drawer"
                                                className="truncate text-ink hover:underline"
                                            >
                                                {record.label}
                                            </RecordLink>
                                        ) : (
                                            <span className="truncate">{record.label}</span>
                                        )}
                                    </span>
                                ))}
                            </span>
                        ) : null}
                        <span className="truncate">
                            {item.owner?.name ?? t('Unassigned')}
                        </span>
                    </div>
                </div>

                {item.type === 'meeting' && !item.done ? (
                    <div className="hidden shrink-0 sm:block">
                        <MeetingAttendanceButtons
                            activityId={item.id}
                            attendance={item.meta?.attendance}
                        />
                    </div>
                ) : null}
            </li>
        );
    };

    const renderSection = (section: ActivityQueueSection | undefined) => {
        if (!section) {
            return null;
        }

        if (current.group === null && section.count === 0 && section.key !== 'completed') {
            return null;
        }

        const empty =
            section.items.length === 0
                ? section.key === 'completed'
                    ? t('No completed activities.')
                    : current.scope === 'mine'
                      ? t('Nothing assigned to you in this group.')
                      : t('No activities in this group.')
                : null;
        const viewAllHref = activityQueueHref(
            patchActivityQueueSearch(current, {
                group: section.key as ActivityQueueSearch['group'],
            }),
        );

        return (
            <QueueGroupSection
                key={section.key}
                section={section}
                empty={empty}
                viewAllHref={current.group === null && section.has_more ? viewAllHref : null}
            >
                <ul>{section.items.map(renderRow)}</ul>
            </QueueGroupSection>
        );
    };

    const showPending = pending && !matchesRequest;
    const openEmpty =
        current.group === null &&
        queue.counts.overdue +
            queue.counts.today +
            queue.counts.upcoming +
            queue.counts.unscheduled ===
            0;

    return (
        <div
            className="flex h-full min-h-0 flex-col overflow-x-hidden bg-canvas text-ui text-ink"
            data-crm="activity-work-queue"
        >
            <header className="border-b border-hairline px-4 py-4 sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-[28px] leading-[34px] font-semibold tracking-tight text-ink">
                            {t('Activities')}
                        </h1>
                        <p className="mt-1 text-[13px] text-mute">
                            {t('What needs you now — overdue, today, next.')}
                        </p>
                    </div>
                    {capabilities.can_create ? (
                        <Button
                            type="button"
                            size="sm"
                            className="h-8"
                            onClick={() => apply({ create: !current.create })}
                        >
                            {current.create ? t('Close') : t('Log activity')}
                        </Button>
                    ) : null}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <div
                        className="inline-flex rounded-md border border-hairline p-0.5"
                        role="group"
                        aria-label={t('Assignee scope')}
                    >
                        <button
                            type="button"
                            className={cn(
                                'h-7 rounded-sm px-2.5 text-[12px]',
                                current.scope === 'mine'
                                    ? 'bg-canvas-soft font-medium text-ink'
                                    : 'text-mute hover:text-ink',
                            )}
                            aria-pressed={current.scope === 'mine'}
                            onClick={() => apply({ scope: 'mine' })}
                        >
                            {t('My work')}
                        </button>
                        <button
                            type="button"
                            className={cn(
                                'h-7 rounded-sm px-2.5 text-[12px]',
                                current.scope === 'all'
                                    ? 'bg-canvas-soft font-medium text-ink'
                                    : 'text-mute hover:text-ink',
                            )}
                            aria-pressed={current.scope === 'all'}
                            onClick={() => apply({ scope: 'all', owner_id: null })}
                        >
                            {t('All')}
                        </button>
                    </div>

                    <div
                        className="flex flex-wrap items-center gap-1"
                        role="group"
                        aria-label={t('Due group')}
                    >
                        <button
                            type="button"
                            className={cn(
                                'h-7 rounded-sm border px-2 text-[12px]',
                                current.group === null
                                    ? 'border-ink text-ink'
                                    : 'border-hairline text-mute hover:text-ink',
                            )}
                            aria-pressed={current.group === null}
                            onClick={() => apply({ group: null })}
                        >
                            {t('Open')}
                            <span className="ms-1 text-mute">{queue.counts.open}</span>
                        </button>
                        {(['overdue', 'today', 'upcoming', 'completed'] as const).map((group) => (
                            <button
                                key={group}
                                type="button"
                                className={cn(
                                    'h-7 rounded-sm border px-2 text-[12px]',
                                    current.group === group
                                        ? 'border-ink text-ink'
                                        : 'border-hairline text-mute hover:text-ink',
                                    group === 'overdue' && 'text-destructive',
                                )}
                                aria-pressed={current.group === group}
                                onClick={() => apply({ group })}
                            >
                                {t(
                                    group === 'overdue'
                                        ? 'Overdue'
                                        : group === 'today'
                                          ? 'Today'
                                          : group === 'upcoming'
                                            ? 'Upcoming'
                                            : 'Completed',
                                )}
                                <span className="ms-1 text-mute">{queue.counts[group]}</span>
                            </button>
                        ))}
                    </div>

                    <label className="sr-only" htmlFor="activity-queue-type">
                        {t('Activity type')}
                    </label>
                    <select
                        id="activity-queue-type"
                        value={current.type ?? ''}
                        onChange={(event) =>
                            apply({
                                type: event.target.value
                                    ? (event.target.value as ActivityQueueSearch['type'])
                                    : null,
                            })
                        }
                        className="h-7 rounded-md border border-hairline bg-canvas px-2 text-[12px] text-ink"
                    >
                        <option value="">{t('All types')}</option>
                        {ACTIVITY_QUEUE_TYPES.map((type) => (
                            <option key={type} value={type}>
                                {typeLabel(type)}
                            </option>
                        ))}
                    </select>

                    {current.scope === 'all' ? (
                        <>
                            <label className="sr-only" htmlFor="activity-queue-owner">
                                {t('Assignee')}
                            </label>
                            <select
                                id="activity-queue-owner"
                                value={current.owner_id ?? ''}
                                onChange={(event) =>
                                    apply({
                                        owner_id: event.target.value
                                            ? Number(event.target.value)
                                            : null,
                                    })
                                }
                                className="h-7 rounded-md border border-hairline bg-canvas px-2 text-[12px] text-ink"
                            >
                                <option value="">{t('All assignees')}</option>
                                {members.map((member) => (
                                    <option key={member.id} value={member.id}>
                                        {member.name}
                                    </option>
                                ))}
                            </select>
                        </>
                    ) : null}
                </div>
            </header>

            {current.create ? (
                <div className="border-b border-hairline px-4 py-3 sm:px-6">
                    <ActivityComposer />
                </div>
            ) : null}

            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
                {showPending ? (
                    <p className="px-4 py-8 text-[13px] text-mute sm:px-6" role="status">
                        {t('Updating queue…')}
                    </p>
                ) : openEmpty ? (
                    <p className="px-4 py-10 text-[13px] text-mute sm:px-6" role="status">
                        {current.scope === 'mine'
                            ? t('Log a call, task, or note to start this queue.')
                            : t('No open activities match this view.')}
                    </p>
                ) : (
                    <>
                        {current.group
                            ? renderSection(queue.groups[current.group])
                            : OPEN_GROUP_ORDER.map((key) => renderSection(queue.groups[key]))}
                        {current.group === null
                            ? renderSection(queue.groups.completed)
                            : null}
                    </>
                )}
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-4 py-2 text-[12px] text-mute sm:px-6">
                <span>
                    {current.group
                        ? t(':count :noun', {
                              count: queue.counts[current.group] ?? 0,
                              noun: t('activities'),
                          })
                        : t(':count open', { count: queue.counts.open })}
                </span>
                {current.group && queue.paginator.last_page > 1 ? (
                    <nav className="flex items-center gap-2" aria-label={t('Pagination')}>
                        <button
                            type="button"
                            className="hover:text-ink disabled:opacity-40"
                            disabled={queue.paginator.page <= 1}
                            onClick={() => apply({ page: queue.paginator.page - 1 })}
                        >
                            {t('Previous')}
                        </button>
                        <span>
                            {queue.paginator.page} / {queue.paginator.last_page}
                        </span>
                        <button
                            type="button"
                            className="hover:text-ink disabled:opacity-40"
                            disabled={!queue.paginator.has_more}
                            onClick={() => apply({ page: queue.paginator.page + 1 })}
                        >
                            {t('Next')}
                        </button>
                    </nav>
                ) : null}
            </footer>
        </div>
    );
}

export function activityQueueSearchFromUrl(url: string): ActivityQueueSearch {
    const query = url.includes('?') ? url.slice(url.indexOf('?') + 1) : '';

    return parseActivityQueueSearch(query);
}
