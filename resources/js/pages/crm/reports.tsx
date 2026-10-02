import { router } from '@inertiajs/react';
import { useState } from 'react';
import LeadOsGraphStatus from '@/components/crm/lead-os-graph-status';
import type { LeadOsGraphPayload } from '@/components/crm/lead-os-graph-status';
import LostReviewList from '@/components/crm/lost-review-list';
import type { LostReviewRow } from '@/components/crm/lost-review-list';
import { ReportsShell, reportsBasePath } from '@/components/crm/reports-shell';
import { OutboundReportsDetail } from '@/components/outbound/reports-detail';
import type { OutboundDetailProps } from '@/components/outbound/reports-detail';
import { EmptyState } from '@/evo/patterns/empty-state';
import {
    ChartFromPayload,
    DashboardNav,
    ReportRoomSection,
    ReportsFilters,
    SchedulePanel,
} from '@/evo/reports';
import type { ReportCategory, ReportSchedule, SavedReportRow } from '@/evo/reports';
import { Button } from '@/evo/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/evo/ui/dialog';
import { Input } from '@/evo/ui/input';
import { NativeSelect } from '@/evo/ui/native-select';
import { WidgetPicker } from '@/evoviz';
import type { EvoVizPayload, ReportWidgetCatalogItem } from '@/evoviz';
import { t } from '@/lib/i18n';

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
    schedules?: ReportSchedule[];
    savedReports?: SavedReportRow[];
    leadOsGraph?: LeadOsGraphPayload | null;
    lostReview?: LostReviewRow[];
};

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
    leadOsGraph = null,
    lostReview = [],
}: Props) {
    const reportsPath = reportsBasePath(activeCategory);
    const [from, setFrom] = useState(window.from);
    const [to, setTo] = useState(window.to);
    const [owner, setOwner] = useState(window.owner_id ? String(window.owner_id) : '');
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

        router.post(`/reports/dashboards/${dashboard.id}/widgets`, { key }, { preserveScroll: true });
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
                description={`${window.from} → ${window.to} · ${window.days} days · ${window.timezone}. Real rows only. Empty categories stay hidden.`}
                filters={
                    <ReportsFilters
                        from={from}
                        to={to}
                        owner={owner}
                        owners={owners}
                        custom={window.custom}
                        onFrom={setFrom}
                        onTo={setTo}
                        onOwner={setOwner}
                        onApply={apply}
                        onReset={reset}
                    />
                }
                footer={`${t('Reports')} ${window.from} → ${window.to} · ${window.timezone}`}
            >
                <LeadOsGraphStatus graph={leadOsGraph} compact />
                <LostReviewList items={lostReview} />
                <DashboardNav
                    dashboards={dashboards}
                    activeId={dashboard?.id}
                    onRooms={openRooms}
                    onOpen={openDashboard}
                    onNew={() => setNewOpen(true)}
                />
                <SchedulePanel
                    schedules={schedules}
                    savedReports={savedReports}
                    onToggle={(schedule) =>
                        router.put(`/reports/schedules/${schedule.id}`, {
                            recipients: schedule.recipients,
                            active: !schedule.active,
                        })
                    }
                    onDelete={(schedule) => router.delete(`/reports/schedules/${schedule.id}`)}
                    onCreate={(payload) =>
                        router.post('/reports/schedules', {
                            ...payload,
                            dashboard_id: dashboard?.id ?? null,
                            active: true,
                        })
                    }
                />

                {dashboard ? (
                    <section aria-label={dashboard.name}>
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[12px] text-[var(--evo-ink-muted)]">
                                {dashboard.owner.name
                                    ? t('Owned by :name', { name: dashboard.owner.name })
                                    : t('Saved dashboard')}
                                {` · ${dashboard.widgets.length} ${t('widgets')}`}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPickerOpen(true)}
                                    className="bg-brand h-8 rounded-md px-3 text-[13px] font-medium text-[var(--evo-on-primary)]"
                                >
                                    Add widget
                                </button>
                                <Button type="button" size="sm" variant="outline" onClick={deleteDashboard}>
                                    {t('Delete')}
                                </Button>
                            </div>
                        </div>

                        {dashboard.widgets.length === 0 ? (
                            <EmptyState
                                title={t('No widgets on this dashboard')}
                                description={t(
                                    'Add an existing EvoViz chart from the rooms: pipeline, leads, outbound, desk, or activity.',
                                )}
                                density="panel"
                            />
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {dashboard.widgets.map((widget) => (
                                    <div key={widget.key} className="relative">
                                        <button
                                            type="button"
                                            onClick={() => removeWidget(widget.key)}
                                            className="absolute top-2 right-2 z-10 rounded-[var(--evo-radius-compact)] border border-hairline bg-[var(--evo-surface)] px-2 py-0.5 text-[11px] text-[var(--evo-ink-muted)] hover:text-[var(--evo-ink)]"
                                            aria-label={t('Remove :title', { title: widget.title })}
                                        >
                                            {t('Remove')}
                                        </button>
                                        {widget.chart ? (
                                            <ChartFromPayload payload={widget.chart} />
                                        ) : (
                                            <div className="border border-hairline px-4 py-6">
                                                <p className="text-[13px] font-medium text-[var(--evo-ink)]">
                                                    {widget.title}
                                                </p>
                                                <p className="mt-1 text-[12px] text-[var(--evo-ink-muted)]">
                                                    {t('No rows in this window')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                ) : categories.length === 0 ? (
                    <EmptyState
                        title={t('Nothing to report in this window')}
                        description={t(
                            'Deals, leads, outbound sends, conversations, and activities appear here as soon as they exist. No placeholders.',
                        )}
                        density="panel"
                    />
                ) : (
                    <>
                        {categories.map((category) => (
                            <ReportRoomSection key={category.key} category={category} />
                        ))}
                        {outboundDetail ? <OutboundReportsDetail {...outboundDetail} /> : null}
                    </>
                )}
            </ReportsShell>

            <Dialog open={newOpen} onOpenChange={setNewOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('New dashboard')}</DialogTitle>
                        <DialogDescription>
                            {t(
                                'A saved board on top of the rooms. Add existing EvoViz charts after you create it.',
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={createDashboard} className="grid gap-3">
                        <label className="grid gap-1 text-[11px] tracking-wide text-[var(--evo-ink-muted)] uppercase">
                            {t('Name')}
                            <Input
                                name="name"
                                required
                                value={newName}
                                onChange={(event) => setNewName(event.target.value)}
                                className="h-8"
                            />
                        </label>
                        <label className="grid gap-1 text-[11px] tracking-wide text-[var(--evo-ink-muted)] uppercase">
                            {t('Sharing')}
                            <NativeSelect
                                value={newVisibility}
                                onChange={(event) =>
                                    setNewVisibility(event.target.value as 'private' | 'team' | 'workspace')
                                }
                                className="h-8"
                            >
                                <option value="private">{t('Private')}</option>
                                <option value="team">{t('Team')}</option>
                                <option value="workspace">{t('Workspace')}</option>
                            </NativeSelect>
                        </label>
                        <Button type="submit" variant="outline" size="sm">
                            {t('Create')}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
                <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{t('Add widget')}</DialogTitle>
                        <DialogDescription>
                            {t('Existing EvoViz charts from the report rooms. No new chart types.')}
                        </DialogDescription>
                    </DialogHeader>
                    <WidgetPicker
                        catalog={widgetCatalog}
                        addedKeys={dashboard?.widgets.map((widget) => widget.key) ?? []}
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
