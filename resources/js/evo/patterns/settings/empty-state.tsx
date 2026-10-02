import type { ReactNode } from 'react';
import { t } from '@/lib/i18n';

export function SettingsEmptyState({
    icon,
    title,
    description,
    action,
}: {
    icon?: ReactNode;
    title: string;
    description: string;
    action?: ReactNode;
}) {
    return (
        <div
            data-settings="empty"
            role="status"
            className="grid place-items-center gap-2 rounded-[var(--evo-radius-compact)] border border-dashed border-[var(--evo-hairline)] bg-[var(--evo-surface)] px-4 py-10 text-center"
        >
            {icon ? (
                <span className="grid size-10 place-content-center text-[var(--evo-ink-muted)]">
                    {icon}
                </span>
            ) : null}
            <h3 className="text-[14px] font-semibold text-[var(--evo-ink)]">{t(title)}</h3>
            <p className="max-w-[42ch] text-[12px] leading-4 text-[var(--evo-ink-muted)]">
                {t(description)}
            </p>
            {action}
        </div>
    );
}
