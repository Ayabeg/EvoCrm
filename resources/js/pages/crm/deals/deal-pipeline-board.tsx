import { Link, router } from '@inertiajs/react';
import { DotsThree } from '@phosphor-icons/react';
import { useState } from 'react';
import type { DragEvent } from 'react';
import { toast } from 'sonner';
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
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuickRecord } from '@/ds/workspace/quick-record';
import { t } from '@/lib/i18n';
import { formatDzd } from '@/lib/money';
import { dealStageColumnAccent } from '@/lib/stage-colors';

export type BoardStage = {
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

export type BoardDeal = {
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
    next_activity_label?: string | null;
    quote_count?: number;
    url: string;
};

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

function moveDeal(dealId: number, stageId: number): void {
    router.post(
        `/crm/deals/${dealId}/move`,
        { stage_id: stageId },
        {
            preserveScroll: true,
            onError: (errors) => {
                toast.error(
                    errors.stage_id ??
                        t('Could not move this deal. Fill the required fields and try again.'),
                );
            },
        },
    );
}

function DealCard({
    deal,
    stages,
    dragging,
    moving,
    options,
    onDragStart,
    onDragEnd,
}: {
    deal: BoardDeal;
    stages: BoardStage[];
    dragging: boolean;
    moving: boolean;
    options: BoardOptions;
    onDragStart: (event: DragEvent, dealId: number) => void;
    onDragEnd: () => void;
}) {
    const { openRecord } = useQuickRecord();
    const compact = options.card_style === 'compact';
    const association = deal.company_name || deal.contact_name || null;
    const nextLabel = deal.next_activity_label?.trim() || null;
    const quoteCount = deal.quote_count ?? 0;
    const inactiveLabel =
        deal.inactive_days && deal.inactive_days >= 1
            ? `No activity for ${deal.inactive_days} day${deal.inactive_days === 1 ? '' : 's'}`
            : 'No activity';

    return (
        <PipelineKanbanCard
            dragging={dragging}
            testId={`deal-card-${deal.id}`}
            href={deal.url}
            label={`Inspect ${deal.title}`}
            className={compact ? 'px-2 py-1.5' : undefined}
            onDragStart={(event) => onDragStart(event, deal.id)}
            onDragEnd={onDragEnd}
            onOpen={(opener) =>
                openRecord({ type: 'deal', id: deal.id }, { opener: opener ?? null })
            }
        >
            <div className="flex items-start justify-between gap-2">
                <Link
                    href={deal.url}
                    className="block min-w-0 truncate font-medium text-ink hover:underline"
                >
                    {deal.title}
                </Link>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 shrink-0 px-0 text-mute"
                            aria-label={t('Move to stage')}
                            disabled={moving}
                        >
                            <DotsThree className="size-4" weight="bold" aria-hidden />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {stages
                            .filter((stage) => stage.id !== deal.stage_id)
                            .map((stage) => (
                                <DropdownMenuItem
                                    key={stage.id}
                                    disabled={moving}
                                    onSelect={() => moveDeal(deal.id, stage.id)}
                                >
                                    {stage.name}
                                </DropdownMenuItem>
                            ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            {options.show_associations && association ? (
                <p className="mt-0.5 truncate text-[11px] text-mute">{association}</p>
            ) : null}
            <p className="money mt-1 break-words text-[13px] font-semibold tabular-nums text-ink">
                {formatDzd(deal.amount_cents)}
            </p>
            {compact ? null : (
                <p className="mt-0.5 truncate text-[11px] text-mute">
                    {deal.owner_name ?? t('Unassigned')}
                </p>
            )}
            {nextLabel ? (
                <p className="mt-0.5 truncate text-[11px] text-mute">{nextLabel}</p>
            ) : null}
            {quoteCount > 0 ? (
                <p className="mt-0.5 text-[11px] text-mute">
                    {quoteCount === 1 ? t('1 quote') : `${quoteCount} quotes`}
                </p>
            ) : null}
            {options.show_activity && !nextLabel ? (
                <p className="mt-1 text-[11px] text-mute">{inactiveLabel}</p>
            ) : null}
            {options.mark_inactive && deal.is_inactive && !deal.has_next_activity ? (
                <p className="mt-0.5 text-[11px] text-ink">No activity scheduled</p>
            ) : null}
            {deal.close_date ? (
                <p className="mt-0.5 text-[11px] text-mute">{formatCloseDate(deal.close_date)}</p>
            ) : null}
            {options.show_priority && deal.priority ? (
                <p
                    className={
                        deal.priority === 'high'
                            ? 'mt-0.5 text-[10px] font-medium text-ink'
                            : 'mt-0.5 text-[10px] font-medium text-mute'
                    }
                >
                    {deal.priority === 'high' ? 'High' : 'Low'}
                </p>
            ) : null}
        </PipelineKanbanCard>
    );
}

export function DealPipelineBoard({
    stages,
    deals,
    options,
    loading = false,
}: {
    stages: BoardStage[];
    deals: BoardDeal[];
    options: BoardOptions;
    loading?: boolean;
}) {
    const [draggingId, setDraggingId] = useState<number | null>(null);
    const [overStage, setOverStage] = useState<number | null>(null);
    const [movingId, setMovingId] = useState<number | null>(null);

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

        if (!deal || deal.stage_id === stage.id || movingId === dealId) {
            return;
        }

        setMovingId(dealId);
        router.post(
            `/crm/deals/${dealId}/move`,
            { stage_id: stage.id },
            {
                preserveScroll: true,
                onError: (errors) => {
                    toast.error(
                        errors.stage_id ??
                            t('Could not move this deal. Fill the required fields and try again.'),
                    );
                },
                onFinish: () => setMovingId(null),
            },
        );
    };

    if (loading) {
        return (
            <PipelineKanban className="h-full min-h-[22rem] px-1 sm:px-2" busy>
                {Array.from({ length: stages.length || 6 }).map((_, index) => (
                    <PipelineKanbanColumn key={index}>
                        <div className="mb-2 space-y-1.5 px-0.5">
                            <div className="h-3.5 w-24 animate-pulse rounded bg-hairline" />
                            <div className="h-2.5 w-14 animate-pulse rounded bg-hairline" />
                            <div className="h-3 w-20 animate-pulse rounded bg-hairline" />
                        </div>
                        <div className="grid gap-1.5">
                            <div className="h-[4.5rem] animate-pulse rounded-[10px] border border-hairline bg-white" />
                            <div className="h-[4.5rem] animate-pulse rounded-[10px] border border-hairline bg-white" />
                        </div>
                    </PipelineKanbanColumn>
                ))}
            </PipelineKanban>
        );
    }

    return (
        <PipelineKanban className="h-full min-h-[22rem] px-1 sm:px-2">
            {stages.map((stage) => {
                const cards = deals.filter((deal) => deal.stage_id === stage.id);

                return (
                    <PipelineKanbanColumn
                        key={stage.id}
                        testId={`stage-column-${stage.slug}`}
                        over={overStage === stage.id}
                        onDragOver={(event) => {
                            event.preventDefault();
                            event.dataTransfer.dropEffect = 'move';
                            setOverStage(stage.id);
                        }}
                        onDragLeave={() =>
                            setOverStage((current) => (current === stage.id ? null : current))
                        }
                        onDrop={(event) => onDrop(event, stage)}
                    >
                        <PipelineKanbanHeader
                            name={stage.name}
                            count={stage.count}
                            amount={formatDzd(stage.amount_cents)}
                            accent={dealStageColumnAccent(stage)}
                        />

                        <PipelineKanbanStack>
                            {cards.map((deal) => (
                                <DealCard
                                    key={deal.id}
                                    deal={deal}
                                    stages={stages}
                                    options={options}
                                    dragging={draggingId === deal.id}
                                    moving={movingId === deal.id}
                                    onDragStart={onDragStart}
                                    onDragEnd={() => {
                                        setDraggingId(null);
                                        setOverStage(null);
                                    }}
                                />
                            ))}

                            {cards.length === 0 ? <PipelineKanbanEmpty /> : null}
                        </PipelineKanbanStack>
                        <PipelineKanbanFooter
                            weighted={formatDzd(stage.weighted_cents)}
                            probability={stage.probability}
                        />
                    </PipelineKanbanColumn>
                );
            })}
        </PipelineKanban>
    );
}
