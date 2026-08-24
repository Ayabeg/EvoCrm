import type { ReactNode } from 'react';

export function EmptyRoom({
    title,
    line,
    actionLabel,
    actionHref,
    children,
}: {
    title: string;
    line: string;
    actionLabel?: string;
    actionHref?: string;
    children?: ReactNode;
}) {
    return (
        <div className="grid flex-1 place-items-center bg-canvas px-6 py-16">
            <div className="max-w-md text-center">
                <div className="mx-auto mb-4 size-12 rounded-full border border-dashed border-hairline bg-canvas-soft" />
                <h2 className="text-[16px] font-semibold text-ink">{title}</h2>
                <p className="mt-2 text-[13px] text-muted-foreground">{line}</p>
                {actionLabel && actionHref ? (
                    <a
                        href={actionHref}
                        className="mt-4 inline-block rounded-sm px-3 py-1.5 text-[13px] font-medium text-brand transition-colors hover:bg-canvas-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    >
                        {actionLabel}
                    </a>
                ) : null}
                {children}
            </div>
        </div>
    );
}

export function SkeletonList({ rows = 6 }: { rows?: number }) {
    return (
        <div className="animate-pulse space-y-2 p-4" aria-hidden>
            {Array.from({ length: rows }).map((_, index) => (
                <div key={index} className="h-10 rounded bg-canvas-soft" />
            ))}
        </div>
    );
}

export function SkeletonRecord() {
    return (
        <div className="animate-pulse space-y-4 p-6" aria-hidden>
            <div className="h-6 w-48 rounded bg-canvas-soft" />
            <div className="h-4 w-full max-w-lg rounded bg-canvas-soft" />
            <div className="grid gap-4 lg:grid-cols-3">
                <div className="h-64 rounded bg-canvas-soft" />
                <div className="h-64 rounded bg-canvas-soft lg:col-span-2" />
            </div>
        </div>
    );
}
