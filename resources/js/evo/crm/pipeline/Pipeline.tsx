/**
 * Evo Design System — Pipeline board
 * Registry: custom Evo (ref: ReUI kanban) on dnd-kit
 * Source: https://reui.io/components/kanban
 * License: MIT (original; ReUI kanban used as visual reference only)
 * Dependencies: @dnd-kit/core, sortable, utilities, modifiers (already in tree, PR8)
 */

import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    closestCorners,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type {
    DragEndEvent,
    DragOverEvent,
    DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { frenchPipelineAnnouncements } from '@/evo/crm/pipeline/announcements';
import { PipelineDragOverlay } from '@/evo/crm/pipeline/DragOverlayCard';
import {
    PipelineColumn,
    PipelineColumnFooter,
} from '@/evo/crm/pipeline/PipelineColumn';
import type { PipelineColumnData } from '@/evo/crm/pipeline/types';
import { t } from '@/lib/i18n';

export type PipelineMove = {
    itemId: string;
    fromColumnId: string;
    toColumnId: string;
};

export function Pipeline({
    columns,
    itemsByColumn,
    renderCard,
    renderOverlay,
    onMove,
    loading = false,
    className,
    testId = 'pipeline-kanban',
    columnTestIdPrefix = 'stage-column',
    label = 'Pipeline board',
}: {
    columns: PipelineColumnData[];
    itemsByColumn: Record<string, string[]>;
    renderCard: (itemId: string, column: PipelineColumnData) => ReactNode;
    renderOverlay?: (itemId: string) => ReactNode;
    onMove?: (move: PipelineMove) => void;
    loading?: boolean;
    className?: string;
    testId?: string;
    columnTestIdPrefix?: string;
    label?: string;
}) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [overColumnId, setOverColumnId] = useState<string | null>(null);

    const itemColumn = useMemo(() => {
        const map = new Map<string, string>();

        for (const column of columns) {
            for (const id of itemsByColumn[column.id] ?? []) {
                map.set(id, column.id);
            }
        }

        return map;
    }, [columns, itemsByColumn]);

    const announcements = useMemo(
        () =>
            frenchPipelineAnnouncements(
                Object.entries(itemsByColumn).flatMap(([columnId, ids]) => {
                    const column = columns.find((row) => row.id === columnId);

                    return ids.map((id) => ({
                        id,
                        name: id,
                        column: column?.name,
                    }));
                }),
                columns.map((column) => ({
                    id: `column:${column.id}`,
                    name: column.name,
                })),
            ),
        [columns, itemsByColumn],
    );

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    function columnIdFrom(overId: string | number | undefined): string | null {
        if (overId == null) {
            return null;
        }

        const raw = String(overId);

        if (raw.startsWith('column:')) {
            return raw.slice('column:'.length);
        }

        return itemColumn.get(raw) ?? null;
    }

    function handleDragStart(event: DragStartEvent) {
        setActiveId(String(event.active.id));
    }

    function handleDragOver(event: DragOverEvent) {
        setOverColumnId(columnIdFrom(event.over?.id));
    }

    function handleDragEnd(event: DragEndEvent) {
        const itemId = String(event.active.id);
        const fromColumnId = itemColumn.get(itemId);
        const toColumnId = columnIdFrom(event.over?.id);

        setActiveId(null);
        setOverColumnId(null);

        if (!fromColumnId || !toColumnId || fromColumnId === toColumnId) {
            return;
        }

        onMove?.({ itemId, fromColumnId, toColumnId });
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            accessibility={{
                announcements,
                screenReaderInstructions: {
                    draggable: t(
                        'To pick up a card, press spacebar. Use the arrow keys to move. Press spacebar again to drop. Press escape to cancel.',
                    ),
                },
            }}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={() => {
                setActiveId(null);
                setOverColumnId(null);
            }}
        >
            <div
                className={
                    className ??
                    'flex min-h-[22rem] min-w-0 items-stretch overflow-x-auto overflow-y-hidden'
                }
                data-testid={testId}
                data-evo="pipeline"
                role="region"
                aria-label={t(label)}
                aria-busy={loading || undefined}
            >
                {columns.map((column) => {
                    const ids = itemsByColumn[column.id] ?? [];

                    return (
                        <PipelineColumn
                            key={column.id}
                            column={column}
                            itemIds={ids}
                            over={overColumnId === column.id}
                            testId={`${columnTestIdPrefix}-${column.slug ?? column.id}`}
                            footer={
                                <PipelineColumnFooter
                                    weighted={column.weighted}
                                    probability={column.probability}
                                />
                            }
                        >
                            {ids.map((id) => renderCard(id, column))}
                        </PipelineColumn>
                    );
                })}
            </div>
            <PipelineDragOverlay>
                {activeId && renderOverlay ? renderOverlay(activeId) : null}
            </PipelineDragOverlay>
        </DndContext>
    );
}
