import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { stagePillClass } from '@/lib/stage-colors';

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
    return (
        <div className="flex flex-wrap gap-2 px-6 py-3">
            {stages.map((stage, index) => (
                <Link
                    key={stage.id}
                    href={hrefFor(stage.slug)}
                    className={cn(
                        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-ui font-medium',
                        stagePillClass(index),
                        activeSlug === stage.slug && 'ring-2 ring-brand/40',
                    )}
                >
                    {stage.name}
                    <span className="tabular-nums opacity-80">{stage.count}</span>
                </Link>
            ))}
        </div>
    );
}
