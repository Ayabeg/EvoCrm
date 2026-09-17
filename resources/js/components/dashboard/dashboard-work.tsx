import { Link } from '@inertiajs/react';
import { RecordLink } from '@/ds/workspace/quick-record/RecordLink';
import type { DashboardWork } from '@/lib/dashboard-operating-home';
import { formatDashboardWhen, relatedRecordRef } from '@/lib/dashboard-operating-home';
import { t } from '@/lib/i18n';
import { HomeWidgetEmpty } from '@/components/dashboard/home-widget';

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
                        className="text-[12px] font-medium text-brand hover:underline"
                    >
                        {t('Open activities')}
                    </Link>
                }
            />
        );
    }

    return (
        <div className="space-y-3">
            <p className="text-[12px] text-mute">
                <Link href={work.overdue_href} className="hover:underline">
                    {work.counts.overdue} {t('overdue')}
                </Link>
                {' · '}
                <Link href={work.today_href} className="hover:underline">
                    {work.counts.today} {t('today')}
                </Link>
                {' · '}
                <Link href={work.upcoming_href} className="hover:underline">
                    {work.counts.upcoming} {t('upcoming')}
                </Link>
            </p>
            <ul className="divide-y divide-hairline">
                {work.items.map((item) => {
                    const related = item.related[0] ?? null;
                    const record = relatedRecordRef(related);

                    return (
                        <li key={item.id} className="flex items-start justify-between gap-3 py-2 first:pt-0 last:pb-0">
                            <div className="min-w-0">
                                <Link
                                    href={work.view_all_href}
                                    className="block truncate text-[13px] font-medium text-ink hover:underline"
                                >
                                    {item.subject}
                                </Link>
                                <p className="truncate text-[12px] text-mute">
                                    {item.group === 'overdue' ? t('Overdue') : item.type}
                                    {item.due_at ? ` · ${formatDashboardWhen(item.due_at)}` : ''}
                                </p>
                            </div>
                            {record && related ? (
                                <RecordLink
                                    record={record}
                                    mode="drawer"
                                    className="max-w-[9rem] shrink-0 truncate text-left text-[12px] text-mute hover:text-ink hover:underline"
                                >
                                    {related.label}
                                </RecordLink>
                            ) : null}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
