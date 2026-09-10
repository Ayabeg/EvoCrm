import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import type { DragEvent } from 'react';
import { toast } from 'sonner';
import { CrmObjectHeader } from '@/components/crm/crm-object-header';
import { CrmShell } from '@/components/crm/crm-shell';
import DealForecastBar from '@/components/crm/deal-forecast-bar';
import DealLayoutToggle from '@/components/crm/deal-layout-toggle';
import { BoardOptionsSheet } from '@/components/crm/board-options-sheet';
import type { BoardOptions } from '@/components/crm/board-options-sheet';
import {
    PipelineKanban,
    PipelineKanbanCard,
    PipelineKanbanColumn,
    PipelineKanbanEmpty,
    PipelineKanbanFooter,
    PipelineKanbanHeader,
    PipelineKanbanStack,
} from '@/components/crm/pipeline-kanban';
import PipelineSwitcher from '@/components/crm/pipeline-switcher';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
    priority?: 'high' | 'low' | null;
    last_touch_at?: string | null;
    inactive_days?: number | null;
    is_inactive?: boolean;
    has_next_activity?: boolean;
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

function formatCloseDate(value: string): string {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);

    if (!match) {
        return value;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
    });
}

function DealCard({
    deal,
    dragging,
    options,
    onDragStart,
    onDragEnd,
}: {
    deal: BoardDeal;
    dragging: boolean;
    options: BoardOptions;
    onDragStart: (event: DragEvent, dealId: number) => void;
    onDragEnd: () => void;
}) {
    const compact = options.card_style === 'compact';
    const association = deal.company_name || deal.contact_name || 'No company';
    const inactiveLabel =
        deal.inactive_days == null
            ? 'No activity'
            : `No activity for ${deal.inactive_days} day${deal.inactive_days === 1 ? '' : 's'}`;

    return (
        <PipelineKanbanCard
            dragging={dragging}
            testId={`deal-card-${deal.id}`}
            className={compact ? 'px-2 py-1.5' : undefined}
            onDragStart={(event) => onDragStart(event, deal.id)}
            onDragEnd={onDragEnd}
        >
            <div className="flex items-start justify-between gap-2">
                <Link
                    href={deal.url}
                    className="block min-w-0 truncate font-medium text-ink hover:underline"
                >
                    {deal.title}
                </Link>
                {options.show_priority && deal.priority ? (
                    <span
                        className={
                            deal.priority === 'high'
                                ? 'shrink-0 text-[10px] font-medium text-ink'
                                : 'shrink-0 text-[10px] font-medium text-mute'
                        }
                    >
                        {deal.priority === 'high' ? 'High' : 'Low'}
                    </span>
                ) : null}
            </div>
            {options.show_associations ? (
                <p className="mt-0.5 truncate text-[11px] text-mute">{association}</p>
            ) : null}
            <p className="money mt-1 break-words text-[13px] font-semibold tabular-nums text-ink">
                {formatDzd(deal.amount_cents)}
            </p>
            {deal.close_date ? (
                <p className="mt-0.5 text-[11px] text-mute">
                    Close date: {formatCloseDate(deal.close_date)}
                </p>
            ) : null}
            {options.show_activity ? (
                <p className="mt-1 text-[11px] text-mute">{inactiveLabel}</p>
            ) : null}
            {options.mark_inactive && deal.is_inactive && !deal.has_next_activity ? (
                <p className="mt-0.5 text-[11px] text-ink">No activity scheduled</p>
            ) : null}
            {compact ? null : (
                <p className="mt-0.5 truncate text-[11px] text-mute">
                    {deal.owner_name ?? 'Unassigned'}
                </p>
            )}
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

const defaultBoardOptions: BoardOptions = {
    card_style: 'default',
    show_priority: true,
    show_associations: true,
    show_activity: true,
    mark_inactive: true,
    inactive_after_days: 14,
    sort: 'last_activity',
};

export default function DealBoard({
    pipeline,
    pipelines,
    stages,
    deals,
    forecast,
    forecastBand,
    forecastBacktest,
    boardOptions = defaultBoardOptions,
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
    forecastBacktest?: {
        status: string;
        label: string;
        sample_count: number;
        error_pct: number | null;
        within_15: boolean;
    } | null;
    boardOptions?: BoardOptions;
}) {
    const [draggingId, setDraggingId] = useState<number | null>(null);
    const [overStage, setOverStage] = useState<number | null>(null);
    const [optionsOpen, setOptionsOpen] = useState(false);
    const loading = useInertiaLoading();
    const createHref = createDealHref(pipeline.id);
    const exportHref = `/crm/deals/export?pipeline=${pipeline.id}`;

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
                onError: (errors) => {
                    toast.error(errors.stage_id ?? 'Could not move this deal. Fill the required fields and try again.');
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
                    primaryLabel="Create deal"
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
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button type="button" variant="outline" size="sm" className="h-8">
                                        Board options
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={() => setOptionsOpen(true)}>
                                        Edit cards
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/settings/pipelines">Edit stages</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <a href={exportHref}>Export view</a>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    }
                />

                <DealForecastBar
                    forecast={forecast}
                    forecastBand={forecastBand}
                    forecastBacktest={forecastBacktest}
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
                            Create deal
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
                                            accent={stageUnderlineColor(
                                                stage.slug,
                                            )}
                                        />

                                        <PipelineKanbanStack>
                                            {cards.map((deal) => (
                                                <DealCard
                                                    key={deal.id}
                                                    deal={deal}
                                                    options={boardOptions}
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
                                        <PipelineKanbanFooter
                                            amount={formatDzd(stage.amount_cents)}
                                            weighted={formatDzd(stage.weighted_cents)}
                                            probability={stage.probability}
                                        />
                                    </PipelineKanbanColumn>
                                );
                            })}
                        </PipelineKanban>
                    )}
                </div>
            </div>
            <BoardOptionsSheet
                open={optionsOpen}
                onOpenChange={setOptionsOpen}
                options={boardOptions}
                exportHref={exportHref}
            />
        </CrmShell>
    );
}

DealBoard.layout = {
    breadcrumbs: [
        { title: 'Deals', href: '/crm/deals' },
        { title: 'Pipeline', href: '/crm/deals/board' },
    ],
};
