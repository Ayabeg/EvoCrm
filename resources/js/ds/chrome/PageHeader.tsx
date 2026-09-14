import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export type PageHeaderProps = {
    title: string;
    description?: string;
    primaryAction?: ReactNode;
    secondaryActions?: ReactNode;
};

export function PageHeader({
    title,
    description,
    primaryAction,
    secondaryActions,
}: PageHeaderProps) {
    return (
        <header
            className="flex flex-col gap-3 border-b border-hairline bg-canvas px-4 py-4 md:flex-row md:items-center md:justify-between md:px-8"
            data-crm="object-header"
            data-ds="page-header"
        >
            <div className="min-w-0">
                <h1 className="text-[28px] leading-[34px] font-semibold tracking-tight text-ink">
                    {t(title)}
                </h1>
                {description ? (
                    <p className="mt-1 text-[14px] leading-5 text-mute">{t(description)}</p>
                ) : null}
            </div>
            {secondaryActions || primaryAction ? (
                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    {secondaryActions}
                    {primaryAction}
                </div>
            ) : null}
        </header>
    );
}

export function PageHeaderAction({
    label,
    onClick,
    className,
}: {
    label: string;
    onClick: () => void;
    className?: string;
}) {
    return (
        <Button type="button" onClick={onClick} className={cn('h-9 shrink-0', className)}>
            {t(label)}
        </Button>
    );
}
