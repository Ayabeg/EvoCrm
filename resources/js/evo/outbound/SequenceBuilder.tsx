import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { SequenceStep, STEP_TYPES } from '@/evo/outbound/SequenceStep';
import type { SequenceStepRow } from '@/evo/outbound/types';
import { Button } from '@/evo/ui/button';
import { t } from '@/lib/i18n';

export { SequenceStep, STEP_TYPES, typeLabel } from '@/evo/outbound/SequenceStep';

export type SequenceBuilderProps = {
    steps: SequenceStepRow[];
    onReorder?: (orderedIds: Array<string | number>) => void;
    onRemove?: (step: SequenceStepRow) => void;
    renderEditor?: (step: SequenceStepRow) => ReactNode;
    renderCreate?: (type: string) => ReactNode;
    creating?: boolean;
    onToggleCreate?: () => void;
};

export function frenchSortableAnnouncements(steps: SequenceStepRow[]) {
    const nameOf = (id: string | number) => {
        const step = steps.find((item) => String(item.id) === String(id));

        return step ? (step.subject || step.wa_template_name || String(step.position)) : String(id);
    };

    const positionOf = (id: string | number) => {
        const index = steps.findIndex((item) => String(item.id) === String(id));

        return index >= 0 ? index + 1 : 0;
    };

    return {
        onDragStart({ active }: { active: { id: string | number } }) {
            return t('Picked up step :position, :name', {
                position: positionOf(active.id),
                name: nameOf(active.id),
            });
        },
        onDragOver({ active, over }: { active: { id: string | number }; over: { id: string | number } | null }) {
            if (!over) {
                return;
            }

            return t('Step :name is over position :position', {
                name: nameOf(active.id),
                position: positionOf(over.id),
            });
        },
        onDragEnd({ active, over }: { active: { id: string | number }; over: { id: string | number } | null }) {
            if (!over) {
                return t('Reordering cancelled for step :name', { name: nameOf(active.id) });
            }

            return t('Step :name dropped at position :position', {
                name: nameOf(active.id),
                position: positionOf(over.id),
            });
        },
        onDragCancel({ active }: { active: { id: string | number } }) {
            return t('Reordering cancelled for step :name', { name: nameOf(active.id) });
        },
    };
}

export function SequenceBuilder({
    steps,
    onReorder,
    onRemove,
    renderEditor,
    renderCreate,
    creating,
    onToggleCreate,
}: SequenceBuilderProps) {
    const [editing, setEditing] = useState<string | null>(null);
    const [newType, setNewType] = useState('email');
    const ids = useMemo(() => steps.map((step) => String(step.id)), [steps]);
    const announcements = useMemo(() => frenchSortableAnnouncements(steps), [steps]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const oldIndex = ids.indexOf(String(active.id));
        const newIndex = ids.indexOf(String(over.id));

        if (oldIndex < 0 || newIndex < 0) {
            return;
        }

        onReorder?.(arrayMove(ids, oldIndex, newIndex));
    }

    return (
        <section data-testid="sequence-step-editor" className="space-y-4">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                accessibility={{
                    announcements,
                    screenReaderInstructions: {
                        draggable: t(
                            'To pick up a step, press spacebar. Use the arrow keys to move. Press spacebar again to drop. Press escape to cancel.',
                        ),
                    },
                }}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                    <ol className="space-y-0">
                        {steps.map((step, index) => (
                            <SequenceStep
                                key={step.id}
                                step={step}
                                index={index}
                                total={steps.length}
                                editing={editing === String(step.id)}
                                editor={renderEditor?.(step)}
                                onEdit={() =>
                                    setEditing((current) =>
                                        current === String(step.id) ? null : String(step.id),
                                    )
                                }
                                onRemove={() => onRemove?.(step)}
                            />
                        ))}
                    </ol>
                </SortableContext>
            </DndContext>

            {steps.length === 0 ? (
                <p className="text-[13px] text-[var(--evo-ink-muted)]">
                    {t('No steps yet. Add an automated email, call, meeting, or WhatsApp template.')}
                </p>
            ) : null}

            {creating ? (
                <div className="rounded-[var(--evo-radius-standard)] border border-[var(--evo-hairline)] p-3">
                    <div className="mb-3 flex flex-wrap gap-2">
                        {STEP_TYPES.map((item) => (
                            <Button
                                key={item.value}
                                type="button"
                                size="sm"
                                variant={newType === item.value ? 'secondary' : 'ghost'}
                                onClick={() => setNewType(item.value)}
                            >
                                {t(item.label)}
                            </Button>
                        ))}
                    </div>
                    {renderCreate?.(newType)}
                </div>
            ) : (
                <Button type="button" variant="outline" size="sm" onClick={onToggleCreate}>
                    {t('Add step')}
                </Button>
            )}
        </section>
    );
}
