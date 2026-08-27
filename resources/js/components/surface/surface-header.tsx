import type { ReactNode } from 'react';

export function SurfaceHeader({
    title,
    description,
    children,
    as: Tag = 'h2',
}: {
    title: string;
    description?: string;
    children?: ReactNode;
    as?: 'h1' | 'h2';
}) {
    return (
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <Tag className="aurora-text-display-2 text-ink">{title}</Tag>
                {description ? (
                    <p className="aurora-text-lead mt-1 max-w-[65ch] text-mute">
                        {description}
                    </p>
                ) : null}
            </div>
            {children ? (
                <div className="flex flex-wrap items-center gap-2">{children}</div>
            ) : null}
        </header>
    );
}
