import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

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
                <h1 className="text-[28px] leading-[34px] font-[650] tracking-tight text-ink">
                    {t(title)}
                </h1>
                {description ? (
                    <p className="mt-1 max-w-[65ch] text-[14px] leading-5 text-mute">
                        {t(description)}
                    </p>
                ) : null}
            </div>
            {children}
        </header>
    );
}

export function SettingsCard({
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
                'overflow-hidden rounded-[4px] border border-hairline bg-white',
                className,
            )}
        >
            {title ? (
                <header className="flex items-start justify-between gap-3 border-b border-hairline px-4 py-2.5">
                    <div className="min-w-0">
                        <h2 className="text-[18px] leading-[26px] font-semibold text-ink">
                            {t(title)}
                        </h2>
                        {description ? (
                            <p className="mt-0.5 text-[13px] leading-5 text-mute">
                                {t(description)}
                            </p>
                        ) : null}
                    </div>
                    {required ? (
                        <p className="shrink-0 text-[11px] text-mute">
                            <span className="text-brand">*</span>
                            {' '}
                            {t('Required information')}
                        </p>
                    ) : null}
                </header>
            ) : null}
            <div className="grid gap-3 px-4 py-3">{children}</div>
            {footer}
        </section>
    );
}

export function SettingsFormRow({
    label,
    htmlFor,
    required,
    hint,
    error,
    children,
}: {
    label: string;
    htmlFor?: string;
    required?: boolean;
    hint?: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div className="grid gap-1 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-start sm:gap-x-4">
            <Label
                htmlFor={htmlFor}
                className="pt-1.5 text-[13px] leading-[18px] font-medium text-ink"
            >
                {t(label)}
                {required ? (
                    <span className="ml-0.5 text-brand">*</span>
                ) : null}
            </Label>
            <div className="min-w-0">
                {children}
                {hint ? (
                    <p className="mt-1 text-[12px] leading-4 text-mute">
                        {t(hint)}
                    </p>
                ) : null}
                {error ? (
                    <p className="mt-1 text-[11px] text-destructive">{error}</p>
                ) : null}
            </div>
        </div>
    );
}

export function SettingsSaveBar({
    processing = false,
    saveLabel = 'Save',
    cancelLabel = 'Cancel',
    saveTestId,
    showCancel = true,
}: {
    processing?: boolean;
    saveLabel?: string;
    cancelLabel?: string;
    saveTestId?: string;
    showCancel?: boolean;
}) {
    return (
        <div
            data-settings="save-bar"
            className="flex items-center justify-end gap-2 border-t border-hairline bg-white px-4 py-2"
        >
            {showCancel ? (
                <Button type="reset" variant="ghost" size="sm">
                    {t(cancelLabel)}
                </Button>
            ) : null}
            <Button
                type="submit"
                size="sm"
                disabled={processing}
                data-settings="save"
                data-test={saveTestId}
                className="bg-brand text-white hover:bg-brand-hover disabled:opacity-60"
            >
                {t(saveLabel)}
            </Button>
        </div>
    );
}

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
            className="grid place-items-center gap-2 rounded-[4px] border border-dashed border-hairline bg-white px-4 py-10 text-center"
        >
            {icon ? (
                <span className="grid size-10 place-content-center text-mute">
                    {icon}
                </span>
            ) : null}
            <h3 className="text-[14px] font-semibold text-ink">{title}</h3>
            <p className="max-w-[42ch] text-[12px] leading-4 text-mute">
                {description}
            </p>
            {action}
        </div>
    );
}
