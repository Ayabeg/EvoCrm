import { Link } from '@inertiajs/react';
import { HomeWidgetEmpty } from '@/components/dashboard/home-widget';
import type { DashboardPipeline } from '@/lib/dashboard-operating-home';
import { t } from '@/lib/i18n';
import { formatCompactDzd } from '@/lib/money';
import { MOTION_HOVER_CLASS } from '@/lib/motion';
import { cn } from '@/lib/utils';

function stageShare(amount: number, total: number): number {
    if (total <= 0 || amount <= 0) {
        return 0;
    }

    return Math.round((amount / total) * 100);
}

export function DashboardPipeline({ pipeline }: { pipeline: DashboardPipeline }) {
    const empty = pipeline.deal_count === 0;
    const total = Math.max(pipeline.amount_cents, 1);
    let largestId = pipeline.stages[0]?.id ?? 0;
    let largestAmount = pipeline.stages[0]?.amount_cents ?? 0;
    for (const stage of pipeline.stages) {
        if (stage.amount_cents > largestAmount) {
            largestId = stage.id;
            largestAmount = stage.amount_cents;
        }
    }
    const distributed = pipeline.stages.filter((stage) => stage.amount_cents > 0);

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
        <div>
            <div
                className="flex h-2.5 overflow-hidden rounded-[4px] bg-subtle"
                role="img"
                aria-label={t(':amount open · :count deals', {
                    amount: formatCompactDzd(pipeline.amount_cents),
                    count: pipeline.deal_count,
                })}
            >
                {distributed.map((stage, index) => {
                    const width = Math.max((stage.amount_cents / total) * 100, 3);
                    const lead = stage.id === largestId;

                    return (
                        <div
                            key={stage.id}
                            className={cn(
                                'h-full min-w-0',
                                lead ? 'bg-brand' : index % 2 === 0 ? 'bg-ink/30' : 'bg-ink/15',
                            )}
                            style={{ width: `${width}%` }}
                            title={`${stage.name} · ${formatCompactDzd(stage.amount_cents)}`}
                        />
                    );
                })}
            </div>

            <ul className="mt-4 divide-y divide-hairline">
                {pipeline.stages.map((stage) => {
                    const share = stageShare(stage.amount_cents, pipeline.amount_cents);

                    return (
                        <li key={stage.id} className="min-w-0">
                            <Link
                                href={stage.href}
                                className={cn(
                                    'flex items-baseline justify-between gap-4 rounded-[10px] px-2 py-2.5 no-underline',
                                    '-mx-2 hover:bg-subtle',
                                    MOTION_HOVER_CLASS,
                                    'focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none',
                                )}
                            >
                                <span className="flex min-w-0 items-baseline gap-2">
                                    <span
                                        className={cn(
                                            'mt-px size-1.5 shrink-0 rounded-full',
                                            stage.id === largestId ? 'bg-brand' : 'bg-ink/30',
                                        )}
                                        aria-hidden
                                    />
                                    <span className="truncate text-[13px] leading-[18px] font-medium text-ink">
                                        {stage.name}
                                    </span>
                                </span>
                                <span className="money shrink-0 text-[12px] leading-4 text-mute">
                                    {stage.count}
                                    {' · '}
                                    {formatCompactDzd(stage.amount_cents)}
                                    {share > 0 ? ` · ${share}%` : ''}
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
