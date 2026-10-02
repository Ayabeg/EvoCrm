import { EmptyState } from '@/evo/patterns/empty-state';
import { ChartFromPayload } from '@/evo/reports/ChartFromPayload';
import { Button } from '@/evo/ui/button';
import { t } from '@/lib/i18n';

import type { OpenDashboard } from './types';

export function DashboardView({
    dashboard,
    onAddWidget,
    onRemoveWidget,
    onDelete,
}: {
    dashboard: OpenDashboard;
    onAddWidget: () => void;
    onRemoveWidget: (key: string) => void;
    onDelete: () => void;
}) {
    return (
        <section aria-label={dashboard.name}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[12px] text-[var(--evo-ink-muted)]">
                    {dashboard.owner.name
                        ? t('Owned by :name', { name: dashboard.owner.name })
                        : t('Saved dashboard')}
                    {` · ${dashboard.widgets.length} ${t('widgets')}`}
                </p>
                <div className="flex items-center gap-2">
                    <Button type="button" size="sm" onClick={onAddWidget}>
                        {t('Add widget')}
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={onDelete}>
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
                                onClick={() => onRemoveWidget(widget.key)}
                                className="absolute top-2 right-2 z-10 rounded-[var(--evo-radius-compact)] border border-[var(--evo-hairline)] bg-[var(--evo-surface)] px-2 py-0.5 text-[11px] text-[var(--evo-ink-muted)] hover:text-[var(--evo-ink)]"
                                aria-label={t('Remove :title', { title: widget.title })}
                            >
                                {t('Remove')}
                            </button>
                            {widget.chart ? (
                                <ChartFromPayload payload={widget.chart} />
                            ) : (
                                <div className="border border-[var(--evo-hairline)] px-4 py-6">
                                    <p className="text-[13px] font-medium text-[var(--evo-ink)]">{widget.title}</p>
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
    );
}
