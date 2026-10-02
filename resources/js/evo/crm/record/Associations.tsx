/**
 * Evo Design System — Associations
 * Registry: custom Evo
 * License: MIT (original)
 */

import type { ReactNode } from 'react';
import { fullRecordHref } from '@/ds/workspace/quick-record/ref';
import { PropertyGroup } from '@/evo/crm/record/RecordProperties';
import type { RecordAssociationItem } from '@/evo/crm/record/types';
import { t } from '@/lib/i18n';

export function Associations({
    items,
    title = 'Associations',
    empty = 'No associations',
    onOpen,
    children,
}: {
    items?: RecordAssociationItem[];
    title?: string;
    empty?: string;
    onOpen?: (item: RecordAssociationItem) => void;
    children?: ReactNode;
}) {
    return (
        <PropertyGroup title={title}>
            {items && items.length > 0 ? (
                <ul className="space-y-1.5">
                    {items.map((item) => {
                        const href = item.href ?? fullRecordHref(item.ref);

                        return (
                            <li key={`${item.ref.type}-${item.ref.id}`}>
                                <a
                                    href={href}
                                    className="block min-w-0 rounded-[var(--evo-radius-compact)] px-1 py-1 hover:bg-[var(--evo-hover)] focus-visible:ring-2 focus-visible:ring-[var(--evo-focus)] focus-visible:outline-none"
                                    onClick={(event) => {
                                        if (!onOpen) {
                                            return;
                                        }

                                        event.preventDefault();
                                        onOpen(item);
                                    }}
                                >
                                    <p className="truncate text-[13px] font-medium text-[var(--evo-ink)]">
                                        {item.label}
                                    </p>
                                    {item.hint ? (
                                        <p className="truncate text-[11px] text-[var(--evo-ink-muted)]">
                                            {item.hint}
                                        </p>
                                    ) : null}
                                </a>
                            </li>
                        );
                    })}
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
