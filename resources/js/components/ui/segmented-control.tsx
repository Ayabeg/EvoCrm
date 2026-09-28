import { motion, useReducedMotion } from 'motion/react';
import {
    createContext,
    useCallback,
    useContext,
    useId,
    useMemo,
    type KeyboardEvent,
    type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

/**
 * Local Astryx SegmentedControl fallback.
 *
 * @astryxdesign/core@0.6.3 peers `@stylexjs/stylex@^0.19` and its official
 * setup imports reset + theme CSS cascade layers. That fights this Vite +
 * Tailwind 4 + `shell-*` token app, so the public API is reimplemented here.
 *
 * Sources:
 * https://astryx.atmeta.com/docs/getting-started
 * https://astryx.atmeta.com/components/SegmentedControl
 * https://github.com/facebook/astryx/blob/main/packages/core/src/SegmentedControl/SegmentedControl.tsx
 */

export type SegmentedControlSize = 'sm' | 'md' | 'lg';
export type SegmentedControlLayout = 'hug' | 'fill';

type SegmentedControlContextValue = {
    instanceId: string;
    isDisabled: boolean;
    layout: SegmentedControlLayout;
    onChange: (value: string) => void;
    reduceMotion: boolean;
    size: SegmentedControlSize;
    value: string;
};

const SegmentedControlContext =
    createContext<SegmentedControlContextValue | null>(null);

function useSegmentedControlContext(): SegmentedControlContextValue {
    const context = useContext(SegmentedControlContext);

    if (!context) {
        throw new Error(
            'SegmentedControlItem must be used within SegmentedControl',
        );
    }

    return context;
}

const indicatorTransition = {
    duration: 0.15,
    ease: [0.2, 0.8, 0.2, 1] as const,
};

export type SegmentedControlProps = {
    children: ReactNode;
    className?: string;
    isDisabled?: boolean;
    label: string;
    layout?: SegmentedControlLayout;
    onChange: (value: string) => void;
    size?: SegmentedControlSize;
    value: string;
};

export function SegmentedControl({
    children,
    className,
    isDisabled = false,
    label,
    layout = 'hug',
    onChange,
    size = 'md',
    value,
    ...rest
}: SegmentedControlProps) {
    const instanceId = useId();
    const reduceMotion = useReducedMotion() === true;

    const handleKeyDown = useCallback(
        (event: KeyboardEvent<HTMLDivElement>) => {
            if (isDisabled) {
                return;
            }

            const target = event.currentTarget;
            const radios = Array.from(
                target.querySelectorAll<HTMLElement>(
                    '[role="radio"]:not([aria-disabled="true"])',
                ),
            );
            const active = document.activeElement;
            const index = radios.findIndex((radio) => radio === active);

            if (index < 0) {
                return;
            }

            let nextIndex = index;

            if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                nextIndex = (index + 1) % radios.length;
            } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                nextIndex = (index - 1 + radios.length) % radios.length;
            } else if (event.key === 'Home') {
                nextIndex = 0;
            } else if (event.key === 'End') {
                nextIndex = radios.length - 1;
            } else {
                return;
            }

            event.preventDefault();
            const next = radios[nextIndex];
            next?.focus();
            const nextValue = next?.dataset.value;

            if (nextValue && nextValue !== value) {
                onChange(nextValue);
            }
        },
        [isDisabled, onChange, value],
    );

    const contextValue = useMemo<SegmentedControlContextValue>(
        () => ({
            instanceId,
            isDisabled,
            layout,
            onChange,
            reduceMotion,
            size,
            value,
        }),
        [instanceId, isDisabled, layout, onChange, reduceMotion, size, value],
    );

    return (
        <SegmentedControlContext.Provider value={contextValue}>
            <div
                {...rest}
                aria-disabled={isDisabled || undefined}
                aria-label={label}
                className={cn(
                    'relative z-0 flex w-fit items-center justify-center gap-0.5 rounded-lg p-0.5',
                    'bg-[color-mix(in_srgb,var(--color-shell-ink)_8%,transparent)]',
                    layout === 'fill' && 'w-full',
                    isDisabled && 'pointer-events-none opacity-50',
                    className,
                )}
                data-layout={layout}
                data-segmented-control
                data-size={size}
                onKeyDown={handleKeyDown}
                role="radiogroup"
            >
                {children}
            </div>
        </SegmentedControlContext.Provider>
    );
}

export type SegmentedControlItemProps = {
    className?: string;
    icon?: ReactNode;
    isDisabled?: boolean;
    isLabelHidden?: boolean;
    label: string;
    value: string;
};

export function SegmentedControlItem({
    className,
    icon,
    isDisabled = false,
    isLabelHidden = false,
    label,
    value,
    ...rest
}: SegmentedControlItemProps) {
    const context = useSegmentedControlContext();
    const selected = context.value === value;
    const disabled = isDisabled || context.isDisabled;

    return (
        <button
            {...rest}
            aria-checked={selected}
            aria-disabled={disabled || undefined}
            aria-label={isLabelHidden ? label : undefined}
            className={cn(
                'relative z-0 inline-flex min-w-0 shrink-0 items-center justify-center gap-1 rounded-md border border-transparent font-medium whitespace-nowrap select-none',
                'text-shell-muted outline-none',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shell-orange',
                'motion-reduce:transition-none',
                context.layout === 'fill' && 'flex-1',
                context.size === 'sm' && 'h-7 px-1.5 text-[11px]',
                context.size === 'md' && 'h-8 px-2.5 text-[12px]',
                context.size === 'lg' && 'h-9 px-3 text-[13px]',
                selected
                    ? 'text-shell-ink'
                    : 'hover:text-shell-ink-2',
                disabled && 'cursor-default opacity-64',
                className,
            )}
            data-state={selected ? 'checked' : 'unchecked'}
            data-value={value}
            disabled={disabled}
            onClick={() => {
                if (!disabled && !selected) {
                    context.onChange(value);
                }
            }}
            role="radio"
            tabIndex={selected ? 0 : -1}
            type="button"
        >
            {selected ? (
                context.reduceMotion ? (
                    <span
                        aria-hidden
                        className="absolute inset-0 -z-10 rounded-md bg-[color-mix(in_srgb,var(--color-shell-ink)_14%,transparent)]"
                    />
                ) : (
                    <motion.span
                        aria-hidden
                        className="absolute inset-0 -z-10 rounded-md bg-[color-mix(in_srgb,var(--color-shell-ink)_14%,transparent)]"
                        layoutId={`${context.instanceId}-indicator`}
                        transition={indicatorTransition}
                    />
                )
            ) : null}
            {icon ? (
                <span
                    aria-hidden
                    className="inline-flex size-4 shrink-0 items-center justify-center [&_svg]:size-4"
                >
                    {icon}
                </span>
            ) : null}
            {isLabelHidden ? null : (
                <span className="min-w-0 truncate">{label}</span>
            )}
        </button>
    );
}

SegmentedControl.displayName = 'SegmentedControl';
SegmentedControlItem.displayName = 'SegmentedControlItem';
