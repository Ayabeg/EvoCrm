/**
 * Evo Design System — RelatedRecords
 * Registry: custom Evo
 * License: MIT (original)
 */

import type { ReactNode } from 'react';
import { PropertyGroup } from '@/evo/crm/record/RecordProperties';
import type { RecordRelatedItem } from '@/evo/crm/record/types';
import { t } from '@/lib/i18n';

export function RelatedRecords({
    items,
    title = 'Related',
    empty = 'No related records',
    children,
}: {
    items?: RecordRelatedItem[];
    title?: string;
    empty?: string;
    children?: ReactNode;
}) {
    return (
        <PropertyGroup title={title}>
            {items && items.length > 0 ? (
                <ul className="space-y-1.5">
                    {items.map((item) => (
                        <li key={item.id}>
                            <a
                                href={item.href}
                                className="block min-w-0 rounded-[var(--evo-radius-compact)] px-1 py-1 hover:bg-[var(--evo-hover)] focus-visible:ring-2 focus-visible:ring-[var(--evo-focus)] focus-visible:outline-none"
                            >
                                <p className="truncate text-[13px] font-medium text-[var(--evo-ink)]">
                                    {item.label}
                                </p>
                                {item.meta ? (
                                    <p className="truncate text-[11px] text-[var(--evo-ink-muted)]">
                                        {item.meta}
                                    </p>
                                ) : null}
                            </a>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-[13px] text-[var(--evo-ink-muted)]">
                    {t(empty)}
                </p>
            )}
            {children}
        </PropertyGroup>
    );
}
