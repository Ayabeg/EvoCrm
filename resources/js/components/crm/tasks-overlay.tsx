import { router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

type OpenTask = {
    id: number;
    type: string;
    subject: string;
    due_at?: string | null;
};

type Tab = 'today' | 'overdue' | 'upcoming';

function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function bucket(task: OpenTask, now: Date): Tab {
    if (!task.due_at) {
        return 'upcoming';
    }

    const due = new Date(task.due_at);
    const today = startOfDay(now);
    const dueDay = startOfDay(due);

    if (dueDay < today) {
        return 'overdue';
    }

    if (dueDay.getTime() === today.getTime()) {
        return 'today';
    }

    return 'upcoming';
}

export function TasksOverlay({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const page = usePage();
    const tasks = ((page.props.evoOpenTasks as OpenTask[] | undefined) ?? []);
    const [tab, setTab] = useState<Tab>('today');
    const now = useMemo(() => new Date(), [open]);

    const grouped = useMemo(() => {
        const next: Record<Tab, OpenTask[]> = { today: [], overdue: [], upcoming: [] };

        for (const task of tasks) {
            next[bucket(task, now)].push(task);
        }

        return next;
    }, [tasks, now]);

    if (!open) {
        return null;
    }

    const rows = grouped[tab];

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink/40" role="dialog" aria-label="Tasks">
            <button
                type="button"
                className="h-full flex-1 cursor-default"
                aria-label="Close tasks"
                onClick={() => onOpenChange(false)}
            />
            <aside className="flex h-full w-full max-w-md flex-col border-l border-hairline bg-canvas shadow-[var(--aurora-shadow-strong)]">
                <header className="flex items-center justify-between border-b border-hairline px-4 py-3">
                    <div>
                        <p className="text-[13px] font-semibold text-ink">Tasks</p>
                        <p className="text-[11px] text-mute">{tasks.length} open</p>
                    </div>
                    <button
                        type="button"
                        className="text-[12px] text-mute hover:text-ink"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </button>
                </header>
                <nav className="flex gap-1 border-b border-hairline px-3 py-2">
                    {(['today', 'overdue', 'upcoming'] as Tab[]).map((id) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setTab(id)}
                            className={
                                tab === id
                                    ? 'rounded-full bg-ink px-3 py-1 text-[11px] text-canvas'
                                    : 'rounded-full px-3 py-1 text-[11px] text-mute hover:text-ink'
                            }
                        >
                            {id === 'today' ? 'Today' : id === 'overdue' ? 'Overdue' : 'Upcoming'}
                            <span className="ml-1 tabular-nums">{grouped[id].length}</span>
                        </button>
                    ))}
                </nav>
                <div className="min-h-0 flex-1 overflow-y-auto">
                    {rows.length === 0 ? (
                        <p className="px-4 py-8 text-[13px] text-mute">No tasks in this view.</p>
                    ) : (
                        <ul className="divide-y divide-hairline">
                            {rows.map((task) => (
                                <li key={task.id} className="flex items-start gap-3 px-4 py-3">
                                    <input
                                        type="checkbox"
                                        aria-label={`Complete ${task.subject}`}
                                        onChange={() => {
                                            router.post(`/crm/activities/${task.id}/complete`, {}, { preserveScroll: true });
                                        }}
                                        className="mt-1"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[13px] font-medium text-ink">{task.subject}</p>
                                        <p className="mt-0.5 text-[11px] text-mute">
                                            {task.type}
                                            {task.due_at
                                                ? ` · ${new Date(task.due_at).toLocaleString('en-GB', {
                                                      day: 'numeric',
                                                      month: 'short',
                                                      hour: '2-digit',
                                                      minute: '2-digit',
                                                      hour12: false,
                                                  })}`
                                                : ''}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <footer className="border-t border-hairline px-4 py-3">
                    <a href="/crm/activities" className="text-[12px] text-ink hover:underline">
                        Open activities
                    </a>
                </footer>
            </aside>
        </div>
    );
}
