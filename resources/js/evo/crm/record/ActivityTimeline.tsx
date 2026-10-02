/**
 * Evo Design System — ActivityTimeline
 * Registry: custom Evo (ref: ReUI timeline)
 * Source: https://reui.io/components/timeline
 * License: MIT (original; ReUI timeline used as visual reference only)
 */

import type { ReactNode } from 'react';
import type { TimelineItem } from '@/evo/crm/record/types';
import { cn } from '@/evo/lib/cn';
import { formatDateTime } from '@/evo/lib/format';
import { t } from '@/lib/i18n';

export function ActivityTimeline({
    items,
    empty = 'No activity yet',
    children,
}: {
    items: TimelineItem[];
    empty?: string;
    children?: ReactNode;
}) {
    if (items.length === 0 && !children) {
        return (
            <p className="text-[13px] text-[var(--evo-ink-muted)]">
                {t(empty)}
            </p>
        );
    }

    return (
        <ol className="space-y-3" data-evo="activity-timeline">
            {items.map((item) => (
                <li
                    key={item.id}
                    className="relative border-b border-[var(--evo-hairline)] pb-3 last:border-0 last:pb-0"
                >
                    <p className="truncate text-[13px] font-medium text-[var(--evo-ink)]">
                        {item.title}
                    </p>
                    {item.body ? (
                        <p className="mt-0.5 line-clamp-2 text-[12px] text-[var(--evo-ink-secondary)]">
                            {item.body}
                        </p>
                    ) : null}
                    <p
                        className={cn(
                            'mt-1 text-[11px] text-[var(--evo-ink-muted)]',
                        )}
                    >
                        {[
                            item.type,
                            item.owner,
                            item.at ? formatDateTime(item.at) : null,
                        ]
                            .filter(Boolean)
                            .join(' · ')}
                    </p>
                </li>
            ))}
            {children}
        </ol>
    );
}
