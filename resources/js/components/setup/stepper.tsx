import { t } from '@/lib/i18n';

type Step = {
    key: string;
    label: string;
    title: string;
};

export function SetupStepper({
    steps,
    currentIndex,
}: {
    steps: Step[];
    currentIndex: number;
}) {
    return (
        <ol className="flex flex-wrap items-center gap-2" aria-label={t('Setup progress')}>
            {steps.map((step, index) => {
                const done = index < currentIndex;
                const active = index === currentIndex;

                return (
                    <li key={step.key} className="flex items-center gap-2">
                        <div
                            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] ${
                                active
                                    ? 'border-brand bg-brand/10 text-brand'
                                    : done
                                      ? 'border-brand/40 text-brand'
                                      : 'border-hairline text-muted-foreground'
                            }`}
                        >
                            <span
                                className={`grid size-5 place-content-center rounded-full text-[11px] font-medium ${
                                    active || done
                                        ? 'bg-brand text-white'
                                        : 'bg-canvas-soft text-muted-foreground'
                                }`}
                            >
                                {done ? '✓' : index + 1}
                            </span>
                            {t(step.label)}
                        </div>
                        {index < steps.length - 1 ? (
                            <span
                                className="hidden h-px w-6 bg-hairline sm:block"
                                aria-hidden="true"
                            />
                        ) : null}
                    </li>
                );
            })}
        </ol>
    );
}
