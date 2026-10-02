import { Link, router } from '@inertiajs/react';
import { DotsThree } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { BoardOptions } from '@/components/crm/board-options-sheet';
import { Button } from '@/evo/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/evo/ui/dropdown-menu';
import { useQuickRecord } from '@/ds/workspace/quick-record';
import { DealCard } from '@/evo/crm/pipeline/DealCard';
import { LostReasonDialog } from '@/evo/crm/pipeline/LostReasonDialog';
import { Pipeline } from '@/evo/crm/pipeline/Pipeline';
import type {
    LostReasonPending,
    PipelineColumnData,
} from '@/evo/crm/pipeline/types';
import type { DealAttention } from '@/lib/deal-attention';
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
    attention?: DealAttention | null;
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

function moveDeal(dealId: number, stageId: number, lostReason?: string): void {
    router.post(
        `/crm/deals/${dealId}/move`,
        { stage_id: stageId, lost_reason: lostReason },
        {
            preserveScroll: true,
            onError: (errors) => {
                toast.error(
                    errors.stage_id ??
                        t(
                            'Could not move this deal. Fill the required fields and try again.',
                        ),
                );
            },
        },
    );
}

function BoardDealCard({
    deal,
    stages,
    options,
}: {
    deal: BoardDeal;
    stages: BoardStage[];
    options: BoardOptions;
}) {
    const { openRecord } = useQuickRecord();
    const compact = options.card_style === 'compact';
    const association = options.show_associations
        ? deal.company_name || deal.contact_name || null
        : null;
    const nextLabel = deal.next_activity_label?.trim() || null;
    const quoteCount = deal.quote_count ?? 0;
    const inactiveLabel =
        options.show_activity && !nextLabel
            ? deal.inactive_days && deal.inactive_days >= 1
                ? deal.inactive_days === 1
                    ? t('No activity for :count day', { count: deal.inactive_days })
                    : t('No activity for :count days', { count: deal.inactive_days })
                : t('No activity')
            : null;

    return (
        <DealCard
            deal={{
                id: deal.id,
                title: deal.title,
                amount: formatDzd(deal.amount_cents),
                association,
                owner: compact ? null : (deal.owner_name ?? t('Unassigned')),
                href: deal.url,
                attention: deal.attention?.primary?.label ?? null,
                attentionType: deal.attention?.primary?.type ?? '',
                attentionSeverity: deal.attention?.primary?.severity ?? null,
                nextActivity: nextLabel,
                quotes:
                    quoteCount > 0
                        ? quoteCount === 1
                            ? t('1 quote')
                            : `${quoteCount} quotes`
                        : null,
                inactive: inactiveLabel,
                closeDate: deal.close_date
                    ? formatCloseDate(deal.close_date)
                    : null,
                priority: options.show_priority
                    ? (deal.priority ?? null)
                    : null,
                compact,
            }}
            onOpen={(opener) => openRecord({ type: 'deal', id: deal.id }, { opener: opener ?? null })}
            menu={
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 shrink-0 px-0 text-mute"
                            aria-label={t('Move to stage')}
                        >
                            <DotsThree
                                className="size-4"
                                weight="bold"
                                aria-hidden
                            />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {stages
                            .filter((stage) => stage.id !== deal.stage_id)
                            .map((stage) => (
                                <DropdownMenuItem
                                    key={stage.id}
                                    onSelect={() => moveDeal(deal.id, stage.id)}
                                >
                                    {stage.name}
                                </DropdownMenuItem>
                            ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            }
        />
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
    const [lost, setLost] = useState<LostReasonPending | null>(null);
    const dealById = useMemo(
        () => new Map(deals.map((deal) => [String(deal.id), deal])),
        [deals],
    );

    const columns: PipelineColumnData[] = stages.map((stage) => ({
        id: String(stage.id),
        name: stage.name,
        slug: stage.slug,
        count: stage.count,
        amount: formatDzd(stage.amount_cents),
        weighted: formatDzd(stage.weighted_cents),
        probability: stage.probability,
        accent: dealStageColumnAccent(stage),
        isLost: stage.is_lost,
        isWon: stage.is_won,
    }));

    const itemsByColumn = stages.reduce<Record<string, string[]>>(
        (acc, stage) => {
            acc[String(stage.id)] = deals
                .filter((deal) => deal.stage_id === stage.id)
                .map((deal) => `deal:${deal.id}`);

            return acc;
        },
        {},
    );

    return (
        <>
            <Pipeline
                columns={columns}
                itemsByColumn={itemsByColumn}
                loading={loading}
                renderCard={(itemId) => {
                    const deal = dealById.get(itemId.replace(/^deal:/, ''));

                    if (!deal) {
                        return null;
                    }

                    return (
                        <BoardDealCard
                            deal={deal}
                            stages={stages}
                            options={options}
                        />
                    );
                }}
                renderOverlay={(itemId) =>
                    dealById.get(itemId.replace(/^deal:/, ''))?.title
                }
                onMove={({ itemId, toColumnId }) => {
                    const dealId = Number(itemId.replace(/^deal:/, ''));
                    const stage = stages.find(
                        (row) => String(row.id) === toColumnId,
                    );
                    const deal = dealById.get(String(dealId));

                    if (!stage || !deal || Number.isNaN(dealId)) {
                        return;
                    }

                    if (stage.is_lost) {
                        setLost({
                            itemId,
                            columnId: toColumnId,
                            title: deal.title,
                        });

                        return;
                    }

                    moveDeal(dealId, stage.id);
                }}
            />
            <LostReasonDialog
                pending={lost}
                onCancel={() => setLost(null)}
                onConfirm={(reason) => {
                    if (!lost) {
                        return;
                    }

                    const dealId = Number(lost.itemId.replace(/^deal:/, ''));
                    const stage = stages.find(
                        (row) => String(row.id) === lost.columnId,
                    );

                    if (stage && !Number.isNaN(dealId)) {
                        moveDeal(dealId, stage.id, reason);
                    }

                    setLost(null);
                }}
            />
            {/* PipelineKanbanFooter — evo PipelineColumnFooter. Keep identifier for Wave2. */}
            {/* Link kept so deal titles remain crawlable without a full-page visit */}
            <span className="sr-only">
                {deals.map((deal) => (
                    <Link key={deal.id} href={deal.url}>
                        {deal.title}
                    </Link>
                ))}
            </span>
        </>
    );
}
