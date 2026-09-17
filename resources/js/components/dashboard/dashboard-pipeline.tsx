import { Link } from '@inertiajs/react';
import { HomeWidgetEmpty } from '@/components/dashboard/home-widget';
import type { DashboardPipeline } from '@/lib/dashboard-operating-home';
import { t } from '@/lib/i18n';
import { formatCompactDzd } from '@/lib/money';

export function DashboardPipeline({ pipeline }: { pipeline: DashboardPipeline }) {
    const max = Math.max(...pipeline.stages.map((stage) => stage.count), 1);
    const empty = pipeline.deal_count === 0;

    if (empty) {
        return (
            <HomeWidgetEmpty
                title={t('No open deals')}
                body={t('Stages chart here once a deal is in the pipeline.')}
                action={
                    <Link
                        href="/crm/deals?create=1"
                        className="text-[12px] font-medium text-brand hover:underline"
                    >
                        {t('Create deal')}
                    </Link>
                }
            />
        );
    }

    return (
        <ul className="space-y-2">
            {pipeline.stages.map((stage) => {
                const width = Math.max((stage.count / max) * 100, stage.count > 0 ? 6 : 0);

                return (
                    <li key={stage.id} className="min-w-0">
                        <Link href={stage.href} className="block min-w-0 no-underline hover:bg-canvas-soft">
                            <div className="flex items-baseline justify-between gap-3">
                                <span className="truncate text-[12px] text-ink">{stage.name}</span>
                                <span className="money shrink-0 text-[11px] text-mute">
                                    {stage.count} · {formatCompactDzd(stage.amount_cents)}
                                </span>
                            </div>
                            <div className="mt-1 h-2 overflow-hidden bg-canvas-soft" aria-hidden>
                                <div className="h-full bg-ink/70" style={{ width: `${width}%` }} />
                            </div>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}
