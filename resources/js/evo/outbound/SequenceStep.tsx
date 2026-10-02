import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ReactNode } from 'react';
import { DotsSixVertical } from '@/evo/icons';
import { cn } from '@/evo/lib/cn';
import type { SequenceStepRow } from '@/evo/outbound/types';
import { Button } from '@/evo/ui/button';
import { t } from '@/lib/i18n';

export const STEP_TYPES = [
    { value: 'email', label: 'Automated email' },
    { value: 'whatsapp_cloud', label: 'WhatsApp template' },
    { value: 'call', label: 'Call task' },
    { value: 'meeting', label: 'Meeting' },
] as const;

export function typeLabel(step: SequenceStepRow): string {
    const type = step.step_type || step.channel;

    return t(
        STEP_TYPES.find((item) => item.value === type)?.label ??
            (step.channel === 'whatsapp_cloud' ? 'WhatsApp template' : 'Automated email'),
    );
}

export function SequenceStep({
    step,
    index,
    total,
    editing,
    editor,
    onEdit,
    onRemove,
}: {
    step: SequenceStepRow;
    index: number;
    total: number;
    editing: boolean;
    editor?: ReactNode;
    onEdit: () => void;
    onRemove: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: String(step.id),
    });

    return (
        <li
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
            }}
            className={cn('relative pl-8', isDragging && 'z-10 opacity-80')}
        >
            {index < total - 1 ? (
                <span
                    className="absolute top-8 bottom-0 left-[11px] w-px bg-[var(--evo-hairline)]"
                    aria-hidden
                />
            ) : null}
            <span className="absolute top-3 left-0 flex size-6 items-center justify-center rounded-full border border-[var(--evo-hairline)] bg-[var(--evo-canvas)] text-[11px] font-medium text-[var(--evo-ink)]">
                {step.position}
            </span>
            <div className="mb-4 rounded-[var(--evo-radius-standard)] border border-[var(--evo-hairline)] bg-[var(--evo-surface)] p-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2">
                        <button
                            type="button"
                            className="mt-0.5 inline-flex size-7 items-center justify-center rounded-[var(--evo-radius-compact)] text-[var(--evo-ink-muted)] hover:bg-[var(--evo-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-focus)]"
                            aria-label={t('Reorder step :position', { position: step.position })}
                            {...attributes}
                            {...listeners}
                        >
                            <DotsSixVertical className="size-4" aria-hidden />
                        </button>
                        <div>
                            <p className="text-[13px] font-medium text-[var(--evo-ink)]">
                                {typeLabel(step)}
                                <span className="ms-2 text-[11px] font-normal text-[var(--evo-ink-muted)]">
                                    {t('Wait :hours h', { hours: step.delay_hours })}
                                </span>
                            </p>
                            {step.subject ? (
                                <p className="mt-0.5 text-[12px] text-[var(--evo-ink-muted)]">
                                    A: {step.subject}
                                    {step.subject_b ? ` · B: ${step.subject_b}` : ''}
                                </p>
                            ) : null}
                            {step.wa_template_name ? (
                                <p className="text-[12px] text-[var(--evo-ink-muted)]">
                                    WA {step.wa_template_name} ({step.wa_template_language ?? 'fr'})
                                </p>
                            ) : null}
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
                            {editing ? t('Close') : t('Edit')}
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
                            {t('Remove')}
                        </Button>
                    </div>
                </div>
                {editing ? editor : null}
            </div>
        </li>
    );
}
