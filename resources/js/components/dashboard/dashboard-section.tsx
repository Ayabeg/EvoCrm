import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function DashboardSection({
    title,
    description,
    action,
    children,
    className,
}: {
    title: string;
    description?: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section className={cn('space-y-3', className)}>
            <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                    <h2 className="text-ui font-semibold text-ink">{title}</h2>
                    {description ? (
                        <p className="mt-0.5 text-ui text-muted-foreground">
                            {description}
                        </p>
                    ) : null}
                </div>
                {action}
            </div>
            {children}
        </section>
    );
}
