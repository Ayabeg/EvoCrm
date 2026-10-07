import type { ReactNode } from 'react';
import { Button } from '@/evo/ui/button';
import { WorkspaceHeader } from '@/evo/workspace/WorkspaceHeader';
import { t } from '@/lib/i18n';
import { LONG_TEXT_CLASS } from '@/lib/responsive';
import { cn } from '@/lib/utils';

export type PageHeaderProps = {
    title: string;
    description?: string;
    primaryAction?: ReactNode;
    secondaryActions?: ReactNode;
    /** Operational lists: title and count share a short row. */
    compact?: boolean;
    /** Slot B — pipeline selector when Deals has more than one pipeline. */
    context?: ReactNode;
    /** Slot J — saved views, embedded in the header views row. */
    views?: ReactNode;
    /** Slot L — one-line forecast / summary. Hidden below 1024. */
    summary?: ReactNode;
    /** Slot Q — list/board toggle when the page owns it. */
    layoutToggle?: ReactNode;
};

export function PageHeader({
    title,
    description,
    primaryAction,
    secondaryActions,
    compact = false,
    context,
    views,
    summary,
    layoutToggle,
}: PageHeaderProps) {
    return (
        <div
            data-crm="object-header"
            data-ds="page-header"
            data-density={compact ? 'workspace' : 'page'}
        >
            <WorkspaceHeader
                className={cn('md:px-8', LONG_TEXT_CLASS)}
                title={t(title)}
                count={description ? t(description) : undefined}
                primaryAction={primaryAction}
                secondaryActions={secondaryActions}
                context={context}
                views={views}
                summary={summary}
                layoutToggle={layoutToggle}
                density={compact ? 'workspace' : 'page'}
                archetype="workspace"
                dataCrm="object-header"
                dataDs="page-header"
            />
        </div>
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
