/**
 * Evo Design System — PipelineCard
 * Registry: custom Evo (ref: ReUI kanban)
 * Source: https://reui.io/components/kanban
 * License: MIT (original; ReUI kanban used as visual reference only)
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';
import {
    isNestedInteractiveTarget,
    resolveRowActivation,
} from '@/ds/workspace/quick-record/row-peek';
import { cn } from '@/evo/lib/cn';

export function PipelineCard({
    id,
    children,
    href,
    label,
    onOpen,
    disabled = false,
    className,
    testId,
    dataAttention,
    dataAttentionSeverity,
}: {
    id: string;
    children: ReactNode;
    href?: string;
    label?: string;
    onOpen?: (opener?: HTMLElement) => void;
    disabled?: boolean;
    className?: string;
    testId?: string;
    dataAttention?: string;
    dataAttentionSeverity?: string;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id,
        disabled,
    });

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
        if (!onOpen || isDragging) {
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
            window.location.assign(href);

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
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
            }}
            aria-label={label}
            aria-grabbed={isDragging}
            data-testid={testId}
            data-attention={dataAttention}
            data-attention-severity={dataAttentionSeverity}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            className={cn(
                'cursor-grab rounded-[10px] border border-[var(--evo-hairline)] bg-[var(--evo-surface)] px-2.5 py-2 text-[13px] shadow-none select-none',
                'hover:border-[color-mix(in_srgb,var(--evo-ink)_16%,var(--evo-hairline))]',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evo-focus)]',
                'active:cursor-grabbing',
                isDragging && 'cursor-grabbing opacity-50',
                className,
            )}
            {...attributes}
            {...listeners}
            tabIndex={0}
        >
            {children}
        </div>
    );
}
