import { Link } from '@inertiajs/react';
import { stageLabel } from '@/lib/stage-copy';
import { cn } from '@/lib/utils';

export type StagePill = {
    id: number;
    name: string;
    slug: string;
    count: number;
};

export function StagePills({
    stages,
    activeSlug,
    hrefFor,
}: {
    stages: StagePill[];
    activeSlug?: string | null;
    hrefFor: (slug: string) => string;
}) {
    if (stages.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-1.5 px-4 pb-2 md:px-8" data-crm="stage-pills">
            {stages.map((stage) => (
                <Link
                    key={stage.id}
                    href={hrefFor(stage.slug)}
                    aria-current={activeSlug === stage.slug ? 'page' : undefined}
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px]',
                        activeSlug === stage.slug
                            ? 'border-ink bg-canvas-soft font-medium text-ink'
                            : 'border-hairline text-mute hover:text-ink',
                    )}
                >
                    {stageLabel(stage.slug, stage.name)}
                    <span className="tabular-nums">{stage.count}</span>
                </Link>
            ))}
        </div>
    );
}
