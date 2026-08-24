import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

const PILL_COLORS = [
    'bg-[#F4B183] text-ink',
    'bg-[#EC6025] text-canvas',
    'bg-[#F2D0A4] text-ink',
    'bg-[#C45C26] text-canvas',
    'bg-[#8C3D16] text-canvas',
    'bg-[#111111] text-canvas',
];

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
                        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-medium',
                        PILL_COLORS[index % PILL_COLORS.length],
                        activeSlug === stage.slug && 'ring-2 ring-ink/20',
                    )}
                >
                    {stage.name}
                    <span className="tabular-nums opacity-80">{stage.count}</span>
                </Link>
            ))}
        </div>
    );
}
