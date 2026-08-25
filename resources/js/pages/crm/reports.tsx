import { router } from '@inertiajs/react';
import { useState } from 'react';
import { CrmKpiStrip } from '@/components/crm/crm-kpi-strip';
import type { KpiTile } from '@/components/crm/crm-kpi-strip';
import { ReportsShell, reportsBasePath } from '@/components/crm/reports-shell';
import { OutboundReportsDetail } from '@/components/outbound/reports-detail';
import type { OutboundDetailProps } from '@/components/outbound/reports-detail';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { EvoVizChart, WidgetPicker } from '@/evoviz';
import type { EvoVizPayload, ReportWidgetCatalogItem } from '@/evoviz';
import { formatDzd } from '@/lib/money';

type KpiFormat = 'number' | 'money' | 'percent';

type ReportKpi = {
    label: string;
    value: number | null;
    format?: KpiFormat;
    hint?: string;
};

type ReportColumn = {
    key: string;
    label: string;
    format?: KpiFormat | 'text';
    align?: 'left' | 'right';
};

type ReportTable = {
    columns: ReportColumn[];
    rows: (string | number | null)[][];
};

type ReportCategory = {
    key: string;
    title: string;
    description?: string;
    kpis: ReportKpi[];
    charts: EvoVizPayload[];
    table: ReportTable | null;
};

type DashboardOwner = {
    id: number;
    name: string | null;
};

type DashboardSummary = {
    id: number;
    name: string;
    visibility?: string;
    owner: DashboardOwner;
    widget_count: number;
};

type DashboardWidget = {
    key: string;
    title: string;
    room: string;
    chart: EvoVizPayload | null;
};

type OpenDashboard = {
    id: number;
    name: string;
    owner: DashboardOwner;
    widgets: DashboardWidget[];
};

type Props = {
    activeCategory?: string;
    outboundDetail?: OutboundDetailProps | null;
    window: {
        from: string;
        to: string;
        days: number;
        timezone: string;
        custom: boolean;
        owner_id: number | null;
    };
    categories: ReportCategory[];
    owners: { id: number; name: string }[];
    dashboards: DashboardSummary[];
    dashboard: OpenDashboard | null;
    widgetCatalog: ReportWidgetCatalogItem[];
    schedules?: {
        id: number;
        name?: string | null;
        cron: string;
        recipients: string[];
        active: boolean;
        last_status?: string | null;
        last_error?: string | null;
        last_sent_at?: string | null;
    }[];
    savedReports?: { id: number; name: string }[];
};

const NUMBER = new Intl.NumberFormat('en-US');

function formatValue(
    value: number | null,
    format: KpiFormat = 'number',
): string {
    if (value === null) {
        return '—';
    }

    if (format === 'money') {
        return formatDzd(value);
    }

    if (format === 'percent') {
        return `${NUMBER.format(value)}%`;
    }

    return NUMBER.format(value);
}

function KpiStrip({ kpis }: { kpis: ReportKpi[] }) {
    const tiles: KpiTile[] = kpis.map((kpi, index) => ({
        key: `${kpi.label}-${index}`,
        label: kpi.label,
        value: kpi.value,
        format: kpi.format,
        hint: kpi.hint,
    }));

    return <CrmKpiStrip kpis={tiles} columns={6} />;
}

function BackingTable({ table }: { table: ReportTable }) {
    if (table.rows.length === 0) {
        return null;
    }

    return (
        <div className="overflow-hidden rounded-lg border border-hairline bg-canvas">
            <table className="w-full">
                <thead className="bg-canvas-soft text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                    <tr>
                        {table.columns.map((column) => (
                            <th
                                key={column.key}
                                className={`px-3 py-2 font-medium ${column.align === 'right' ? 'text-right' : ''}`}
                            >
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {table.rows.map((row, i) => (
                        <tr key={i} className="border-t border-hairline">
                            {row.map((cell, j) => {
                                const column = table.columns[j];
                                const right = column?.align === 'right';

                                return (
                                    <td
                                        key={column?.key ?? j}
                                        className={`px-3 py-2 ${right ? 'money text-right' : ''} ${cell === null || cell === 0 ? 'text-muted-foreground' : ''}`}
                                    >
                                        {typeof cell === 'number'
                                            ? formatValue(
                                                  cell,
                                                  column?.format === 'text'
                                                      ? 'number'
                                                      : column?.format,
                                              )
                                            : (cell ?? '—')}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function CategorySection({ category }: { category: ReportCategory }) {
    return (
        <section aria-label={category.title} className="mt-10 first:mt-0">
            <div className="mb-3 flex items-baseline justify-between gap-3">
                <div>
                    <h2 className="text-sm font-medium text-ink">
                        {category.title}
                    </h2>
                    {category.description ? (
                        <p className="mt-0.5 text-[12px] text-muted-foreground">
                            {category.description}
                        </p>
                    ) : null}
                </div>
            </div>

            <KpiStrip kpis={category.kpis} />

            {category.charts.length > 0 ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {category.charts.map((chart) => (
                        <EvoVizChart
                            key={`${chart.id}-${chart.title}`}
                            payload={chart}
                        />
                    ))}
                </div>
            ) : null}

            {category.table ? (
                <div className="mt-3">
                    <BackingTable table={category.table} />
                </div>
            ) : null}
        </section>
    );
}

function filterQuery(
    from: string,
    to: string,
    owner: string,
    dashboardId?: number,
): Record<string, string | number> {
    return {
        from,
        to,
        ...(owner ? { owner } : {}),
        ...(dashboardId ? { dashboard: dashboardId } : {}),
    };
}

export default function Reports({
    activeCategory = 'overview',
    outboundDetail = null,
    window,
    categories,
    owners,
    dashboards,
    dashboard,
    widgetCatalog,
    schedules = [],
    savedReports = [],
}: Props) {
    const reportsPath = reportsBasePath(activeCategory);
    const [from, setFrom] = useState(window.from);
    const [to, setTo] = useState(window.to);
    const [owner, setOwner] = useState(
        window.owner_id ? String(window.owner_id) : '',
    );
    const [newOpen, setNewOpen] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newVisibility, setNewVisibility] = useState<'private' | 'team' | 'workspace'>('private');

    const apply = (event: React.FormEvent) => {
        event.preventDefault();
        router.get(reportsPath, filterQuery(from, to, owner, dashboard?.id), {
            preserveState: true,
        });
    };

    const reset = () => {
        router.get(
            '/reports',
            {
                ...(owner ? { owner } : {}),
                ...(dashboard ? { dashboard: dashboard.id } : {}),
            },
            { preserveState: true },
        );
    };

    const openRooms = () => {
        router.get(reportsPath, filterQuery(from, to, owner), {
            preserveState: true,
        });
    };

    const openDashboard = (id: number) => {
        router.get(reportsPath, filterQuery(from, to, owner, id), {
            preserveState: true,
        });
    };

    const createDashboard = (event: React.FormEvent) => {
        event.preventDefault();
        router.post(
            '/reports/dashboards',
            {
                name: newName,
                visibility: newVisibility,
                from,
                to,
                ...(owner ? { owner } : {}),
            },
            {
                onSuccess: () => {
                    setNewOpen(false);
                    setNewName('');
                    setNewVisibility('private');
                },
            },
        );
    };

    const addWidget = (key: string) => {
        if (!dashboard) {
            return;
        }

        router.post(
            `/reports/dashboards/${dashboard.id}/widgets`,
            { key },
            { preserveScroll: true },
        );
    };

    const removeWidget = (key: string) => {
        if (!dashboard) {
            return;
        }

        router.delete(`/reports/dashboards/${dashboard.id}/widgets`, {
            data: { key },
            preserveScroll: true,
        });
    };

    const deleteDashboard = () => {
        if (!dashboard) {
            return;
        }

        router.delete(`/reports/dashboards/${dashboard.id}`, {
            data: filterQuery(from, to, owner),
        });
    };

    const title = dashboard?.name ?? 'Reports';

    return (
        <>
            <ReportsShell
                title={title}
                pageTitle={title}
                description={`${window.from} → ${window.to} · ${window.days} days · ${window.timezone}. Real rows only — empty categories stay hidden.`}
                filters={
                    <form
                        onSubmit={apply}
                        className="flex flex-wrap items-end gap-2"
                        aria-label="Dashboard filters"
                    >
                        <label className="grid gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                            Owner
                            <select
                                value={owner}
                                onChange={(event) =>
                                    setOwner(event.target.value)
                                }
                                className="h-8 rounded-md border border-hairline bg-canvas px-2 text-[13px] normal-case text-ink"
                                aria-label="Owner"
                            >
                                <option value="">All owners</option>
                                {owners.map((person) => (
                                    <option
                                        key={person.id}
                                        value={person.id}
                                    >
                                        {person.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="grid gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                            From
                            <input
                                type="date"
                                name="from"
                                value={from}
                                max={to}
                                onChange={(event) =>
                                    setFrom(event.target.value)
                                }
                                className="h-8 rounded-md border border-hairline bg-canvas px-2 text-[13px] normal-case text-ink"
                            />
                        </label>
                        <label className="grid gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                            To
                            <input
                                type="date"
                                name="to"
                                value={to}
                                min={from}
                                onChange={(event) =>
                                    setTo(event.target.value)
                                }
                                className="h-8 rounded-md border border-hairline bg-canvas px-2 text-[13px] normal-case text-ink"
                            />
                        </label>
                        <button
                            type="submit"
                            className="h-8 rounded-md bg-brand px-3 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
                        >
                            Apply
                        </button>
                        {window.custom ? (
                            <button
                                type="button"
                                onClick={reset}
                                className="h-8 rounded-md border border-hairline bg-canvas px-3 text-[13px] text-muted-foreground transition-colors hover:text-ink"
                            >
                                Last 30 days
                            </button>
                        ) : null}
                    </form>
                }
                footer={`Reports window ${window.from} → ${window.to} · ${window.timezone}`}
            >
                    <nav
                        aria-label="Dashboards"
                        className="mb-8 flex flex-wrap items-center gap-2"
                    >
                        <button
                            type="button"
                            onClick={openRooms}
                            className={`h-8 rounded-md px-3 text-[13px] ${
                                dashboard
                                    ? 'border border-hairline bg-canvas text-muted-foreground hover:text-ink'
                                    : 'bg-brand text-white'
                            }`}
                        >
                            Rooms
                        </button>
                        {dashboards.map((board) => (
                            <button
                                key={board.id}
                                type="button"
                                onClick={() => openDashboard(board.id)}
                                className={`h-8 rounded-md px-3 text-[13px] ${
                                    dashboard?.id === board.id
                                        ? 'bg-brand text-white'
                                        : 'border border-hairline bg-canvas text-muted-foreground hover:text-ink'
                                }`}
                            >
                                {board.visibility === 'workspace' ? '◆ ' : board.visibility === 'team' ? '◇ ' : ''}
                                {board.name}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => setNewOpen(true)}
                            className="h-8 rounded-md border border-dashed border-hairline bg-canvas px-3 text-[13px] text-muted-foreground hover:text-ink"
                        >
                            New dashboard
                        </button>
                    </nav>
                    <section className="mb-6 rounded-lg border border-hairline bg-canvas p-3 text-sm">
                        <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Scheduled reports
                        </h2>
                        {schedules.length === 0 ? (
                            <p className="mb-2 text-[12px] text-muted-foreground">No schedules yet.</p>
                        ) : (
                            <ul className="mb-3 space-y-1 text-[12px]">
                                {schedules.map((schedule) => (
                                    <li key={schedule.id} className="flex flex-wrap items-center justify-between gap-2">
                                        <span>
                                            {schedule.name ?? 'Untitled'} · {schedule.cron} ·{' '}
                                            {schedule.active ? 'active' : 'paused'} · {schedule.last_status ?? 'never sent'}
                                        </span>
                                        <span className="flex gap-1">
                                            <form
                                                onSubmit={(event) => {
                                                    event.preventDefault();
                                                    router.put(`/reports/schedules/${schedule.id}`, {
                                                        recipients: schedule.recipients,
                                                        active: !schedule.active,
                                                    });
                                                }}
                                            >
                                                <button type="submit" className="text-brand">
                                                    {schedule.active ? 'Pause' : 'Resume'}
                                                </button>
                                            </form>
                                            <form
                                                onSubmit={(event) => {
                                                    event.preventDefault();
                                                    router.delete(`/reports/schedules/${schedule.id}`);
                                                }}
                                            >
                                                <button type="submit" className="text-destructive">
                                                    Delete
                                                </button>
                                            </form>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <form
                            className="grid gap-2 md:grid-cols-4"
                            onSubmit={(event) => {
                                event.preventDefault();
                                const form = event.currentTarget;
                                const recipients = String(new FormData(form).get('recipients') ?? '')
                                    .split(',')
                                    .map((value) => value.trim())
                                    .filter(Boolean);
                                router.post('/reports/schedules', {
                                    name: String(new FormData(form).get('name') ?? ''),
                                    saved_report_id: String(new FormData(form).get('saved_report_id') ?? '') || null,
                                    dashboard_id: dashboard?.id ?? null,
                                    cron: String(new FormData(form).get('cron') ?? '0 8 * * 1'),
                                    recipients,
                                    active: true,
                                });
                            }}
                        >
                            <input name="name" placeholder="Schedule name" className="h-8 rounded-md border border-hairline px-2 text-[13px]" />
                            <select name="saved_report_id" className="h-8 rounded-md border border-hairline px-2 text-[13px]">
                                <option value="">Saved report…</option>
                                {savedReports.map((report) => (
                                    <option key={report.id} value={report.id}>
                                        {report.name}
                                    </option>
                                ))}
                            </select>
                            <input name="cron" defaultValue="0 8 * * 1" className="h-8 rounded-md border border-hairline px-2 font-mono text-[12px]" />
                            <input name="recipients" placeholder="a@b.com, c@d.com" className="h-8 rounded-md border border-hairline px-2 text-[13px]" />
                            <button type="submit" className="h-8 rounded-md bg-brand px-3 text-[13px] text-white md:col-span-4">
                                Create schedule
                            </button>
                        </form>
                    </section>

                    {dashboard ? (
                        <section aria-label={dashboard.name}>
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                <p className="text-[12px] text-muted-foreground">
                                    {dashboard.owner.name
                                        ? `Owned by ${dashboard.owner.name}`
                                        : 'Saved dashboard'}
                                    {` · ${dashboard.widgets.length} widgets`}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPickerOpen(true)}
                                        className="h-8 rounded-md bg-brand px-3 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
                                    >
                                        Add widget
                                    </button>
                                    <button
                                        type="button"
                                        onClick={deleteDashboard}
                                        className="h-8 rounded-md border border-hairline bg-canvas px-3 text-[13px] text-muted-foreground hover:text-ink"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>

                            {dashboard.widgets.length === 0 ? (
                                <div className="rounded-lg border border-hairline bg-canvas px-4 py-10 text-center">
                                    <p className="text-sm font-medium">
                                        No widgets on this dashboard
                                    </p>
                                    <p className="mt-1 text-[13px] text-muted-foreground">
                                        Add an existing EvoViz chart from the
                                        rooms — pipeline, leads, outbound, ads,
                                        desk, or activity.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                    {dashboard.widgets.map((widget) => (
                                        <div
                                            key={widget.key}
                                            className="relative"
                                        >
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeWidget(widget.key)
                                                }
                                                className="absolute top-2 right-2 z-10 rounded-md border border-hairline bg-canvas px-2 py-0.5 text-[11px] text-muted-foreground hover:text-ink"
                                                aria-label={`Remove ${widget.title}`}
                                            >
                                                Remove
                                            </button>
                                            {widget.chart ? (
                                                <EvoVizChart
                                                    payload={widget.chart}
                                                />
                                            ) : (
                                                <div className="rounded-lg border border-hairline bg-canvas px-4 py-8 text-center">
                                                    <p className="text-[13px] font-medium text-ink">
                                                        {widget.title}
                                                    </p>
                                                    <p className="mt-1 text-[12px] text-muted-foreground">
                                                        No rows in this window
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    ) : categories.length === 0 ? (
                        <div className="rounded-lg border border-hairline bg-canvas px-4 py-10 text-center">
                            <p className="text-sm font-medium">
                                Nothing to report in this window
                            </p>
                            <p className="mt-1 text-[13px] text-muted-foreground">
                                Deals, leads, outbound sends, ad rows,
                                conversations, and activities appear here as
                                soon as they exist — no placeholders.
                            </p>
                        </div>
                    ) : (
                        <>
                            {categories.map((category) => (
                                <CategorySection
                                    key={category.key}
                                    category={category}
                                />
                            ))}
                            {outboundDetail ? (
                                <OutboundReportsDetail {...outboundDetail} />
                            ) : null}
                        </>
                    )}
            </ReportsShell>

            <Dialog open={newOpen} onOpenChange={setNewOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>New dashboard</DialogTitle>
                        <DialogDescription>
                            A saved board on top of the rooms. Add existing
                            EvoViz charts after you create it.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={createDashboard} className="grid gap-3">
                        <label className="grid gap-1 text-[11px] tracking-wide text-muted-foreground uppercase">
                            Name
                            <input
                                name="name"
                                required
                                value={newName}
                                onChange={(event) =>
                                    setNewName(event.target.value)
                                }
                                className="h-8 rounded-md border border-hairline bg-canvas px-2 text-[13px] text-ink normal-case"
                            />
                        </label>
                        <label className="grid gap-1 text-[11px] tracking-wide text-muted-foreground uppercase">
                            Sharing
                            <select
                                value={newVisibility}
                                onChange={(event) =>
                                    setNewVisibility(event.target.value as 'private' | 'team' | 'workspace')
                                }
                                className="h-8 rounded-md border border-hairline bg-canvas px-2 text-[13px] text-ink normal-case"
                            >
                                <option value="private">Private</option>
                                <option value="team">Team</option>
                                <option value="workspace">Workspace</option>
                            </select>
                        </label>
                        <button
                            type="submit"
                            className="h-8 rounded-md bg-brand px-3 text-[13px] font-medium text-white"
                        >
                            Create
                        </button>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
                <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add widget</DialogTitle>
                        <DialogDescription>
                            Existing EvoViz charts from the report rooms. No new
                            chart types.
                        </DialogDescription>
                    </DialogHeader>
                    <WidgetPicker
                        catalog={widgetCatalog}
                        addedKeys={
                            dashboard?.widgets.map((widget) => widget.key) ?? []
                        }
                        onAdd={addWidget}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}

Reports.layout = {
    breadcrumbs: [{ title: 'Reports', href: '/reports' }],
};
