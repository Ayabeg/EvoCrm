import type { DragEvent, MouseEvent, ReactNode } from 'react';
import { useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Shared kanban chrome for the deals pipeline and the tickets Help Desk board.
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
    unit = 'deal',
}: {
    name: string;
    count: number;
    amount?: string;
    weighted?: string;
    probability?: number;
    accent: string;
    unit?: string;
}) {
    return (
        <header className="mb-2 px-0.5">
            <div className="flex items-baseline justify-between gap-2">
                <h2 className="truncate text-[11px] font-semibold tracking-wide text-ink uppercase">
                    {name}
                </h2>
                <span className="shrink-0 text-[11px] tabular-nums text-mute">
                    {count}
                    <span className="sr-only">
                        {' '}
                        {count === 1 ? unit : `${unit}s`}
                    </span>
                </span>
            </div>
            {amount ? (
                <p className="money mt-1 break-words text-[13px] font-semibold tabular-nums text-ink">
                    {amount}
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

export function PipelineKanbanFooter({
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
        <footer className="mt-auto border-t border-hairline px-0.5 pt-2 text-[11px] text-mute">
            {amount ? (
                <p>
                    Total: <span className="money text-ink">{amount}</span>
                </p>
            ) : null}
            {weighted ? (
                <p className="mt-0.5">
                    Weighted: <span className="money text-ink">{weighted}</span>
                    {probability != null ? ` · ${probability}%` : ''}
                </p>
            ) : null}
        </footer>
    );
}

export function PipelineKanbanCard({
    children,
    dragging,
    testId,
    onDragStart,
    onDragEnd,
    onOpen,
    className,
}: {
    children: ReactNode;
    dragging: boolean;
    testId?: string;
    onDragStart: (event: DragEvent) => void;
    onDragEnd: () => void;
    onOpen?: () => void;
    className?: string;
}) {
    const dragged = useRef(false);

    const handleClick = (event: MouseEvent<HTMLDivElement>) => {
        if (dragged.current || !onOpen) {
            return;
        }

        const target = event.target as HTMLElement;

        if (target.closest('a, button, input, label')) {
            return;
        }

        onOpen();
    };

    return (
        <div
            draggable
            onDragStart={(event) => {
                dragged.current = true;
                onDragStart(event);
            }}
            onDragEnd={() => {
                onDragEnd();
                window.setTimeout(() => {
                    dragged.current = false;
                }, 0);
            }}
            onClick={handleClick}
            data-testid={testId}
            aria-grabbed={dragging}
            className={cn(
                cardRadius,
                'cursor-grab select-none border border-hairline bg-white px-2.5 py-2 text-[13px] shadow-[var(--aurora-shadow-medium)]',
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

export function PipelineKanbanStack({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return <div className={cn('grid min-h-16 flex-1 gap-1.5', className)}>{children}</div>;
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
