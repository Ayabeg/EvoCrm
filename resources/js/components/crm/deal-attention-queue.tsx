import { useQuickRecord } from '@/ds/workspace/quick-record';
import type { DealAttentionQueueItem } from '@/lib/deal-attention';
import { attentionToneClass } from '@/lib/deal-attention';
import { t } from '@/lib/i18n';
import { applyAttentionFilter, fromActiveFilters, listQueryHref, navigateListQuery } from '@/lib/list-query';

export default function DealAttentionQueue({
    items,
    basePath,
    activeFilters,
    extraQuery = {},
}: {
    items: DealAttentionQueueItem[];
    basePath: string;
    activeFilters: Record<string, unknown>;
    extraQuery?: Record<string, string | number | null | undefined>;
}) {
    const { openRecord } = useQuickRecord();
    const current = fromActiveFilters(activeFilters, extraQuery);
    const viewAllHref = listQueryHref(
        basePath,
        applyAttentionFilter(current, 'needs_attention'),
        'deal',
    );

    if (items.length === 0) {
        return null;
    }

    return (
        <section
            className="border-b border-hairline bg-canvas"
            data-crm="deal-attention-queue"
            aria-labelledby="deal-attention-queue-heading"
        >
            <div className="flex items-center justify-between gap-3 px-4 py-2 md:px-8">
                <h2
                    id="deal-attention-queue-heading"
                    className="text-[12px] font-medium text-ink"
                >
                    {t('Needs attention')}
                </h2>
                <a
                    href={viewAllHref}
                    className="text-[12px] text-mute hover:text-ink hover:underline"
                    onClick={(event) => {
                        event.preventDefault();
                        navigateListQuery(
                            basePath,
                            current,
                            { filters: { attention: 'needs_attention' } },
                            'deal',
                        );
                    }}
                >
                    {t('View all')}
                </a>
            </div>
            <ul className="divide-y divide-hairline">
                {items.map((item) => (
                    <li key={item.id}>
                        <button
                            type="button"
                            className="flex w-full items-start justify-between gap-3 px-4 py-2 text-left hover:bg-canvas-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink md:px-8"
                            onClick={() =>
                                openRecord(
                                    { type: 'deal', id: item.id },
                                    { opener: null },
                                )
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
        </section>
    );
}
