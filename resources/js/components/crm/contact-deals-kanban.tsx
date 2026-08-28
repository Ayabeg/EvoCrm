import { Link } from '@inertiajs/react';
import { formatDzd } from '@/lib/money';
import { stageUnderlineColor } from '@/lib/stage-colors';

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
    layout = 'stack',
}: {
    pipelineName: string;
    stages: KanbanStage[];
    deals: KanbanDeal[];
    contactId?: number;
    /** stack = vertical stage list for record right rail; board = horizontal columns for wide surfaces */
    layout?: 'stack' | 'board';
}) {
    if (stages.length === 0) {
        return null;
    }

    return (
        <section>
            <div className="flex items-center justify-between gap-2">
                <h3 className="text-[11px] font-semibold tracking-wide text-mute uppercase">
                    Deals · {pipelineName}
                </h3>
                <Link
                    href={contactId ? `/crm/deals?create=1&contact_id=${contactId}` : '/crm/deals?create=1'}
                    className="text-[12px] font-medium text-ink hover:underline"
                >
                    Add deal
                </Link>
            </div>

            {layout === 'board' ? (
                <div className="overflow-x-auto p-4">
                    <div className="flex min-w-max gap-3">
                        {stages.map((stage) => (
                            <StageColumn
                                key={stage.id}
                                stage={stage}
                                deals={deals.filter((deal) => deal.stage_id === stage.id)}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="mt-2 space-y-2">
                    {stages.map((stage) => {
                        const columnDeals = deals.filter((deal) => deal.stage_id === stage.id);

                        return (
                            <div
                                key={stage.id}
                                className="border-b border-hairline last:border-b-0"
                                data-testid={`contact-kanban-${stage.slug}`}
                            >
                                <div
                                    className="border-b-2 px-3 py-2"
                                    style={{ borderColor: stageUnderlineColor(stage.slug) }}
                                >
                                    <p className="text-[12px] font-semibold text-ink">{stage.name}</p>
                                    <p className="text-[11px] text-muted-foreground">
                                        {columnDeals.length} deal{columnDeals.length === 1 ? '' : 's'}
                                    </p>
                                </div>
                                <div className="space-y-2 p-3">
                                    {columnDeals.length === 0 ? (
                                        <p className="text-[12px] text-muted-foreground">No deals in this stage</p>
                                    ) : (
                                        columnDeals.map((deal) => (
                                            <DealChip key={deal.id} deal={deal} />
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

function StageColumn({
    stage,
    deals,
}: {
    stage: KanbanStage;
    deals: KanbanDeal[];
}) {
    return (
        <div
            className="w-40 shrink-0 rounded-md border border-hairline bg-canvas-soft"
            data-testid={`contact-kanban-${stage.slug}`}
        >
            <div
                className="border-b-2 px-3 py-2"
                style={{ borderColor: stageUnderlineColor(stage.slug) }}
            >
                <p className="truncate text-[12px] font-semibold text-ink">{stage.name}</p>
                <p className="text-[11px] text-muted-foreground">
                    {deals.length} deal{deals.length === 1 ? '' : 's'}
                </p>
            </div>
            <div className="space-y-2 p-3">
                {deals.length === 0 ? (
                    <p className="text-[12px] text-muted-foreground">—</p>
                ) : (
                    deals.map((deal) => <DealChip key={deal.id} deal={deal} />)
                )}
            </div>
        </div>
    );
}

function DealChip({ deal }: { deal: KanbanDeal }) {
    return (
        <Link
            href={`/crm/deals/${deal.id}`}
            className="block py-1.5 hover:underline"
        >
            <p className="truncate text-[12px] font-medium text-ink">{deal.title}</p>
            {deal.amount_cents > 0 ? (
                <p className="money mt-1 text-[11px] font-semibold text-ink">
                    {formatDzd(deal.amount_cents)}
                </p>
            ) : null}
        </Link>
    );
}
