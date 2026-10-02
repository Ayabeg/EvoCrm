import type { ReactNode } from 'react';
import type { EmptyKind } from '@/components/ui/empty-illustration';
import { EmptyState } from '@/evo/patterns/empty-state';

export function EmptyRoom({
    title,
    line,
    actionLabel,
    actionHref,
    children,
    kind,
}: {
    title: string;
    line: string;
    actionLabel?: string;
    actionHref?: string;
    children?: ReactNode;
    kind?: EmptyKind;
}) {
    return (
        <div className="grid flex-1 place-items-center bg-canvas px-6 py-16">
            <EmptyState
                density="page"
                kind={kind}
                title={title}
                description={line}
                as="h2"
                className="w-full max-w-md"
                action={
                    actionLabel && actionHref ? (
                        <a
                            href={actionHref}
                            className="inline-block rounded-sm px-3 py-1.5 text-[13px] font-medium text-brand transition-colors hover:bg-canvas-soft focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                        >
                            {actionLabel}
                        </a>
                    ) : undefined
                }
            />
            {children}
        </div>
    );
}

export function SkeletonList({ rows = 8 }: { rows?: number }) {
    return (
        <div className="min-h-0 flex-1" aria-hidden aria-busy="true">
            <div className="border-b border-hairline bg-canvas-soft px-4 py-2.5 sm:px-6">
                <div className="h-3 w-24 animate-pulse rounded bg-hairline" />
            </div>
            {Array.from({ length: rows }).map((_, index) => (
                <div
                    key={index}
                    className="flex items-center gap-4 border-b border-hairline px-4 py-2.5 sm:px-6"
                >
                    <div className="h-3 w-40 animate-pulse rounded bg-canvas-soft" />
                    <div className="hidden h-3 w-24 animate-pulse rounded bg-canvas-soft sm:block" />
                    <div className="ml-auto h-3 w-16 animate-pulse rounded bg-canvas-soft" />
                </div>
            ))}
        </div>
    );
}

export function SkeletonRecord() {
    return (
        <div
            className="h-app-workspace flex flex-col bg-canvas-soft"
            aria-busy="true"
            aria-hidden
        >
            <div className="shrink-0 border-b border-hairline bg-canvas px-4 py-3 sm:px-6">
                <div className="h-3 w-28 animate-pulse rounded bg-hairline" />
                <div className="mt-3 flex items-start gap-3">
                    <div className="size-10 shrink-0 animate-pulse rounded-full bg-canvas-soft" />
                    <div className="min-w-0 flex-1 space-y-2">
                        <div className="h-5 w-48 animate-pulse rounded bg-canvas-soft" />
                        <div className="h-3 w-32 animate-pulse rounded bg-hairline" />
                    </div>
                </div>
            </div>
            <div className="grid min-h-0 flex-1 gap-px bg-hairline lg:grid-cols-[minmax(17rem,20rem)_minmax(0,1fr)_minmax(18rem,22rem)]">
                <div className="space-y-3 bg-canvas p-4">
                    <div className="h-3 w-24 animate-pulse rounded bg-hairline" />
                    <div className="h-16 animate-pulse rounded bg-canvas-soft" />
                    <div className="h-16 animate-pulse rounded bg-canvas-soft" />
                </div>
                <div className="space-y-3 bg-canvas p-4">
                    <div className="h-8 animate-pulse rounded bg-canvas-soft" />
                    <div className="h-12 animate-pulse rounded bg-canvas-soft" />
                    <div className="h-12 animate-pulse rounded bg-canvas-soft" />
                </div>
                <div className="hidden space-y-3 bg-canvas p-4 lg:block">
                    <div className="h-16 animate-pulse rounded bg-canvas-soft" />
                    <div className="h-16 animate-pulse rounded bg-canvas-soft" />
                </div>
            </div>
        </div>
    );
}
