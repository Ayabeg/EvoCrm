import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function DashboardSection({
    title,
    description,
    action,
    children,
    className,
    surface = 'plain',
}: {
    title: string;
    description?: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
    surface?: 'plain' | 'panel';
}) {
    return (
        <section
            className={cn(
                'min-w-0',
                surface === 'panel' &&
                    'rounded-xl border border-hairline bg-canvas',
                className,
            )}
        >
            <header
                className={cn(
                    'flex flex-wrap items-end justify-between gap-2',
                    surface === 'panel'
                        ? 'px-4 pt-3 pb-2 md:px-5 md:pt-4'
                        : 'pb-2',
                )}
            >
                <div className="min-w-0">
                    <h2 className="text-[13px] font-semibold tracking-tight text-ink">
                        {title}
                    </h2>
                    {description ? (
                        <p className="mt-0.5 text-[12px] leading-5 text-mute">
                            {description}
                        </p>
                    ) : null}
                </div>
                {action ? <div className="shrink-0">{action}</div> : null}
            </header>
            <div className={surface === 'panel' ? 'px-4 pb-3 md:px-5 md:pb-4' : undefined}>
                {children}
            </div>
        </section>
    );
}
