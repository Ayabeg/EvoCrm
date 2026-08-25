import { Link } from '@inertiajs/react';
import { formatDzd } from '@/lib/money';
import { stageUnderlineColor } from '@/lib/stage-colors';
import { cn } from '@/lib/utils';

type KanbanStage = {
    id: number;
    name: string;
    slug: string;
};

type KanbanDeal = {
    id: number;
    title: string;
    amount_cents: number;
    stage_id: number;
};

export default function ContactDealsKanban({
    pipelineName,
    stages,
    deals,
    contactId,
}: {
    pipelineName: string;
    stages: KanbanStage[];
    deals: KanbanDeal[];
    contactId?: number;
}) {
    if (stages.length === 0) {
        return null;
    }

    return (
        <section className="rounded-md border border-hairline bg-canvas">
            <div className="flex items-center justify-between border-b border-hairline px-3 py-2">
                <h3 className="text-[12px] font-semibold tracking-wide text-ink uppercase">
                    Deals · {pipelineName}
                </h3>
                <Link
                    href={contactId ? `/crm/deals?create=1&contact_id=${contactId}` : '/crm/deals?create=1'}
                    className="text-[12px] font-medium text-brand"
                >
                    Add deal
                </Link>
            </div>
            <div className="overflow-x-auto p-3">
                <div className="flex min-w-max gap-2">
                    {stages.map((stage) => {
                        const columnDeals = deals.filter((deal) => deal.stage_id === stage.id);

                        return (
                            <div
                                key={stage.id}
                                className="w-[140px] shrink-0 rounded-md border border-hairline bg-canvas-soft"
                                data-testid={`contact-kanban-${stage.slug}`}
                            >
                                <div
                                    className="border-b-2 px-2 py-1.5"
                                    style={{ borderColor: stageUnderlineColor(stage.slug) }}
                                >
                                    <p className="truncate text-[11px] font-semibold text-ink">
                                        {stage.name}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {columnDeals.length} deal{columnDeals.length === 1 ? '' : 's'}
                                    </p>
                                </div>
                                <div className="space-y-1.5 p-1.5">
                                    {columnDeals.length === 0 ? (
                                        <p className="px-1 py-2 text-[10px] text-muted-foreground">—</p>
                                    ) : (
                                        columnDeals.map((deal) => (
                                            <Link
                                                key={deal.id}
                                                href={`/crm/deals/${deal.id}`}
                                                className={cn(
                                                    'block rounded border border-hairline bg-canvas px-2 py-1.5',
                                                    'hover:border-brand/40 hover:shadow-xs',
                                                )}
                                            >
                                                <p className="truncate text-[11px] font-medium text-ink">
                                                    {deal.title}
                                                </p>
                                                {deal.amount_cents > 0 ? (
                                                    <p className="money mt-0.5 text-[10px] font-semibold text-ink">
                                                        {formatDzd(deal.amount_cents)}
                                                    </p>
                                                ) : null}
                                            </Link>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
