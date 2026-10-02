/**
 * Evo Design System — PipelineColumn
 * Registry: custom Evo (ref: ReUI kanban)
 * Source: https://reui.io/components/kanban
 * License: MIT (original; ReUI kanban used as visual reference only)
 */

/* eslint-disable react-hooks/incompatible-library -- TanStack Virtual is the approved column virtualizer */
import { useDroppable } from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import type { ReactNode } from 'react';
import type { PipelineColumnData } from '@/evo/crm/pipeline/types';
import { cn } from '@/evo/lib/cn';
import { t } from '@/lib/i18n';

const VIRTUALIZE_AFTER = 12;
const ESTIMATED_CARD = 88;

export function PipelineColumn({
    column,
    itemIds,
    children,
    footer,
    over = false,
    testId,
    className,
}: {
    column: PipelineColumnData;
    itemIds: string[];
    children: ReactNode;
    footer?: ReactNode;
    over?: boolean;
    testId?: string;
    className?: string;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: `column:${column.id}` });
    const scrollRef = useRef<HTMLDivElement>(null);
    const virtual = itemIds.length > VIRTUALIZE_AFTER;
    const virtualizer = useVirtualizer({
        count: itemIds.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => ESTIMATED_CARD,
        overscan: 6,
        enabled: virtual,
    });

    return (
        <section
            ref={setNodeRef}
            data-testid={testId}
            className={cn(
                'flex h-full min-h-0 w-[280px] max-w-[320px] min-w-[260px] shrink-0 flex-col overflow-hidden border-r border-[var(--evo-hairline)] px-2.5 py-2 last:border-r-0',
                (over || isOver) &&
                    'bg-[var(--evo-surface-subtle)] outline outline-1 outline-offset-[-1px] outline-[color-mix(in_srgb,var(--evo-ink)_22%,var(--evo-hairline))]',
                className,
            )}
        >
            <header className="mb-2 px-0.5">
                <div className="flex items-baseline justify-between gap-2">
                    <h2 className="truncate text-[11px] font-semibold tracking-wide text-[var(--evo-ink)] uppercase">
                        {column.name}
                    </h2>
                    <span className="shrink-0 text-[11px] text-[var(--evo-ink-muted)] tabular-nums">
                        {column.count}
                    </span>
                </div>
                {column.amount ? (
                    <p className="mt-1 text-[13px] font-semibold break-words text-[var(--evo-ink)] tabular-nums">
                        {column.amount}
                    </p>
                ) : null}
                <div
                    className="mt-1.5 h-px w-full"
                    style={{ backgroundColor: column.accent }}
                    aria-hidden
                />
            </header>

            <SortableContext
                items={itemIds}
                strategy={verticalListSortingStrategy}
            >
                <div
                    ref={scrollRef}
                    className="min-h-0 min-h-16 flex-1 overflow-y-auto"
                >
                    {itemIds.length === 0 ? (
                        <p className="rounded-[10px] border border-dashed border-[var(--evo-hairline)] px-2.5 py-3 text-center text-[11px] text-[var(--evo-ink-muted)]">
                            {t('No deals')}
                        </p>
                    ) : virtual ? (
                        <div
                            className="relative"
                            style={{ height: virtualizer.getTotalSize() }}
                        >
                            {virtualizer.getVirtualItems().map((row) => (
                                <div
                                    key={itemIds[row.index]}
                                    className="absolute top-0 left-0 w-full pb-1.5"
                                    style={{
                                        transform: `translateY(${row.start}px)`,
                                    }}
                                    data-index={row.index}
                                    ref={virtualizer.measureElement}
                                >
                                    {Array.isArray(children)
                                        ? children[row.index]
                                        : null}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid gap-1.5">{children}</div>
                    )}
                </div>
            </SortableContext>

            {footer}
        </section>
    );
}

export function PipelineColumnFooter({
    amount,
    weighted,
    probability,
}: {
    amount?: string;
    weighted?: string;
    probability?: number;
}) {
    if (!amount && !weighted) {
        return null;
    }

    return (
        <footer className="mt-auto border-t border-[var(--evo-hairline)] px-0.5 pt-2 text-[11px] text-[var(--evo-ink-muted)]">
            {amount ? (
                <p>
                    {t('Total')}:{' '}
                    <span className="text-[var(--evo-ink)] tabular-nums">
                        {amount}
                    </span>
                </p>
            ) : null}
            {weighted ? (
                <p className="mt-0.5">
                    {t('Weighted')}:{' '}
                    <span className="text-[var(--evo-ink)] tabular-nums">
                        {weighted}
                    </span>
                    {probability != null ? ` · ${probability}%` : ''}
                </p>
            ) : null}
        </footer>
    );
}
