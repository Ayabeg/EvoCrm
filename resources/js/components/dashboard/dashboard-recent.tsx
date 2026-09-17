import { Link } from '@inertiajs/react';
import { HomeWidgetEmpty } from '@/components/dashboard/home-widget';
import { RecordLink } from '@/ds/workspace/quick-record/RecordLink';
import type { DashboardRecent } from '@/lib/dashboard-operating-home';
import { formatDashboardWhen } from '@/lib/dashboard-operating-home';
import { t } from '@/lib/i18n';

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
                            className="text-[12px] font-medium text-brand hover:underline"
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
                <li key={item.id} className="flex items-baseline justify-between gap-3 py-2 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                        {item.recordRef ? (
                            <RecordLink
                                record={item.recordRef}
                                mode="drawer"
                                className="block truncate text-left text-[13px] font-medium text-ink hover:underline"
                            >
                                {item.subject}
                            </RecordLink>
                        ) : (
                            <Link
                                href={recent.view_all_href}
                                className="block truncate text-[13px] font-medium text-ink hover:underline"
                            >
                                {item.subject}
                            </Link>
                        )}
                        <p className="truncate text-[12px] text-mute">
                            {item.type}
                            {item.related[0] ? ` · ${item.related[0].label}` : ''}
                        </p>
                    </div>
                    <time className="shrink-0 text-[11px] text-mute" dateTime={item.at ?? undefined}>
                        {formatDashboardWhen(item.at)}
                    </time>
                </li>
            ))}
        </ul>
    );
}
