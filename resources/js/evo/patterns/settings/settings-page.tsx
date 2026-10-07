import type { ReactNode } from 'react';
import { cn } from '@/evo/lib/cn';
import { WorkspaceHeader } from '@/evo/workspace/WorkspaceHeader';
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
        <WorkspaceHeader
            title={t(title)}
            count={description ? t(description) : undefined}
            secondaryActions={children}
            archetype="document"
            sticky
            dataSettings="page-header"
        />
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
