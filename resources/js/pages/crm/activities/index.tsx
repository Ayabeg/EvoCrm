import { Form, Link, router } from '@inertiajs/react';
import { CrmShell } from '@/components/crm/crm-shell';
import { CrmListFooter, CrmListHeader } from '@/components/crm/list-chrome';
import { MeetingAttendanceButtons } from '@/components/crm/meeting-attendance';
import { Badge } from '@/components/ui/badge';

type Activity = {
    id: number;
    type: string;
    subject?: string | null;
    body?: string | null;
    due_at?: string | null;
    completed_at?: string | null;
    done: boolean;
    owner?: { id: number; name: string } | null;
    contact?: { id: number; first_name: string; last_name?: string | null } | null;
    deal?: { id: number; title: string } | null;
    company?: { id: number; name: string } | null;
    meta?: { attendance?: string | null } | null;
};

type Filters = {
    type?: string;
    owner_id?: number | null;
    date?: string;
};

function contactName(c?: { first_name: string; last_name?: string | null } | null) {
    return c ? [c.first_name, c.last_name].filter(Boolean).join(' ') : '—';
}

function relatedHref(activity: Activity): string | null {
    if (activity.deal) {
        return `/crm/deals/${activity.deal.id}`;
    }
    if (activity.contact) {
        return `/crm/contacts/${activity.contact.id}`;
    }
    if (activity.company) {
        return `/crm/companies/${activity.company.id}`;
    }
    return null;
}

export default function ActivitiesIndex({
    activities,
    members,
    filters,
    recordCount,
}: {
    activities: Activity[];
    members: { id: number; name: string }[];
    filters: Filters;
    recordCount: number;
}) {
    const apply = (next: Partial<Filters>) => {
        router.get(
            '/crm/activities',
            {
                type: next.type ?? filters.type ?? '',
                owner_id: next.owner_id ?? filters.owner_id ?? '',
                date: next.date ?? filters.date ?? 'all',
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <CrmShell title="Activities" chrome="workspace">
            <div className="flex h-full min-h-0 flex-col bg-canvas text-[13px] text-ink">
                <CrmListHeader
                    title="Activities"
                    views={[]}
                    activeView=""
                    primaryLabel="Log activity"
                    onPrimary={() => {
                        window.location.href = '/crm/activities?create=1';
                    }}
                />
                <div className="border-b border-hairline px-4 py-2.5 sm:px-6">
                    <p className="mb-2 text-[12px] text-mute">
                        Tasks, calls, meetings, and notes across contacts, deals, and companies.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={filters.type ?? ''}
                            onChange={(e) => apply({ type: e.target.value })}
                            className="h-8 rounded-md border border-hairline bg-canvas px-2 text-[13px]"
                            aria-label="Activity type"
                        >
                            <option value="">All types</option>
                            {['task', 'call', 'meeting', 'note', 'email'].map((type) => (
                                <option key={type} value={type}>
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </option>
                            ))}
                        </select>
                        <select
                            value={filters.owner_id ?? ''}
                            onChange={(e) =>
                                apply({
                                    owner_id: e.target.value ? Number(e.target.value) : null,
                                })
                            }
                            className="h-8 rounded-md border border-hairline bg-canvas px-2 text-[13px]"
                            aria-label="Owner"
                        >
                            <option value="">All owners</option>
                            {members.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.name}
                                </option>
                            ))}
                        </select>
                        <select
                            value={filters.date ?? 'all'}
                            onChange={(e) => apply({ date: e.target.value })}
                            className="h-8 rounded-md border border-hairline bg-canvas px-2 text-[13px]"
                            aria-label="Due date"
                        >
                            <option value="all">Any due date</option>
                            <option value="today">Due today</option>
                            <option value="overdue">Overdue</option>
                            <option value="week">Due this week</option>
                        </select>
                    </div>
                </div>

                <div className="min-h-0 flex-1 overflow-auto">
                    <table className="w-full min-w-[640px] border-collapse text-[13px]">
                        <thead>
                            <tr className="border-b border-hairline bg-canvas-soft text-left">
                                <th className="px-4 py-1.5 text-[11px] font-medium text-mute sm:px-6">
                                    Subject
                                </th>
                                <th className="px-4 py-1.5 text-[11px] font-medium text-mute">
                                    Type
                                </th>
                                <th className="px-4 py-1.5 text-[11px] font-medium text-mute">
                                    Related
                                </th>
                                <th className="px-4 py-1.5 text-[11px] font-medium text-mute">
                                    Owner
                                </th>
                                <th className="px-4 py-1.5 text-[11px] font-medium text-mute">
                                    Due
                                </th>
                                <th className="px-4 py-1.5 text-[11px] font-medium text-mute sm:pr-6" />
                            </tr>
                        </thead>
                        <tbody>
                            {activities.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-mute sm:px-6">
                                        No activities match this view.
                                    </td>
                                </tr>
                            ) : (
                                activities.map((activity) => {
                                    const href = relatedHref(activity);

                                    return (
                                        <tr
                                            key={activity.id}
                                            className={href ? 'cursor-pointer border-b border-hairline hover:bg-canvas-soft' : 'border-b border-hairline'}
                                            onClick={() => {
                                                if (href) {
                                                    router.visit(href);
                                                }
                                            }}
                                        >
                                            <td className="px-4 py-1.5 sm:px-6">
                                                <span
                                                    className={
                                                        activity.done
                                                            ? 'text-mute line-through'
                                                            : 'font-medium text-ink'
                                                    }
                                                >
                                                    {activity.subject ?? activity.body ?? 'Activity'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-1.5">
                                                <Badge variant="outline">{activity.type}</Badge>
                                            </td>
                                            <td className="px-4 py-1.5">
                                                {activity.deal ? (
                                                    <Link
                                                        href={`/crm/deals/${activity.deal.id}`}
                                                        className="text-ink hover:underline"
                                                        onClick={(event) => event.stopPropagation()}
                                                    >
                                                        {activity.deal.title}
                                                    </Link>
                                                ) : activity.contact ? (
                                                    <Link
                                                        href={`/crm/contacts/${activity.contact.id}`}
                                                        className="text-ink hover:underline"
                                                        onClick={(event) => event.stopPropagation()}
                                                    >
                                                        {contactName(activity.contact)}
                                                    </Link>
                                                ) : activity.company ? (
                                                    <Link
                                                        href={`/crm/companies/${activity.company.id}`}
                                                        className="text-ink hover:underline"
                                                        onClick={(event) => event.stopPropagation()}
                                                    >
                                                        {activity.company.name}
                                                    </Link>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td className="px-4 py-1.5 text-mute">
                                                {activity.owner?.name ?? '—'}
                                            </td>
                                            <td className="px-4 py-1.5 text-mute">
                                                {activity.done
                                                    ? (activity.completed_at ?? 'Done')
                                                    : (activity.due_at ?? '—')}
                                            </td>
                                            <td
                                                className="px-4 py-1.5 text-right sm:pr-6"
                                                onClick={(event) => event.stopPropagation()}
                                            >
                                                {activity.type === 'meeting' ? (
                                                    <div className="flex justify-end">
                                                        <MeetingAttendanceButtons
                                                            activityId={activity.id}
                                                            attendance={activity.meta?.attendance}
                                                        />
                                                    </div>
                                                ) : !activity.done ? (
                                                    <Form
                                                        action={`/crm/activities/${activity.id}/complete`}
                                                        method="post"
                                                    >
                                                        <button
                                                            type="submit"
                                                            className="text-[13px] text-ink hover:underline"
                                                        >
                                                            Done
                                                        </button>
                                                    </Form>
                                                ) : null}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                <CrmListFooter count={recordCount} noun="activities" />
            </div>
        </CrmShell>
    );
}

ActivitiesIndex.layout = {
    breadcrumbs: [{ title: 'Activities', href: '/crm/activities' }],
};
