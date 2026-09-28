import { Link } from '@inertiajs/react';
import { HomeWidgetEmpty } from '@/components/dashboard/home-widget';
import { RecordLink } from '@/ds/workspace/quick-record/RecordLink';
import type { DashboardWork } from '@/lib/dashboard-operating-home';
import { formatDashboardTime, relatedRecordRef } from '@/lib/dashboard-operating-home';
import { t } from '@/lib/i18n';
import { MOTION_HOVER_CLASS } from '@/lib/motion';
import { cn } from '@/lib/utils';

export function DashboardWork({ work }: { work: DashboardWork }) {
    const empty =
        work.counts.overdue === 0 &&
        work.counts.today === 0 &&
        work.counts.upcoming === 0;

    if (empty) {
        return (
            <HomeWidgetEmpty
                title={t('Nothing on your schedule')}
                body={t('Overdue, today, and upcoming work from your queue.')}
                action={
                    <Link
                        href={work.view_all_href}
                        className="text-[13px] leading-[18px] text-mute hover:text-ink"
                    >
                        {t('Open activities')}
                    </Link>
                }
            />
        );
    }

    return (
        <div>
            <p className="mb-2 text-[12px] leading-4 text-mute">
                <Link
                    href={work.overdue_href}
                    className="hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                >
                    {work.counts.overdue} {t('overdue')}
                </Link>
                {' · '}
                <Link
                    href={work.today_href}
                    className="hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                >
                    {work.counts.today} {t('today')}
                </Link>
                {' · '}
                <Link
                    href={work.upcoming_href}
                    className="hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                >
                    {work.counts.upcoming} {t('upcoming')}
                </Link>
            </p>
            <ul className="divide-y divide-hairline">
                {work.items.map((item) => {
                    const related = item.related[0] ?? null;
                    const record = relatedRecordRef(related);
                    const time = formatDashboardTime(item.due_at);
                    const overdue = item.group === 'overdue';

                    return (
                        <li
                            key={item.id}
                            className={cn(
                                'flex items-start gap-4 rounded-[10px] px-2 py-3',
                                '-mx-2 hover:bg-subtle',
                                MOTION_HOVER_CLASS,
                            )}
                        >
                            <time
                                className={cn(
                                    'w-12 shrink-0 pt-0.5 text-[13px] leading-[18px] font-medium tabular-nums',
                                    overdue ? 'text-destructive' : 'text-ink',
                                )}
                                dateTime={item.due_at ?? undefined}
                            >
                                {time || '—'}
                            </time>
                            <div className="min-w-0 flex-1">
                                <Link
                                    href={work.view_all_href}
                                    className="block truncate text-[15px] leading-[22px] font-semibold text-ink hover:underline focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                                >
                                    {item.subject}
                                </Link>
                                <p className="mt-0.5 truncate text-[12px] leading-4 text-mute">
                                    {overdue ? t('Overdue') : item.type}
                                    {related ? (
                                        <>
                                            {' · '}
                                            {record ? (
                                                <RecordLink
                                                    record={record}
                                                    mode="drawer"
                                                    className="text-mute hover:text-ink hover:underline"
                                                >
                                                    {related.label}
                                                </RecordLink>
                                            ) : (
                                                related.label
                                            )}
                                        </>
                                    ) : null}
                                </p>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
