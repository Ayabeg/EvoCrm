import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type PathStep = {
    key: string;
    label: string;
    status: string;
};

export function RecordPath({
    steps,
    current,
    onSelect,
    onComplete,
    completeLabel = 'Mark Status as Complete',
    disabled = false,
}: {
    steps: PathStep[];
    current: string;
    onSelect: (key: string) => void;
    onComplete?: () => void;
    completeLabel?: string;
    disabled?: boolean;
}) {
    const currentIndex = steps.findIndex((step) => step.key === current);
    const isComplete = currentIndex === steps.length - 1;

    return (
        <div className="mt-3 flex flex-col gap-2 lg:flex-row lg:items-center">
            <ol
                className="flex min-w-0 flex-1 overflow-x-auto"
                aria-label="Lead path"
            >
                {steps.map((step, index) => {
                    const state =
                        currentIndex < 0
                            ? 'upcoming'
                            : index < currentIndex
                              ? 'done'
                              : index === currentIndex
                                ? 'current'
                                : 'upcoming';
                    const first = index === 0;

                    return (
                        <li
                            key={step.key}
                            className="relative min-w-[6.5rem] flex-1"
                            style={{
                                zIndex: steps.length - index,
                                marginLeft: first ? 0 : -8,
                            }}
                        >
                            <button
                                type="button"
                                disabled={disabled}
                                aria-current={
                                    state === 'current' ? 'step' : undefined
                                }
                                onClick={() => onSelect(step.key)}
                                className={cn(
                                    'flex h-8 w-full items-center justify-center px-4 text-[12px] font-medium',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1',
                                    state === 'current' &&
                                        'bg-brand text-white',
                                    state === 'done' && 'bg-ink text-white',
                                    state === 'upcoming' &&
                                        'bg-canvas-soft text-mute',
                                    disabled && 'cursor-not-allowed opacity-70',
                                )}
                                style={{
                                    clipPath: first
                                        ? 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)'
                                        : 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%, 8px 50%)',
                                }}
                            >
                                <span className="truncate">{step.label}</span>
                            </button>
                        </li>
                    );
                })}
            </ol>
            {onComplete && !isComplete ? (
                <Button
                    type="button"
                    size="sm"
                    className="h-8 shrink-0"
                    disabled={disabled}
                    onClick={onComplete}
                >
                    {completeLabel}
                </Button>
            ) : null}
        </div>
    );
}
