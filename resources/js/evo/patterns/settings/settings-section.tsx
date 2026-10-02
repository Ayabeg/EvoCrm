import type { ReactNode } from 'react';
import { cn } from '@/evo/lib/cn';
import { t } from '@/lib/i18n';
import { settingsCopy } from './copy';

export function SettingsSection({
    title,
    description,
    required = false,
    children,
    footer,
    className,
}: {
    title?: string;
    description?: string;
    required?: boolean;
    children: ReactNode;
    footer?: ReactNode;
    className?: string;
}) {
    return (
        <section
            data-settings="card"
            className={cn(
                'overflow-hidden rounded-[var(--evo-radius-compact)] border border-[var(--evo-hairline)] bg-[var(--evo-surface)]',
                className,
            )}
        >
            {title ? (
                <header className="flex items-start justify-between gap-3 border-b border-[var(--evo-hairline)] px-4 py-2.5">
                    <div className="min-w-0">
                        <h2 className="text-[16px] leading-[24px] font-semibold text-[var(--evo-ink)]">
                            {t(title)}
                        </h2>
                        {description ? (
                            <p className="mt-0.5 text-[13px] leading-5 text-[var(--evo-ink-muted)]">
                                {t(description)}
                            </p>
                        ) : null}
                    </div>
                    {required ? (
                        <p className="shrink-0 text-[11px] text-[var(--evo-ink-muted)]">
                            <span className="text-[var(--evo-primary)]">*</span>
                            {' '}
                            {t(settingsCopy.required)}
                        </p>
                    ) : null}
                </header>
            ) : null}
            <div className="grid gap-3 px-4 py-3">{children}</div>
            {footer}
        </section>
    );
}

export { SettingsSection as SettingsCard };
