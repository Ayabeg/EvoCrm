/**
 * Evo Design System — RecordPath (stage stepper)
 * Registry: custom Evo (ref: ReUI stepper)
 * Source: https://reui.io/components/stepper
 * License: MIT (original; ReUI stepper used as visual reference only)
 */

import type { RecordPathStep } from '@/evo/crm/record/types';
import { cn } from '@/evo/lib/cn';
import { t } from '@/lib/i18n';

export function RecordPath({
    steps,
    current,
    onSelect,
    label = 'Record path',
    disabled = false,
}: {
    steps: RecordPathStep[];
    current?: string;
    onSelect?: (id: string) => void;
    label?: string;
    disabled?: boolean;
}) {
    const currentIndex = steps.findIndex(
        (step) => step.id === current || step.current,
    );

    return (
        <nav
            className="shrink-0 border-b border-[var(--evo-hairline)] bg-[var(--evo-surface)] px-4 py-2 sm:px-6"
            aria-label={t(label)}
            data-evo="record-path"
        >
            <ol className="flex min-w-0 items-center gap-1 overflow-x-auto">
                {steps.map((step, index) => {
                    const state =
                        currentIndex < 0
                            ? 'upcoming'
                            : index < currentIndex
                              ? 'done'
                              : index === currentIndex
                                ? 'current'
                                : 'upcoming';
                    const isDisabled = disabled || step.disabled;

                    return (
                        <li
                            key={step.id}
                            className="flex min-w-0 items-center gap-1"
                        >
                            {index > 0 ? (
                                <span
                                    className="hidden h-px w-4 shrink-0 bg-[var(--evo-hairline)] sm:block"
                                    aria-hidden
                                />
                            ) : null}
                            <button
                                type="button"
                                disabled={isDisabled || !onSelect}
                                aria-current={
                                    state === 'current' ? 'step' : undefined
                                }
                                onClick={() => onSelect?.(step.id)}
                                className={cn(
                                    'h-8 shrink-0 rounded-[var(--evo-radius-compact)] px-2.5 text-[12px] font-medium',
                                    'focus-visible:ring-2 focus-visible:ring-[var(--evo-focus)] focus-visible:outline-none',
                                    state === 'current' &&
                                        'bg-[var(--evo-teal-soft)] text-[var(--evo-teal-ink)]',
                                    state === 'done' &&
                                        'bg-[var(--evo-surface-subtle)] text-[var(--evo-ink)]',
                                    state === 'upcoming' &&
                                        'text-[var(--evo-ink-muted)]',
                                    isDisabled &&
                                        'cursor-not-allowed opacity-70',
                                )}
                            >
                                <span className="truncate">{step.label}</span>
                            </button>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
