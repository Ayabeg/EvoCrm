import { Link } from '@inertiajs/react';
import { HomeWidgetEmpty } from '@/components/dashboard/home-widget';
import { RecordLink } from '@/ds/workspace/quick-record/RecordLink';
import type { DashboardRecent } from '@/lib/dashboard-operating-home';
import { formatDashboardWhen } from '@/lib/dashboard-operating-home';
import { t } from '@/lib/i18n';
import { MOTION_HOVER_CLASS } from '@/lib/motion';
import { cn } from '@/lib/utils';

export function DashboardRecent({
    recent,
    canCreate = false,
}: {
    recent: DashboardRecent;
    canCreate?: boolean;
}) {
    if (recent.items.length === 0) {
        return (
            <HomeWidgetEmpty
                title={t('Nothing logged yet')}
                body={t('Newly logged notes, calls, and tasks appear here.')}
                action={
                    canCreate ? (
                        <Link
                            href="/crm/contacts?create=1"
                            className="text-[13px] leading-[18px] text-mute hover:text-ink"
                        >
                            {t('Create contact')}
                        </Link>
                    ) : undefined
                }
            />
        );
    }

    return (
        <ul className="divide-y divide-hairline">
            {recent.items.map((item) => (
                <li
                    key={item.id}
                    className={cn(
                        'flex items-baseline justify-between gap-4 rounded-[10px] px-2 py-2.5',
                        '-mx-2 hover:bg-subtle',
                        MOTION_HOVER_CLASS,
                    )}
                >
                    <div className="min-w-0">
                        {item.recordRef ? (
                            <RecordLink
                                record={item.recordRef}
                                mode="drawer"
                                className="block truncate text-start text-[14px] leading-5 font-medium text-ink hover:underline"
                                dir="auto"
                            >
                                {item.subject}
                            </RecordLink>
                        ) : (
                            <Link
                                href={recent.view_all_href}
                                className="block truncate text-[14px] leading-5 font-medium text-ink hover:underline focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                                dir="auto"
                            >
                                {item.subject}
                            </Link>
                        )}
                        <p className="mt-0.5 truncate text-[12px] leading-4 text-mute">
                            {item.type}
                            {item.related[0] ? ` · ${item.related[0].label}` : ''}
                        </p>
                    </div>
                    <time
                        className="shrink-0 text-[12px] leading-4 text-mute"
                        dateTime={item.at ?? undefined}
                    >
                        {formatDashboardWhen(item.at)}
                    </time>
                </li>
            ))}
        </ul>
    );
}
