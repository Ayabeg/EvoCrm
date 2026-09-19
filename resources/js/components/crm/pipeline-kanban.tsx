import { router } from '@inertiajs/react';
import type { DragEvent, KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { useRef } from 'react';
import { pointerMovedPastThreshold } from '@/components/crm/pipeline-card-interaction';
import {
    isNestedInteractiveTarget,
    resolveRowActivation,
} from '@/ds/workspace/quick-record/row-peek';
import { cn } from '@/lib/utils';

/**
 * Shared kanban chrome for the deals pipeline and the tickets Help Desk board.
 * Callers own drag payloads, move requests, and weighted math.
 */

const cardRadius = 'rounded-[10px]';
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
                'flex min-h-[22rem] min-w-0 items-stretch overflow-x-auto overflow-y-hidden',
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
                'flex h-full min-h-0 w-[280px] min-w-[260px] max-w-[320px] shrink-0 flex-col overflow-y-auto border-r border-hairline px-2.5 py-2 last:border-r-0',
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
    void weighted;
    void probability;

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
    href,
    label,
    onDragStart,
    onDragEnd,
    onOpen,
    className,
}: {
    children: ReactNode;
    dragging: boolean;
    testId?: string;
    href?: string;
    label?: string;
    onDragStart: (event: DragEvent) => void;
    onDragEnd: () => void;
    onOpen?: (opener?: HTMLElement) => void;
    className?: string;
}) {
    const dragged = useRef(false);
    const origin = useRef<{ x: number; y: number } | null>(null);

    const activate = (
        event: {
            target: EventTarget | null;
            metaKey: boolean;
            ctrlKey: boolean;
            shiftKey: boolean;
            altKey: boolean;
            button?: number;
            preventDefault?: () => void;
        },
        opener: HTMLElement,
    ) => {
        if (dragged.current || !onOpen) {
            return;
        }

        const action = resolveRowActivation({
            peekEnabled: true,
            nestedInteractive: isNestedInteractiveTarget(event.target),
            metaOrCtrl: event.metaKey || event.ctrlKey,
            shiftOrAlt: event.shiftKey || event.altKey,
            middle: event.button === 1,
        });

        if (action === 'ignore') {
            return;
        }

        event.preventDefault?.();

        if (action === 'new-tab' && href) {
            window.open(href, '_blank', 'noopener,noreferrer');

            return;
        }

        if (action === 'visit' && href) {
            router.visit(href);

            return;
        }

        onOpen(opener);
    };

    const handleClick = (event: MouseEvent<HTMLDivElement>) => {
        activate(event, event.currentTarget);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== 'Enter') {
            return;
        }

        activate(event, event.currentTarget);
    };

    return (
        <div
            draggable
            tabIndex={0}
            aria-label={label}
            onPointerDown={(event) => {
                origin.current = { x: event.clientX, y: event.clientY };
            }}
            onPointerMove={(event) => {
                if (
                    origin.current &&
                    pointerMovedPastThreshold(origin.current, {
                        x: event.clientX,
                        y: event.clientY,
                    })
                ) {
                    dragged.current = true;
                }
            }}
            onPointerUp={() => {
                origin.current = null;
            }}
            onDragStart={(event) => {
                dragged.current = true;
                onDragStart(event);
            }}
            onDragEnd={() => {
                onDragEnd();
                window.setTimeout(() => {
                    dragged.current = false;
                    origin.current = null;
                }, 0);
            }}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            data-testid={testId}
            aria-grabbed={dragging}
            className={cn(
                cardRadius,
                'cursor-grab select-none border border-hairline bg-white px-2.5 py-2 text-[13px] shadow-none',
                'transition-[opacity,border-color]',
                motion,
                'hover:border-[color-mix(in_srgb,var(--evosales-ink)_16%,var(--evosales-hairline))]',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent)]',
                'active:cursor-grabbing',
                'motion-reduce:transition-none',
                dragging && 'cursor-grabbing opacity-50',
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
