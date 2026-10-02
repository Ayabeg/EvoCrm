import { router, usePage } from '@inertiajs/react';
import type { AppLocale } from '@/lib/i18n';
import { isAppLocale, t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export const LANGUAGE_OPTIONS: { value: AppLocale; label: string }[] = [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English' },
    { value: 'ar', label: 'العربية' },
];

function persistLocale(next: AppLocale): void {
    router.post(
        '/locale',
        { locale: next },
        {
            preserveScroll: true,
            onSuccess: () => {
                window.location.reload();
            },
        },
    );
}

export function LanguageSelector({
    compact = false,
    className,
}: {
    compact?: boolean;
    className?: string;
}) {
    const pageLocale = usePage().props.locale;
    const locale = isAppLocale(pageLocale) ? pageLocale : 'en';

    if (compact) {
        return (
            <div
                className={cn('flex flex-wrap items-center justify-center gap-1', className)}
                role="group"
                aria-label={t('Language')}
                data-language-selector="compact"
            >
                {LANGUAGE_OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        data-test={`locale-${option.value}`}
                        aria-pressed={locale === option.value}
                        lang={option.value}
                        className={cn(
                            'rounded-md px-2 py-1 text-xs font-medium transition-colors',
                            locale === option.value
                                ? 'bg-[var(--evo-teal-soft)] text-[var(--evo-ink)]'
                                : 'text-[var(--evo-ink-muted)] hover:text-[var(--evo-ink)]',
                        )}
                        onClick={() => persistLocale(option.value)}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div
            className={cn('inline-flex gap-1 rounded-lg border border-hairline bg-canvas-soft p-1', className)}
            role="group"
            aria-label={t('Language')}
            data-language-selector="full"
        >
            {LANGUAGE_OPTIONS.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    data-test={`locale-${option.value}`}
                    aria-pressed={locale === option.value}
                    lang={option.value}
                    className={cn(
                        'rounded-md px-3.5 py-1.5 text-sm transition-colors',
                        locale === option.value
                            ? 'bg-canvas text-ink shadow-xs'
                            : 'text-mute hover:bg-canvas/60 hover:text-ink',
                    )}
                    onClick={() => persistLocale(option.value)}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}
