import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import type { DragEvent } from 'react';
import { toast } from 'sonner';
import { CrmObjectHeader } from '@/components/crm/crm-object-header';
import { CrmShell } from '@/components/crm/crm-shell';
import DealForecastBar from '@/components/crm/deal-forecast-bar';
import DealLayoutToggle from '@/components/crm/deal-layout-toggle';
import {
    PipelineKanban,
    PipelineKanbanCard,
    PipelineKanbanColumn,
    PipelineKanbanEmpty,
    PipelineKanbanHeader,
    PipelineKanbanStack,
} from '@/components/crm/pipeline-kanban';
import PipelineSwitcher from '@/components/crm/pipeline-switcher';
import { Button } from '@/components/ui/button';
import { useInertiaLoading } from '@/hooks/use-inertia-loading';
import { formatDzd } from '@/lib/money';
import { stageUnderlineColor } from '@/lib/stage-colors';

type PipelineOption = {
    id: number;
    name: string;
    is_default: boolean;
};

type BoardStage = {
    id: number;
    name: string;
    slug: string;
    position: number;
    is_won: boolean;
    is_lost: boolean;
    probability: number;
    count: number;
    amount_cents: number;
    weighted_cents: number;
};

type BoardDeal = {
    id: number;
    title: string;
    amount_cents: number;
    currency: string;
    stage_id: number;
    contact_name: string | null;
    company_name: string | null;
    owner_name: string | null;
    close_date: string | null;
    url: string;
};

type Forecast = {
    count: number;
    amount_cents: number;
    weighted_cents: number;
};

function createDealHref(pipelineId: number): string {
    return `/crm/deals?pipeline=${pipelineId}&create=1`;
}

function DealCard({
    deal,
    dragging,
    onDragStart,
    onDragEnd,
}: {
    deal: BoardDeal;
    dragging: boolean;
    onDragStart: (event: DragEvent, dealId: number) => void;
    onDragEnd: () => void;
}) {
    const association =
        [deal.company_name, deal.contact_name].filter(Boolean).join(' · ') ||
        'No company';

    return (
        <PipelineKanbanCard
            dragging={dragging}
            testId={`deal-card-${deal.id}`}
            onDragStart={(event) => onDragStart(event, deal.id)}
            onDragEnd={onDragEnd}
        >
            <Link
                href={deal.url}
                className="block truncate font-medium text-ink hover:underline"
            >
                {deal.title}
            </Link>
            <p className="mt-0.5 truncate text-[11px] text-mute">
                {association}
            </p>
            <p className="money mt-1.5 break-words text-[13px] font-semibold tabular-nums text-ink">
                {formatDzd(deal.amount_cents)}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-mute">
                {deal.owner_name ?? 'Unassigned'}
                {deal.close_date ? ` · ${deal.close_date}` : ''}
            </p>
        </PipelineKanbanCard>
    );
}

function PipelineBoardSkeleton({ columns = 6 }: { columns?: number }) {
    return (
        <PipelineKanban className="h-full px-2 sm:px-3" busy>
            {Array.from({ length: columns }).map((_, index) => (
                <PipelineKanbanColumn key={index}>
                    <div className="mb-2 space-y-1.5 px-0.5">
                        <div className="h-3.5 w-24 animate-pulse rounded bg-hairline" />
                        <div className="h-2.5 w-14 animate-pulse rounded bg-hairline" />
                        <div className="h-3 w-20 animate-pulse rounded bg-hairline" />
                    </div>
                    <div className="grid gap-1.5">
                        <div className="h-[4.5rem] animate-pulse rounded-[var(--radius-1)] border border-hairline bg-canvas" />
                        <div className="h-[4.5rem] animate-pulse rounded-[var(--radius-1)] border border-hairline bg-canvas" />
                    </div>
                </PipelineKanbanColumn>
            ))}
        </PipelineKanban>
    );
}

export default function DealBoard({
    pipeline,
    pipelines,
    stages,
    deals,
    forecast,
    forecastBand,
}: {
    pipeline: { id: number; name: string };
    pipelines: PipelineOption[];
    stages: BoardStage[];
    deals: BoardDeal[];
    forecast: Forecast;
    forecastBand?: {
        low_cents: number;
        high_cents: number;
        band_label: string;
        narrative?: string | null;
    } | null;
}) {
    const [draggingId, setDraggingId] = useState<number | null>(null);
    const [overStage, setOverStage] = useState<number | null>(null);
    const loading = useInertiaLoading();
    const createHref = createDealHref(pipeline.id);

    const onDragStart = (event: DragEvent, dealId: number) => {
        event.dataTransfer.setData('text/plain', String(dealId));
        event.dataTransfer.effectAllowed = 'move';
        setDraggingId(dealId);
    };

    const onDrop = (event: DragEvent, stage: BoardStage) => {
        event.preventDefault();
        const dealId = Number(event.dataTransfer.getData('text/plain'));
        setDraggingId(null);
        setOverStage(null);

        const deal = deals.find((row) => row.id === dealId);

        if (!deal || deal.stage_id === stage.id) {
            return;
        }

        router.post(
            `/crm/deals/${dealId}/move`,
            { stage_id: stage.id },
            {
                preserveScroll: true,
                onError: () => {
                    toast.error('Could not move this deal. Try again.');
                },
            },
        );
    };

    return (
        <CrmShell title="Pipeline" chrome="workspace">
            <div
                className="flex h-full min-h-0 flex-col bg-canvas-soft"
                data-crm="pipeline-workspace"
            >
                <CrmObjectHeader
                    title="Pipeline"
                    description={pipeline.name}
                    primaryLabel="New deal"
                    onPrimary={() => {
                        window.location.href = createHref;
                    }}
                    secondary={
                        <>
                            <PipelineSwitcher
                                pipelineId={pipeline.id}
                                pipelines={pipelines}
                                basePath="/crm/deals/board"
                            />
                            <DealLayoutToggle
                                current="board"
                                pipelineId={pipeline.id}
                            />
                        </>
                    }
                />

                <DealForecastBar
                    forecast={forecast}
                    forecastBand={forecastBand}
                />

                {deals.length === 0 && !loading ? (
                    <div
                        className="border-b border-hairline bg-canvas px-4 py-2.5 sm:px-6"
                        data-crm="pipeline-empty"
                    >
                        <p className="text-[13px] font-medium text-ink">
                            No deals in this pipeline
                        </p>
                        <p className="mt-0.5 text-[12px] text-mute">
                            Create your first deal to start tracking
                            opportunities.
                        </p>
                        <Button
                            type="button"
                            size="sm"
                            className="mt-2 h-8"
                            onClick={() => {
                                window.location.href = createHref;
                            }}
                        >
                            New deal
                        </Button>
                    </div>
                ) : null}

                <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-canvas">
                    {loading ? (
                        <PipelineBoardSkeleton columns={stages.length || 6} />
                    ) : (
                        <PipelineKanban className="h-full min-h-[22rem] px-1 sm:px-2">
                            {stages.map((stage) => {
                                const cards = deals.filter(
                                    (deal) => deal.stage_id === stage.id,
                                );

                                return (
                                    <PipelineKanbanColumn
                                        key={stage.id}
                                        testId={`stage-column-${stage.slug}`}
                                        over={overStage === stage.id}
                                        onDragOver={(event) => {
                                            event.preventDefault();
                                            event.dataTransfer.dropEffect =
                                                'move';
                                            setOverStage(stage.id);
                                        }}
                                        onDragLeave={() =>
                                            setOverStage((current) =>
                                                current === stage.id
                                                    ? null
                                                    : current,
                                            )
                                        }
                                        onDrop={(event) =>
                                            onDrop(event, stage)
                                        }
                                    >
                                        <PipelineKanbanHeader
                                            name={stage.name}
                                            count={stage.count}
                                            amount={formatDzd(
                                                stage.amount_cents,
                                            )}
                                            weighted={formatDzd(
                                                stage.weighted_cents,
                                            )}
                                            probability={stage.probability}
                                            accent={stageUnderlineColor(
                                                stage.slug,
                                            )}
                                        />

                                        <PipelineKanbanStack>
                                            {cards.map((deal) => (
                                                <DealCard
                                                    key={deal.id}
                                                    deal={deal}
                                                    dragging={
                                                        draggingId === deal.id
                                                    }
                                                    onDragStart={onDragStart}
                                                    onDragEnd={() => {
                                                        setDraggingId(null);
                                                        setOverStage(null);
                                                    }}
                                                />
                                            ))}

                                            {cards.length === 0 ? (
                                                <PipelineKanbanEmpty />
                                            ) : null}
                                        </PipelineKanbanStack>
                                    </PipelineKanbanColumn>
                                );
                            })}
                        </PipelineKanban>
                    )}
                </div>
            </div>
        </CrmShell>
    );
}

DealBoard.layout = {
    breadcrumbs: [
        { title: 'Deals', href: '/crm/deals' },
        { title: 'Pipeline', href: '/crm/deals/board' },
    ],
};
