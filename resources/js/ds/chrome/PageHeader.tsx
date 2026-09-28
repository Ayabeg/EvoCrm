import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';
import { LONG_TEXT_CLASS, LONG_TEXT_WRAP_CLASS } from '@/lib/responsive';
import { cn } from '@/lib/utils';

export type PageHeaderProps = {
    title: string;
    description?: string;
    primaryAction?: ReactNode;
    secondaryActions?: ReactNode;
    /** Operational lists: title and count share a short row. */
    compact?: boolean;
};

export function PageHeader({
    title,
    description,
    primaryAction,
    secondaryActions,
    compact = false,
}: PageHeaderProps) {
    return (
        <header
            className={cn(
                'border-b border-hairline bg-canvas',
                compact
                    ? 'flex items-center justify-between gap-3 px-4 py-2.5 md:px-6'
                    : 'flex flex-col gap-3 px-4 pb-6 pt-5 md:flex-row md:items-center md:justify-between md:px-8',
            )}
            data-crm="object-header"
            data-ds="page-header"
            data-density={compact ? 'workspace' : 'page'}
        >
            <div className="min-w-0">
                <h1
                    className={cn(
                        compact
                            ? 'text-[22px] leading-7 font-semibold tracking-[-0.02em] text-ink'
                            : 'text-[28px] leading-[34px] font-[650] tracking-tight text-ink',
                        LONG_TEXT_CLASS,
                    )}
                >
                    {t(title)}
                </h1>
                {description ? (
                    <p
                        className={cn(
                            compact
                                ? 'text-[13px] leading-4 text-mute'
                                : 'mt-1 text-[14px] leading-5 text-mute',
                            LONG_TEXT_WRAP_CLASS,
                        )}
                    >
                        {t(description)}
                    </p>
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
