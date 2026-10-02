import { Link } from '@inertiajs/react';
import { HomeWidgetEmpty } from '@/components/dashboard/home-widget';
import { useQuickRecord } from '@/ds/workspace/quick-record';
import {
    HOME_ATTENTION_VISIBLE,
    type DashboardAttention,
} from '@/lib/dashboard-operating-home';
import { t } from '@/lib/i18n';
import { MOTION_HOVER_CLASS } from '@/lib/motion';
import { cn } from '@/lib/utils';

function stateClass(severity: string): string {
    return severity === 'critical' ? 'text-destructive' : 'text-mute';
}

export function DashboardAttention({
    attention,
}: {
    attention: DashboardAttention;
}) {
    const { openRecord } = useQuickRecord();

    if (attention.items.length === 0) {
        return (
            <HomeWidgetEmpty
                title={t('No deal exceptions')}
                body={t('Overdue activities and deals without a next action appear here.')}
                action={
                    <Link
                        href={attention.view_all_href}
                        className="text-[13px] leading-[18px] text-mute hover:text-ink"
                    >
                        {t('View deals')}
                    </Link>
                }
            />
        );
    }

    const visible = attention.items.slice(0, HOME_ATTENTION_VISIBLE);

    return (
        <ul className="divide-y divide-hairline">
            {visible.map((item) => {
                const reason = item.primary.reason?.trim() ?? '';

                return (
                    <li key={item.id}>
                        <button
                            type="button"
                            className={cn(
                                'flex w-full items-start justify-between gap-4 rounded-[10px] px-2 py-3 text-start',
                                '-mx-2 hover:bg-subtle',
                                MOTION_HOVER_CLASS,
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                            )}
                            onClick={() =>
                                openRecord({ type: 'deal', id: item.id }, { opener: null })
                            }
                        >
                            <span className="min-w-0">
                                <a
                                    href={item.href}
                                    className="block truncate text-[15px] leading-[22px] font-semibold text-ink hover:underline"
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    {item.title}
                                </a>
                                <span className="mt-0.5 block truncate text-[13px] leading-[18px]">
                                    {reason !== '' ? (
                                        <span className="text-ink/80">{reason}</span>
                                    ) : null}
                                    {reason !== '' ? (
                                        <span className="text-mute"> · </span>
                                    ) : null}
                                    <span className={stateClass(item.primary.severity)}>
                                        {item.primary.label}
                                    </span>
                                </span>
                            </span>
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}
