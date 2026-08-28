import type { DragEvent, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Apple + Aurora kanban chrome for the deals board and leads kanban.
 * White (canvas) cards, hairline column gutters, Aurora radius/shadow/motion.
 * Does not own drag or weighted math — callers keep those.
 */

const cardRadius = 'rounded-[var(--radius-1)]';
const motion =
    'duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)]';

export function PipelineKanban({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex min-h-[28rem] items-stretch overflow-x-auto',
                className,
            )}
        >
            {children}
        </div>
    );
}

export function PipelineKanbanColumn({
    children,
    over = false,
    testId,
    onDragOver,
    onDragLeave,
    onDrop,
    className,
}: {
    children: ReactNode;
    over?: boolean;
    testId?: string;
    onDragOver: (event: DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (event: DragEvent) => void;
    className?: string;
}) {
    return (
        <section
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            data-testid={testId}
            className={cn(
                'flex w-72 shrink-0 flex-col border-r border-hairline px-3 py-1 last:border-r-0',
                over &&
                    'bg-[color-mix(in_srgb,var(--evosales-mark)_5%,transparent)]',
                className,
            )}
        >
            {children}
        </section>
    );
}

export function PipelineKanbanHeader({
    name,
    count,
    amount,
    weighted,
    probability,
    accent,
}: {
    name: string;
    count: number;
    amount?: string;
    weighted?: string;
    probability?: number;
    accent: string;
}) {
    return (
        <header className="mb-3 px-0.5">
            <div className="flex items-baseline justify-between gap-2">
                <h2 className="aurora-text-section truncate">{name}</h2>
                <span className="text-[12px] text-mute tabular-nums">
                    {count}
                </span>
            </div>
            {amount ? (
                <p className="money mt-1 text-[13px] text-ink">{amount}</p>
            ) : null}
            {weighted ? (
                <p className="mt-0.5 text-[11px] text-mute">
                    Weighted <span className="money">{weighted}</span>
                    {probability != null ? ` · ${probability}%` : ''}
                </p>
            ) : null}
            <div
                className="mt-2 h-px w-full"
                style={{ backgroundColor: accent }}
                aria-hidden
            />
        </header>
    );
}

export function PipelineKanbanCard({
    children,
    dragging,
    testId,
    onDragStart,
    onDragEnd,
    className,
}: {
    children: ReactNode;
    dragging: boolean;
    testId?: string;
    onDragStart: (event: DragEvent) => void;
    onDragEnd: () => void;
    className?: string;
}) {
    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            data-testid={testId}
            className={cn(
                cardRadius,
                'cursor-grab border border-hairline bg-canvas p-3.5 text-sm shadow-[var(--aurora-shadow-medium)]',
                'transition-[transform,box-shadow,opacity]',
                motion,
                'hover:-translate-y-px hover:shadow-[var(--aurora-shadow-strong)]',
                'active:cursor-grabbing',
                'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
                dragging && 'opacity-40',
                className,
            )}
        >
            {children}
        </div>
    );
}

export function PipelineKanbanStack({ children }: { children: ReactNode }) {
    return <div className="grid min-h-16 gap-2">{children}</div>;
}

export function PipelineKanbanEmpty() {
    return (
        <p
            className={cn(
                cardRadius,
                'border border-dashed border-hairline px-3 py-5 text-center text-[12px] text-mute',
            )}
        >
            Drop a card here
        </p>
    );
}
