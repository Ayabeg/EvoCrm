import { Head, Link } from '@inertiajs/react';
import { Plus, Star } from 'lucide-react';
import { useState } from 'react';
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
};

type Department = {
    key: string;
    name: string;
    href: string;
    value?: number;
    value_label?: string;
    connected?: boolean;
};

type Owner = { id: number; name: string };

type Props = {
    today: TodayTile[];
    nextSteps: Task[];
    departments: Department[];
    charts: EvoVizPayload[];
    owners?: Owner[];
};

export default function Home({
    today,
    nextSteps,
    departments,
    charts,
    owners = [],
}: Props) {
    const [favorite, setFavorite] = useState(true);
    const tiles = today.filter((tile) => tile.value !== null);
    const area = charts.find((chart) => chart.id === 'evoviz.area');
    const bar = charts.find((chart) => chart.id === 'evoviz.bar');
    const rest = charts.filter(
        (chart) => chart.id !== 'evoviz.area' && chart.id !== 'evoviz.bar',
    );

    return (
        <>
            <Head title="Home" />
            <div className="flex h-full flex-1 flex-col bg-canvas text-[13px] text-ink">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-6 py-4">
                    <div className="flex items-center gap-2">
                        <h1 className="text-[22px] font-semibold tracking-tight">
                            Home
                        </h1>
                        <button
                            type="button"
                            onClick={() => setFavorite((value) => !value)}
                            className={favorite ? 'text-brand' : 'text-muted-foreground'}
                            title="Favorite"
                        >
                            <Star
                                className="size-4"
                                fill={favorite ? 'currentColor' : 'none'}
                            />
                        </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            defaultValue=""
                            className="h-8 rounded-sm border border-hairline bg-canvas px-2 text-[12px]"
                        >
                            <option value="">All owners</option>
                            {owners.map((owner) => (
                                <option key={owner.id} value={owner.id}>
                                    {owner.name}
                                </option>
                            ))}
                        </select>
                        <select
                            defaultValue="today"
                            className="h-8 rounded-sm border border-hairline bg-canvas px-2 text-[12px]"
                        >
                            <option value="today">Today</option>
                            <option value="7d">Last 7 days</option>
                            <option value="30d">Last 30 days</option>
                        </select>
                        <button
                            type="button"
                            className="h-8 rounded-sm border border-hairline px-2 text-[12px] text-muted-foreground"
                        >
                            Advanced
                        </button>
                    </div>
                </div>

                <div className="grid flex-1 gap-4 overflow-y-auto p-6 md:grid-cols-2 xl:grid-cols-3">
                    {tiles.map((tile) => (
                        <section
                            key={tile.key}
                            className="rounded-md border border-hairline bg-canvas p-4"
                        >
                            <p className="text-[12px] text-muted-foreground">
                                {tile.label}
                            </p>
                            <p className="money mt-2 text-[28px] font-semibold tracking-tight">
                                {tile.value}
                            </p>
                        </section>
                    ))}

                    {area ? <EvoVizChart payload={area} /> : null}
                    {bar ? <EvoVizChart payload={bar} /> : null}
                    {rest.map((chart) => (
                        <EvoVizChart
                            key={`${chart.id}-${chart.title}`}
                            payload={chart}
                        />
                    ))}

                    <section className="rounded-md border border-hairline bg-canvas p-4 md:col-span-2">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-[14px] font-semibold">
                                Next steps
                            </h2>
                            <Link href="/crm/deals" className="text-[12px] text-brand">
                                Open deals
                            </Link>
                        </div>
                        {nextSteps.length === 0 ? (
                            <p className="text-muted-foreground">
                                Nothing due.
                            </p>
                        ) : (
                            <ul className="divide-y divide-hairline">
                                {nextSteps.map((task) => (
                                    <li key={task.id} className="py-2">
                                        <p>{task.subject ?? task.body ?? 'Task'}</p>
                                        <p className="text-[12px] text-muted-foreground">
                                            {task.deal?.title ??
                                                [task.contact?.first_name, task.contact?.last_name]
                                                    .filter(Boolean)
                                                    .join(' ') ??
                                                '—'}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <button
                        type="button"
                        className="grid min-h-[140px] place-items-center rounded-md border border-dashed border-hairline text-[13px] text-muted-foreground hover:border-brand hover:text-brand"
                    >
                        <span className="inline-flex items-center gap-1">
                            <Plus className="size-3.5" />
                            Add content
                        </span>
                    </button>
                </div>

                <div className="sr-only">
                    {departments.map((department) => (
                        <Link key={department.key} href={department.href}>
                            {department.name}
                        </Link>
                    ))}
                </div>
            </div>
        </>
    );
}

Home.layout = {
    breadcrumbs: [{ title: 'Home', href: '/dashboard' }],
};
