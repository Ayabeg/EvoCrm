import { Head, Link } from '@inertiajs/react';
import {
    Bolt,
    Contact as ContactIcon,
    Inbox,
    Megaphone,
    Send,
    SquareKanban,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { EvoVizChart } from '@/evoviz';
import type { EvoVizPayload } from '@/evoviz';

type TodayTile = {
    key: string;
    label: string;
    value: number | null;
};

type Task = {
    id: number;
    subject?: string | null;
    body?: string | null;
    due_at?: string | null;
    contact?: {
        id: number;
        first_name: string;
        last_name?: string | null;
    } | null;
    deal?: { id: number; title: string } | null;
    owner?: { name: string } | null;
};

type Department = {
    key: string;
    name: string;
    href: string;
    value?: number;
    value_label?: string;
    connected?: boolean;
};

type Props = {
    today: TodayTile[];
    nextSteps: Task[];
    departments: Department[];
    charts: EvoVizPayload[];
};

const DEPARTMENT_ICONS: Record<string, LucideIcon> = {
    inbox: Inbox,
    leads: SquareKanban,
    contacts: ContactIcon,
    ads: Megaphone,
    outbound: Send,
    integrations: Bolt,
};

const ALGIERS = 'Africa/Algiers';

function algiersDay(date: Date): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: ALGIERS,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date);
}

function formatDue(dueAt: string): { label: string; overdue: boolean } {
    const date = new Date(dueAt);
    const now = new Date();
    const overdue = date.getTime() < now.getTime();

    if (algiersDay(date) === algiersDay(now)) {
        return {
            label: `Today ${new Intl.DateTimeFormat('en-GB', { timeZone: ALGIERS, hour: '2-digit', minute: '2-digit' }).format(date)}`,
            overdue,
        };
    }

    return {
        label: new Intl.DateTimeFormat('en-GB', {
            timeZone: ALGIERS,
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        }).format(date),
        overdue,
    };
}

export default function Home({ today, nextSteps, departments, charts }: Props) {
    const tiles = today.filter((tile) => tile.value !== null);

    return (
        <>
            <Head title="Home" />
            <div className="flex h-full flex-1 flex-col bg-canvas-soft text-[13px] text-ink">
                <div className="mx-auto w-full max-w-4xl px-5 py-8">
                    <PageHeader
                        title="EvoSales"
                        description="Evotechly — what needs you, and where to go."
                    />

                    {tiles.length > 0 ? (
                        <section aria-label="Today">
                            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-hairline bg-hairline sm:grid-cols-3 xl:grid-cols-6">
                                {tiles.map((tile) => (
                                    <div
                                        key={tile.key}
                                        className="bg-canvas px-4 py-3"
                                    >
                                        <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
                                            {tile.label}
                                        </p>
                                        <p className="money mt-1 text-xl font-semibold">
                                            {tile.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ) : null}

                    {charts.length > 0 ? (
                        <section className="mt-8" aria-label="Charts">
                            <div className="grid gap-3 sm:grid-cols-2">
                                {charts.map((chart) => (
                                    <EvoVizChart
                                        key={`${chart.id}-${chart.title}`}
                                        payload={chart}
                                    />
                                ))}
                            </div>
                        </section>
                    ) : null}

                    <section className="mt-8" aria-label="Next steps">
                        <div className="mb-2 flex items-baseline justify-between">
                            <h2 className="text-sm font-medium">Next steps</h2>
                            <span className="text-[12px] text-muted-foreground">
                                Open tasks, soonest first
                            </span>
                        </div>
                        <div className="overflow-hidden rounded-lg border border-hairline bg-canvas">
                            {nextSteps.length === 0 ? (
                                <p className="px-4 py-6 text-sm text-muted-foreground">
                                    Nothing due. Add tasks from a contact or a
                                    deal.
                                </p>
                            ) : (
                                <ul className="divide-y divide-hairline">
                                    {nextSteps.map((task) => {
                                        const due = task.due_at
                                            ? formatDue(task.due_at)
                                            : null;

                                        return (
                                            <li
                                                key={task.id}
                                                className="flex items-center gap-3 px-4 py-2.5"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-[13px]">
                                                        {task.subject ??
                                                            task.body ??
                                                            'Task'}
                                                    </p>
                                                    <p className="truncate text-[12px] text-muted-foreground">
                                                        {task.deal ? (
                                                            <Link
                                                                href={`/crm/deals/${task.deal.id}`}
                                                                className="text-brand"
                                                            >
                                                                {
                                                                    task.deal
                                                                        .title
                                                                }
                                                            </Link>
                                                        ) : task.contact ? (
                                                            <Link
                                                                href={`/crm/contacts/${task.contact.id}`}
                                                                className="text-brand"
                                                            >
                                                                {[
                                                                    task.contact
                                                                        .first_name,
                                                                    task.contact
                                                                        .last_name,
                                                                ]
                                                                    .filter(
                                                                        Boolean,
                                                                    )
                                                                    .join(' ')}
                                                            </Link>
                                                        ) : (
                                                            (task.owner?.name ??
                                                            'No link')
                                                        )}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`shrink-0 text-[12px] ${
                                                        due?.overdue
                                                            ? 'text-brand'
                                                            : 'text-muted-foreground'
                                                    }`}
                                                >
                                                    {due?.label ?? 'No date'}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </section>

                    <section className="mt-8" aria-label="Departments">
                        <h2 className="mb-2 text-sm font-medium">
                            Departments
                        </h2>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {departments.map((department) => {
                                const Icon =
                                    DEPARTMENT_ICONS[department.key] ?? Bolt;

                                return (
                                    <Link
                                        key={department.key}
                                        href={department.href}
                                        className="group rounded-lg border border-hairline bg-canvas px-4 py-3 transition-colors hover:border-ink/25 hover:bg-canvas-soft"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Icon className="size-4 text-muted-foreground transition-colors group-hover:text-brand" />
                                            <span className="text-[13px] font-medium">
                                                {department.name}
                                            </span>
                                        </div>
                                        <p className="mt-2 flex items-baseline gap-1.5">
                                            {department.connected !==
                                            undefined ? (
                                                <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                                                    <span
                                                        className={`size-1.5 rounded-full ${
                                                            department.connected
                                                                ? 'bg-brand'
                                                                : 'bg-muted-foreground/40'
                                                        }`}
                                                    />
                                                    {department.connected
                                                        ? 'Connected'
                                                        : 'Not connected'}
                                                </span>
                                            ) : (
                                                <>
                                                    <span className="money text-lg font-semibold">
                                                        {department.value ?? 0}
                                                    </span>
                                                    <span className="text-[12px] text-muted-foreground">
                                                        {department.value_label}
                                                    </span>
                                                </>
                                            )}
                                        </p>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}

Home.layout = {
    breadcrumbs: [{ title: 'Home', href: '/dashboard' }],
};
