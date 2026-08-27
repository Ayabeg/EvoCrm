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
        <section
            className={cn(
                'rounded-2xl border border-hairline bg-canvas',
                className,
            )}
        >
            <header className="flex flex-row flex-wrap items-end justify-between gap-3 px-5 pt-5 pb-3">
                <div className="min-w-0">
                    <h2 className="text-[15px] font-semibold tracking-tight text-ink">
                        {title}
                    </h2>
                    {description ? (
                        <p className="mt-1 text-[12px] leading-5 text-mute">
                            {description}
                        </p>
                    ) : null}
                </div>
                {action ? <div className="shrink-0">{action}</div> : null}
            </header>
            <div className="px-5 pb-5">{children}</div>
        </section>
    );
}
