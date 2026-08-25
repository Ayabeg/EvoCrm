import { Form, Link, router } from '@inertiajs/react';
import { CrmShell } from '@/components/crm/crm-shell';
import { CrmListFooter } from '@/components/crm/list-chrome';
import PageHeader from '@/components/page-header';
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
};

type Filters = {
    type?: string;
    owner_id?: number | null;
    date?: string;
};

function contactName(c?: { first_name: string; last_name?: string | null } | null) {
    return c ? [c.first_name, c.last_name].filter(Boolean).join(' ') : '—';
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
        <CrmShell title="Activities">
            <div className="flex h-full flex-col overflow-hidden">
                <div className="border-b border-hairline bg-canvas px-6 py-4">
                    <PageHeader
                        title="Activities"
                        description="Tasks, calls, meetings, and notes across contacts, deals, and companies."
                    />
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <select
                            value={filters.type ?? ''}
                            onChange={(e) => apply({ type: e.target.value })}
                            className="h-8 rounded-md border border-hairline bg-canvas px-2 text-[12px]"
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
                            className="h-8 rounded-md border border-hairline bg-canvas px-2 text-[12px]"
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
                            className="h-8 rounded-md border border-hairline bg-canvas px-2 text-[12px]"
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
                    <table className="w-full text-[13px]">
                        <thead className="sticky top-0 bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-2 font-medium">Subject</th>
                                <th className="px-4 py-2 font-medium">Type</th>
                                <th className="px-4 py-2 font-medium">Related</th>
                                <th className="px-4 py-2 font-medium">Owner</th>
                                <th className="px-4 py-2 font-medium">Due</th>
                                <th className="px-4 py-2 font-medium" />
                            </tr>
                        </thead>
                        <tbody>
                            {activities.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-muted-foreground">
                                        No activities match this view.
                                    </td>
                                </tr>
                            ) : (
                                activities.map((activity) => (
                                    <tr key={activity.id} className="border-t border-hairline">
                                        <td className="px-4 py-2.5">
                                            <span
                                                className={
                                                    activity.done
                                                        ? 'text-muted-foreground line-through'
                                                        : 'font-medium'
                                                }
                                            >
                                                {activity.subject ?? activity.body ?? 'Activity'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <Badge variant="outline">{activity.type}</Badge>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            {activity.deal ? (
                                                <Link
                                                    href={`/crm/deals/${activity.deal.id}`}
                                                    className="text-brand hover:underline"
                                                >
                                                    {activity.deal.title}
                                                </Link>
                                            ) : activity.contact ? (
                                                <Link
                                                    href={`/crm/contacts/${activity.contact.id}`}
                                                    className="text-brand hover:underline"
                                                >
                                                    {contactName(activity.contact)}
                                                </Link>
                                            ) : activity.company ? (
                                                <Link
                                                    href={`/crm/companies/${activity.company.id}`}
                                                    className="text-brand hover:underline"
                                                >
                                                    {activity.company.name}
                                                </Link>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td className="px-4 py-2.5 text-muted-foreground">
                                            {activity.owner?.name ?? '—'}
                                        </td>
                                        <td className="px-4 py-2.5 text-muted-foreground">
                                            {activity.done
                                                ? (activity.completed_at ?? 'Done')
                                                : (activity.due_at ?? '—')}
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            {!activity.done ? (
                                                <Form
                                                    action={`/crm/activities/${activity.id}/complete`}
                                                    method="post"
                                                >
                                                    <button
                                                        type="submit"
                                                        className="text-[12px] text-brand hover:underline"
                                                    >
                                                        Done
                                                    </button>
                                                </Form>
                                            ) : null}
                                        </td>
                                    </tr>
                                ))
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
