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
        <section className={cn('min-w-0', className)}>
            <header className="mb-2 flex flex-wrap items-end justify-between gap-2">
                <div className="min-w-0">
                    <h2 className="text-[18px] leading-[26px] font-semibold tracking-tight text-ink">
                        {title}
                    </h2>
                    {description ? (
                        <p className="mt-0.5 text-[12px] leading-4 text-mute">
                            {description}
                        </p>
                    ) : null}
                </div>
                {action ? <div className="shrink-0">{action}</div> : null}
            </header>
            <div>{children}</div>
        </section>
    );
}
