import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import type { DragEvent } from 'react';
import DealForecastBar from '@/components/crm/deal-forecast-bar';
import DealLayoutToggle from '@/components/crm/deal-layout-toggle';
import PipelineSwitcher from '@/components/crm/pipeline-switcher';
import { formatDzd } from '@/lib/money';
import PageHeader from '@/components/page-header';
import { cn } from '@/lib/utils';

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

/**
 * Stage underlines stay inside Evotechly white / black / #EC6025.
 * Same existing pipeline names as the list hub: New → Lost.
 */
const STAGE_COLORS: Record<string, string> = {
    new: '#EC6025',
    qualified: '#F08A5C',
    demo: '#A3A3A3',
    proposal: '#8A8A8A',
    won: 'var(--evosales-ink)',
    lost: '#D4D4D4',
};

function stageColor(slug: string): string {
    return STAGE_COLORS[slug] ?? '#8A8A8A';
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
    return (
        <div
            draggable
            onDragStart={(event) => onDragStart(event, deal.id)}
            onDragEnd={onDragEnd}
            className={cn(
                'cursor-grab rounded-lg border border-hairline bg-canvas p-3 text-sm shadow-xs',
                dragging && 'opacity-40',
            )}
            data-testid={`deal-card-${deal.id}`}
        >
            <Link href={deal.url} className="block truncate font-medium hover:text-brand">
                {deal.title}
            </Link>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {[deal.contact_name, deal.company_name].filter(Boolean).join(' · ') ||
                    'No contact'}
            </p>
            <p className="money mt-1.5 text-sm font-semibold text-ink">
                {formatDzd(deal.amount_cents)}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {deal.owner_name ?? 'Unassigned'}
                {deal.close_date ? ` · ${deal.close_date}` : ''}
            </p>
        </div>
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
            { preserveScroll: true },
        );
    };

    return (
        <>
            <Head title="Deals board" />
            <div className="flex-1 space-y-4 bg-canvas p-6 text-ink">
                <PageHeader
                    title="Deals board"
                    description={`${pipeline.name} — drag a card to move its stage. Weighted forecast uses stage probability.`}
                >
                    <div className="flex flex-wrap items-center gap-2">
                        <PipelineSwitcher
                            pipelineId={pipeline.id}
                            pipelines={pipelines}
                            basePath="/crm/deals/board"
                        />
                        <DealLayoutToggle current="board" pipelineId={pipeline.id} />
                    </div>
                </PageHeader>

                <DealForecastBar forecast={forecast} forecastBand={forecastBand} />

                <div className="flex items-start gap-3 overflow-x-auto pb-6">
                    {stages.map((stage) => {
                        const cards = deals.filter((deal) => deal.stage_id === stage.id);

                        return (
                            <section
                                key={stage.id}
                                onDragOver={(event) => {
                                    event.preventDefault();
                                    event.dataTransfer.dropEffect = 'move';
                                    setOverStage(stage.id);
                                }}
                                onDragLeave={() =>
                                    setOverStage((current) =>
                                        current === stage.id ? null : current,
                                    )
                                }
                                onDrop={(event) => onDrop(event, stage)}
                                className={cn(
                                    'w-64 shrink-0 rounded-xl border border-hairline bg-canvas-soft/60 p-2',
                                    overStage === stage.id && 'ring-2 ring-brand/50',
                                )}
                                data-testid={`stage-column-${stage.slug}`}
                            >
                                <header className="px-1.5 pt-1 pb-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <h2 className="truncate text-sm font-semibold">
                                            {stage.name}
                                        </h2>
                                        <span className="text-xs tabular-nums text-muted-foreground">
                                            {stage.count}
                                        </span>
                                    </div>
                                    <p className="money mt-0.5 text-xs text-ink">
                                        {formatDzd(stage.amount_cents)}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground">
                                        Weighted {formatDzd(stage.weighted_cents)} ·{' '}
                                        {stage.probability}%
                                    </p>
                                    <div
                                        className="mt-2 h-1 rounded-full"
                                        style={{ backgroundColor: stageColor(stage.slug) }}
                                    />
                                </header>

                                <div className="grid min-h-16 gap-2">
                                    {cards.map((deal) => (
                                        <DealCard
                                            key={deal.id}
                                            deal={deal}
                                            dragging={draggingId === deal.id}
                                            onDragStart={onDragStart}
                                            onDragEnd={() => {
                                                setDraggingId(null);
                                                setOverStage(null);
                                            }}
                                        />
                                    ))}

                                    {cards.length === 0 ? (
                                        <p className="rounded-lg border border-dashed border-hairline px-3 py-4 text-center text-xs text-muted-foreground">
                                            Drop a card here
                                        </p>
                                    ) : null}
                                </div>
                            </section>
                        );
                    })}
                </div>
            </div>
        </>
    );
}

DealBoard.layout = {
    breadcrumbs: [
        { title: 'Deals', href: '/crm/deals' },
        { title: 'Board', href: '/crm/deals/board' },
    ],
};
