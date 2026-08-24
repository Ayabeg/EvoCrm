import { Link } from '@inertiajs/react';
import { crmListHref, filterFields } from '@/components/crm/list-query';

export type StagePill = {
    id: number;
    name: string;
    slug: string;
    count: number;
    tone: 'open' | 'won' | 'lost' | string;
};

export default function StagePills({
    pills = [],
    activeStage,
    basePath,
    activeFilters,
}: {
    pills?: StagePill[];
    activeStage?: string | null;
    basePath: string;
    activeFilters: Record<string, unknown>;
}) {
    if (pills.length === 0) {
        return null;
    }

    const fields = filterFields(activeFilters);

    return (
        <div className="flex flex-wrap gap-1 border-b border-hairline bg-canvas px-3 py-2">
            {pills.map((pill) => {
                const active = activeStage === pill.slug;
                const tone =
                    pill.tone === 'won'
                        ? 'bg-brand text-canvas'
                        : pill.tone === 'lost'
                          ? 'bg-ink text-canvas'
                          : 'bg-canvas-soft text-ink';

                return (
                    <Link
                        key={pill.id}
                        href={crmListHref(basePath, fields, { stage: active ? null : pill.slug })}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] ${tone} ${active ? 'ring-1 ring-ink' : ''}`}
                    >
                        <span>{pill.name}</span>
                        <span className="tabular-nums">{pill.count}</span>
                    </Link>
                );
            })}
        </div>
    );
}
