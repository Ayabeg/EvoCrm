import { Link } from '@inertiajs/react';
import { useQuickRecord } from '@/ds/workspace/quick-record';
import type { DashboardAttention } from '@/lib/dashboard-operating-home';
import { attentionToneClass } from '@/lib/deal-attention';
import { t } from '@/lib/i18n';
import { HomeWidgetEmpty } from '@/components/dashboard/home-widget';

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
                        className="text-[12px] font-medium text-brand hover:underline"
                    >
                        {t('View deals')}
                    </Link>
                }
            />
        );
    }

    return (
        <ul className="divide-y divide-hairline">
            {attention.items.map((item) => (
                <li key={item.id}>
                    <button
                        type="button"
                        className="flex w-full items-start justify-between gap-3 py-2 text-left first:pt-0 last:pb-0 hover:bg-canvas-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                        onClick={() =>
                            openRecord({ type: 'deal', id: item.id }, { opener: null })
                        }
                    >
                        <span className="min-w-0">
                            <a
                                href={item.href}
                                className="block truncate text-[13px] font-medium text-ink hover:underline"
                                onClick={(event) => event.stopPropagation()}
                            >
                                {item.title}
                            </a>
                            <span
                                className={`block truncate text-[12px] ${attentionToneClass(item.primary.severity)}`}
                            >
                                {item.primary.reason || item.primary.label}
                            </span>
                        </span>
                        <span
                            className={`shrink-0 text-[12px] ${attentionToneClass(item.primary.severity)}`}
                        >
                            {item.primary.label}
                        </span>
                    </button>
                </li>
            ))}
        </ul>
    );
}
