import type { ReactNode } from 'react';
import type { EmptyKind } from '@/components/ui/empty-illustration';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

export function HomeWidget({
    title,
    description,
    action,
    children,
    className,
    empty,
}: {
    title: string;
    description?: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
    empty?: boolean;
}) {
    return (
        <section className={cn('home-widget flex min-h-0 flex-col', className)}>
            <header className="flex items-start justify-between gap-3 border-b border-hairline px-3 py-2">
                <div className="min-w-0">
                    <h2 className="text-[13px] font-semibold tracking-tight text-ink">
                        {title}
                    </h2>
                    {description ? (
                        <p className="mt-0.5 text-[11px] leading-4 text-mute">
                            {description}
                        </p>
                    ) : null}
                </div>
                {action ? <div className="shrink-0">{action}</div> : null}
            </header>
            <div
                className={cn(
                    'min-h-[168px] flex-1 px-3 py-3',
                    empty && 'grid place-items-center',
                )}
            >
                {children}
            </div>
        </section>
    );
}

export function HomeWidgetEmpty({
    title,
    body,
    action,
    kind,
}: {
    title: string;
    body: string;
    action?: ReactNode;
    kind?: EmptyKind;
}) {
    return (
        <EmptyState
            density="panel"
            kind={kind}
            title={title}
            description={body}
            as="p"
            className="max-w-[18rem]"
            action={action}
        />
    );
}
