import type { DragEvent, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Shared kanban chrome for the deals pipeline and the leads board.
 * Callers own drag payloads, move requests, and weighted math.
 */

const cardRadius = 'rounded-[var(--radius-1)]';
const motion =
    'duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)]';

export function PipelineKanban({
    children,
    className,
    busy = false,
}: {
    children: ReactNode;
    className?: string;
    busy?: boolean;
}) {
    return (
        <div
            className={cn(
                'flex min-h-[22rem] items-stretch overflow-x-auto',
                className,
            )}
            data-testid="pipeline-kanban"
            aria-busy={busy || undefined}
            aria-hidden={busy || undefined}
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
    onDragOver?: (event: DragEvent) => void;
    onDragLeave?: () => void;
    onDrop?: (event: DragEvent) => void;
    className?: string;
}) {
    return (
        <section
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            data-testid={testId}
            className={cn(
                'flex w-72 shrink-0 flex-col border-r border-hairline px-2.5 py-2 last:border-r-0',
                over &&
                    'bg-canvas-soft outline outline-1 outline-offset-[-1px] outline-[color-mix(in_srgb,var(--evosales-ink)_22%,var(--evosales-hairline))]',
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
        <header className="mb-2 px-0.5">
            <h2 className="truncate text-[13px] font-semibold tracking-tight text-ink">
                {name}
            </h2>
            <p className="mt-0.5 text-[11px] tabular-nums text-mute">
                {count} {count === 1 ? 'deal' : 'deals'}
            </p>
            {amount ? (
                <p className="money mt-1 break-words text-[13px] font-semibold tabular-nums text-ink">
                    {amount}
                </p>
            ) : null}
            {weighted ? (
                <p className="mt-0.5 text-[11px] text-mute">
                    Weighted <span className="money">{weighted}</span>
                    {probability != null ? ` · ${probability}%` : ''}
                </p>
            ) : null}
            <div
                className="mt-1.5 h-px w-full"
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
            aria-grabbed={dragging}
            className={cn(
                cardRadius,
                'cursor-grab select-none border border-hairline bg-canvas px-2.5 py-2 text-[13px] shadow-[var(--aurora-shadow-medium)]',
                'transition-[box-shadow,opacity,border-color]',
                motion,
                'hover:border-[color-mix(in_srgb,var(--evosales-ink)_16%,var(--evosales-hairline))] hover:shadow-[var(--aurora-shadow-strong)]',
                'active:cursor-grabbing',
                'motion-reduce:transition-none',
                dragging &&
                    'cursor-grabbing opacity-50 shadow-[var(--aurora-shadow-strong)]',
                className,
            )}
        >
            {children}
        </div>
    );
}

export function PipelineKanbanStack({ children }: { children: ReactNode }) {
    return <div className="grid min-h-16 gap-1.5">{children}</div>;
}

export function PipelineKanbanEmpty({
    label = 'No deals',
}: {
    label?: string;
}) {
    return (
        <p
            className={cn(
                cardRadius,
                'border border-dashed border-hairline px-2.5 py-3 text-center text-[11px] text-mute',
            )}
        >
            {label}
        </p>
    );
}
