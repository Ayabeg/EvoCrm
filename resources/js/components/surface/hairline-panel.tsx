import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function HairlinePanel({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'overflow-hidden rounded-xl border border-hairline bg-canvas',
                className,
            )}
        >
            {children}
        </div>
    );
}

export function HairlinePanelHeader({
    title,
    action,
}: {
    title: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-2.5">
            <h2 className="aurora-text-ui font-medium text-ink">{title}</h2>
            {action}
        </div>
    );
}
