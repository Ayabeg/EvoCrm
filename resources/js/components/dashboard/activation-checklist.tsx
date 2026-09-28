import { Link, router } from '@inertiajs/react';
import { Check } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import {
    activationProgressLabel,
    activationProgressValue,
} from '@/lib/activation';
import type { ActivationState, ActivationStep } from '@/lib/activation';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function ActivationChecklist({ activation }: { activation: ActivationState }) {
    if (!activation.visible) {
        return null;
    }

    const { progress, collapsed, activated } = activation;
    const label = activationProgressLabel(progress);
    const percent = activationProgressValue(progress);
    const currentStepId = activation.steps.find((step) => !step.complete)?.id;

    return (
        <section
            className={cn(
                'home-module mb-4 overflow-hidden px-5 md:px-6',
                activated ? 'flex h-14 items-center' : 'py-3',
            )}
            aria-labelledby="activation-title"
            data-activation="checklist"
        >
            <header
                className={cn(
                    'flex w-full items-center justify-between gap-3',
                    !activated && 'flex-wrap items-start py-1',
                )}
            >
                <div className="min-w-0">
                    <h2
                        id="activation-title"
                        className={cn(
                            'tracking-tight text-ink',
                            activated
                                ? 'text-[13px] leading-[18px] font-medium'
                                : 'text-[15px] leading-[22px] font-semibold',
                        )}
                    >
                        {activated ? t('Workspace ready') : t('Get started')}
                    </h2>
                    {activated ? null : (
                        <p className="mt-0.5 text-[12px] leading-4 text-mute">
                            {t('Finish the first sales loop in this workspace.')}
                        </p>
                    )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <p className="text-[12px] leading-4 tabular-nums text-mute" aria-hidden>
                        {label}
                    </p>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[12px]"
                        onClick={() =>
                            router.post(
                                activation.dismiss_href,
                                {},
                                { preserveScroll: true },
                            )
                        }
                    >
                        {t('Dismiss')}
                    </Button>
                </div>
            </header>

            {activated ? null : (
            <div className="px-0 pb-2">
                <div
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={progress.total}
                    aria-valuenow={progress.completed}
                    aria-label={t(':done of :total setup steps', {
                        done: progress.completed,
                        total: progress.total,
                    })}
                    className="h-1 overflow-hidden bg-subtle"
                >
                    <div
                        className="h-full bg-ink/40 motion-safe:transition-[width] motion-safe:duration-[var(--motion-duration-hover)] motion-safe:ease-[var(--motion-ease-out)] motion-reduce:transition-none"
                        style={{ width: `${percent}%` }}
                    />
                </div>
            </div>
            )}

            {activated || collapsed ? null : (
                <ol className="divide-y divide-hairline border-t border-hairline">
                    {activation.steps.map((step) => (
                        <ActivationStepRow
                            key={step.id}
                            step={step}
                            current={step.id === currentStepId}
                        />
                    ))}
                </ol>
            )}
        </section>
    );
}

function ActivationStepRow({
    step,
    current = false,
}: {
    step: ActivationStep;
    current?: boolean;
}) {
    const kindLabel = step.kind === 'core' ? t('Required') : t('Optional');

    return (
        <li
            className="flex flex-wrap items-start gap-3 px-3 py-2.5"
            aria-current={current ? 'step' : undefined}
        >
            <span
                className={cn(
                    'mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border',
                    step.complete
                        ? 'border-ink bg-ink text-white'
                        : 'border-hairline bg-white',
                )}
                aria-hidden
            >
                {step.complete ? <Check className="size-2.5" weight="bold" /> : null}
            </span>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <p className="min-w-0 break-words text-[13px] font-medium text-ink">{step.label}</p>
                    <p className="text-[12px] leading-4 text-mute">
                        {step.complete ? t('Done') : kindLabel}
                    </p>
                </div>
                <p className="mt-0.5 text-[12px] leading-4 text-mute">{step.description}</p>
            </div>
            {!step.complete && (step.href || step.secondary_href) ? (
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {step.href && step.cta_label ? (
                        <Button asChild size="sm" variant="outline" className="h-7 px-2 text-[12px]">
                            <Link href={step.href}>{step.cta_label}</Link>
                        </Button>
                    ) : null}
                    {step.secondary_href && step.secondary_cta_label ? (
                        <Link
                            href={step.secondary_href}
                            className="text-[12px] font-medium text-mute hover:text-ink hover:underline"
                        >
                            {step.secondary_cta_label}
                        </Link>
                    ) : null}
                </div>
            ) : null}
        </li>
    );
}
