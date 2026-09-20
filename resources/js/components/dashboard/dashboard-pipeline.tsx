import { Link } from '@inertiajs/react';
import { HomeWidgetEmpty } from '@/components/dashboard/home-widget';
import type { DashboardPipeline } from '@/lib/dashboard-operating-home';
import { t } from '@/lib/i18n';
import { formatCompactDzd } from '@/lib/money';
import { MOTION_HOVER_CLASS } from '@/lib/motion';
import { cn } from '@/lib/utils';

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
                        className="text-[13px] leading-[18px] text-mute hover:text-ink"
                    >
                        {t('Create deal')}
                    </Link>
                }
            />
        );
    }

    return (
        <ul className="space-y-3">
            {pipeline.stages.map((stage) => {
                const width = Math.max((stage.count / max) * 100, stage.count > 0 ? 6 : 0);

                return (
                    <li key={stage.id} className="min-w-0">
                        <Link
                            href={stage.href}
                            className={cn(
                                'block min-w-0 rounded-[10px] px-2 py-1.5 no-underline',
                                '-mx-2 hover:bg-subtle',
                                MOTION_HOVER_CLASS,
                                'focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none',
                            )}
                        >
                            <div className="flex items-baseline justify-between gap-4">
                                <span className="truncate text-[13px] leading-[18px] font-medium text-ink">
                                    {stage.name}
                                </span>
                                <span className="money shrink-0 text-[12px] leading-4 text-mute">
                                    {stage.count} · {formatCompactDzd(stage.amount_cents)}
                                </span>
                            </div>
                            <div className="mt-1.5 h-1.5 overflow-hidden bg-subtle" aria-hidden>
                                <div className="h-full bg-ink/55" style={{ width: `${width}%` }} />
                            </div>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}
