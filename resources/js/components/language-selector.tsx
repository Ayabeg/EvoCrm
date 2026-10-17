import { router, usePage } from '@inertiajs/react';
import {
    Check,
    CaretDown,
    GlobeSimple,
} from '@/evo/icons';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/evo/ui/dropdown-menu';
import type { AppLocale } from '@/lib/i18n';
import { applyDocumentLocale, isAppLocale, t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export const LANGUAGE_OPTIONS: { value: AppLocale; label: string }[] = [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English' },
    { value: 'ar', label: 'العربية' },
];

export function persistLocale(next: AppLocale): void {
    try {
        window.localStorage.setItem('locale', next);
    } catch {
        // localStorage can be unavailable in privacy-restricted browsers.
    }

    applyDocumentLocale(next);

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
    variant = 'full',
    className,
}: {
    compact?: boolean;
    variant?: 'full' | 'header';
    className?: string;
}) {
    const pageLocale = usePage().props.locale;
    const locale = isAppLocale(pageLocale) ? pageLocale : 'en';
    const selected = LANGUAGE_OPTIONS.find((option) => option.value === locale) ?? LANGUAGE_OPTIONS[1];

    if (variant === 'header') {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className={cn('evo-global-control', className)}
                        aria-label={t('Language')}
                        title={t('Language')}
                        data-test="global-locale-trigger"
                    >
                        <GlobeSimple className="size-4" weight="regular" aria-hidden />
                        <span className="text-[12px] font-semibold tracking-[0.08em]">
                            {selected.value.toUpperCase()}
                        </span>
                        <CaretDown className="size-3.5 text-[var(--evo-ink-muted)]" weight="bold" aria-hidden />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-44">
                    <DropdownMenuLabel>{t('Language')}</DropdownMenuLabel>
                    {LANGUAGE_OPTIONS.map((option) => (
                        <DropdownMenuItem
                            key={option.value}
                            lang={option.value}
                            onSelect={() => persistLocale(option.value)}
                            className="gap-3"
                            data-test={`global-locale-${option.value}`}
                        >
                            <span className="w-7 text-[11px] font-semibold tracking-[0.08em] text-[var(--evo-ink-muted)]">
                                {option.value.toUpperCase()}
                            </span>
                            <span className="flex-1">{option.label}</span>
                            {locale === option.value ? (
                                <Check className="size-3.5 text-[var(--evo-primary)]" weight="bold" aria-hidden />
                            ) : null}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

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
