import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Button } from '@/evo/ui/button';
import { WorkspaceHeader } from '@/evo/workspace/WorkspaceHeader';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function CrmObjectHeader({
    title,
    description,
    primaryLabel,
    onPrimary,
    primarySlot,
    primaryClassName,
    secondary,
}: {
    title: string;
    description?: string;
    primaryLabel?: string;
    onPrimary?: () => void;
    primarySlot?: ReactNode;
    primaryClassName?: string;
    secondary?: ReactNode;
}) {
    const primary =
        primarySlot ??
        (primaryLabel && onPrimary ? (
            <Button
                type="button"
                size="sm"
                onClick={onPrimary}
                className={cn('h-8 shrink-0', primaryClassName)}
            >
                {t(primaryLabel)}
            </Button>
        ) : undefined);

    return (
        <div data-crm="object-header">
            <WorkspaceHeader
                className="py-2.5 text-page-title"
                title={t(title)}
                count={description}
                primaryAction={primary}
                secondaryActions={secondary}
                archetype="workspace"
                density="workspace"
                dataCrm="object-header"
            />
        </div>
    );
}

export function CrmObjectSecondaryLink({
    href,
    children,
}: {
    href: string;
    children: ReactNode;
}) {
    return (
        <Link
            href={href}
            className="text-[12px] text-mute transition-colors hover:text-ink"
        >
            {children}
        </Link>
    );
}
