import type { ReactNode } from 'react';
import { cn } from '@/evo/lib/cn';
import { t } from '@/lib/i18n';

export function SettingsPageHeader({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children?: ReactNode;
}) {
    return (
        <header
            data-settings="page-header"
            className="mb-3 flex flex-wrap items-start justify-between gap-3"
        >
            <div className="min-w-0">
                <h1 className="text-[24px] leading-[32px] font-semibold tracking-tight text-[var(--evo-ink)]">
                    {t(title)}
                </h1>
                {description ? (
                    <p className="mt-1 max-w-[65ch] text-[14px] leading-5 text-[var(--evo-ink-secondary)]">
                        {t(description)}
                    </p>
                ) : null}
            </div>
            {children}
        </header>
    );
}

export function SettingsPage({
    title,
    description,
    actions,
    children,
    className,
}: {
    title: string;
    description?: string;
    actions?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div data-settings="page" className={cn('grid gap-3', className)}>
            <SettingsPageHeader title={title} description={description}>
                {actions}
            </SettingsPageHeader>
            {children}
        </div>
    );
}
