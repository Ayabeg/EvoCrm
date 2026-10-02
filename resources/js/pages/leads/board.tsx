import { Form, Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { toast } from 'sonner';
import { CrmObjectHeader } from '@/components/crm/crm-object-header';
import LeadScorePill from '@/components/crm/lead-score-pill';
import {
    PipelineKanban,
    PipelineKanbanCard,
    PipelineKanbanColumn,
    PipelineKanbanEmpty,
    PipelineKanbanHeader,
    PipelineKanbanStack,
} from '@/components/crm/pipeline-kanban';
import { Button } from '@/evo/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/evo/ui/dropdown-menu';
import { Input } from '@/evo/ui/input';
import { Clock, DotsThree, MagnifyingGlass, Plus } from '@/evo/icons';
import { t } from '@/lib/i18n';
import { formatDzd } from '@/lib/money';
import { stageUnderlineColor } from '@/lib/stage-colors';
import { cn } from '@/lib/utils';

type Stage = {
    id: number;
    name: string;
    slug: string;
    position: number;
    is_won: boolean;
    is_lost: boolean;
};

type BoardDeal = {
    id: number;
    title: string;
    amount_cents: number;
    currency: string;
    stage_id: number;
    terminal: boolean;
    contact_name: string | null;
    company_name: string | null;
    owner_name: string | null;
    next_task: {
        subject: string;
        due_at: string | null;
        overdue: boolean;
    } | null;
    has_task: boolean;
    task_due_today: boolean;
    task_overdue: boolean;
    created_today: boolean;
    url: string;
    lead_score?: {
        score: number;
        reason: string | null;
    } | null;
};

type Counts = {
    active: number;
    tasks_today: number;
    no_tasks: number;
    overdue: number;
    new_today: number;
};

const STRIP: { key: string; label: string }[] = [
    { key: 'active', label: 'Active' },
    { key: 'tasks_today', label: 'Tasks today' },
    { key: 'no_tasks', label: 'No tasks' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'new_today', label: 'New today' },
];

function formatAmount(cents: number, currency: string): string {
    if (currency === 'DZD') {
        return formatDzd(cents);
    }

    return new Intl.NumberFormat('en', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(cents / 100);
}

function dueLabel(task: NonNullable<BoardDeal['next_task']>): string {
    if (!task.due_at) {
        return 'No date';
    }

    const due = new Date(task.due_at);
    const now = new Date();
    const sameDay = due.toDateString() === now.toDateString();

    if (task.overdue && !sameDay) {
        return `Overdue · ${due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
    }

    if (sameDay) {
        return due.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    return due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function DealCard({
    deal,
    stages,
    onDragStart,
    onDragEnd,
    dragging,
}: {
    deal: BoardDeal;
    stages: Stage[];
    onDragStart: (event: DragEvent, dealId: number) => void;
    onDragEnd: () => void;
    dragging: boolean;
}) {
    const moveTo = (stageId: number) => {
        router.post(
            `/crm/deals/${deal.id}/move`,
            { stage_id: stageId },
            {
                preserveScroll: true,
                onError: (errors) => {
                    toast.error(errors.stage_id ?? 'Could not move this deal. Fill the required fields and try again.');
                },
            },
        );
    };

    return (
        <PipelineKanbanCard
            dragging={dragging}
            testId={`deal-card-${deal.id}`}
            onDragStart={(event) => onDragStart(event, deal.id)}
            onDragEnd={onDragEnd}
            className="group"
        >
            <div className="flex items-start justify-between gap-1">
                <Link
                    href={deal.url}
                    className="min-w-0 flex-1 truncate font-medium text-ink hover:underline"
                >
                    {deal.title}
                </Link>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            aria-label={`Move ${deal.title}`}
                            className="grid size-6 shrink-0 place-content-center rounded text-mute opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 hover:bg-muted"
                        >
                            <DotsThree className="size-4" aria-hidden />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {stages
                            .filter((stage) => stage.id !== deal.stage_id)
                            .map((stage) => (
                                <DropdownMenuItem
                                    key={stage.id}
                                    onSelect={() => moveTo(stage.id)}
                                >
                                    Move to {stage.name}
                                </DropdownMenuItem>
                            ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <p className="mt-0.5 truncate text-xs text-mute">
                {[deal.contact_name, deal.company_name]
                    .filter(Boolean)
                    .join(' · ') || 'No contact'}
            </p>

            <p className="money mt-1.5 text-sm font-semibold text-ink">
                {formatAmount(deal.amount_cents, deal.currency)}
            </p>

            {deal.lead_score ? (
                <LeadScorePill compact score={deal.lead_score} />
            ) : null}

            {deal.next_task ? (
                <p
                    className={cn(
                        'mt-1.5 flex items-center gap-1.5 truncate text-xs',
                        deal.next_task.overdue
                            ? 'text-destructive'
                            : deal.task_due_today
                              ? 'text-brand'
                              : 'text-mute',
                    )}
                >
                    <Clock className="size-3.5 shrink-0" />
                    <span className="truncate">{deal.next_task.subject}</span>
                    <span className="shrink-0 tabular-nums">
                        · {dueLabel(deal.next_task)}
                    </span>
                </p>
            ) : (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-mute/70">
                    <Clock className="size-3.5 shrink-0" />
                    No task
                </p>
            )}
        </PipelineKanbanCard>
    );
}

export default function LeadsBoard({
    pipeline,
    stages,
    deals,
    counts,
    filter,
    q,
}: {
    pipeline: { id: number; name: string };
    stages: Stage[];
    deals: BoardDeal[];
    counts: Counts;
    filter: string;
    q: string;
}) {
    const [query, setQuery] = useState(q);
    const [lastQ, setLastQ] = useState(q);
    const [draggingId, setDraggingId] = useState<number | null>(null);
    const [overStage, setOverStage] = useState<number | null>(null);
    const [adding, setAdding] = useState(false);
    const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Adjust local search state when the server-side q prop changes
    // (e.g. a strip chip was clicked) — the render-time adjust pattern.
    if (q !== lastQ) {
        setLastQ(q);
        setQuery(q);
    }

    useEffect(() => {
        if (query === q) {
            return;
        }

        if (debounce.current) {
            clearTimeout(debounce.current);
        }

        debounce.current = setTimeout(() => {
            router.get(
                '/leads',
                { filter, q: query || undefined },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 300);

        return () => {
            if (debounce.current) {
                clearTimeout(debounce.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    const firstStage = stages[0];

    const onDragStart = (event: DragEvent, dealId: number) => {
        event.dataTransfer.setData('text/plain', String(dealId));
        event.dataTransfer.effectAllowed = 'move';
        setDraggingId(dealId);
    };

    const onDrop = (event: DragEvent, stage: Stage) => {
        event.preventDefault();
        const dealId = Number(event.dataTransfer.getData('text/plain'));
        setDraggingId(null);
        setOverStage(null);

        const deal = deals.find((row) => row.id === dealId);

        if (!deal || deal.stage_id === stage.id) {
            return;
        }

        router.post(
            `/crm/deals/${deal.id}/move`,
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
        <>
            <Head title="Leads" />
            <div className="flex min-h-0 flex-1 flex-col bg-canvas-soft text-ink">
                <CrmObjectHeader
                    title="Lead board"
                    description={`${pipeline.name} · drag a card to update the stage`}
                    primaryLabel="New lead"
                    onPrimary={() => setAdding(true)}
                />

                <div className="border-b border-hairline bg-canvas px-4 py-1.5 sm:px-6">
                    <div className="relative mb-1.5 max-w-md">
                        <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-mute" />
                        <Input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={t('Search leads…')}
                            className="h-8 pl-7 text-[12px]"
                            aria-label={t('Search leads')}
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                    {STRIP.map((chip) => (
                        <Link
                            key={chip.key}
                            href={`/leads?filter=${chip.key}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                            preserveScroll
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px]',
                                filter === chip.key
                                    ? 'border-ink bg-canvas-soft font-medium text-ink'
                                    : 'border-hairline text-mute hover:text-ink',
                            )}
                        >
                            {chip.label}
                            <span className="tabular-nums">
                                {counts[chip.key as keyof Counts]}
                            </span>
                        </Link>
                    ))}
                    </div>
                </div>

                <div className="min-h-0 flex-1 overflow-auto px-2 py-2 sm:px-3">

                <PipelineKanban>
                    {stages.map((stage, stageIndex) => {
                        const cards = deals.filter(
                            (deal) => deal.stage_id === stage.id,
                        );
                        const total = cards.reduce(
                            (sum, deal) => sum + deal.amount_cents,
                            0,
                        );

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
                                    setOverStage((current) =>
                                        current === stage.id ? null : current,
                                    )
                                }
                                onDrop={(event) => onDrop(event, stage)}
                            >
                                <PipelineKanbanHeader
                                    name={stage.name}
                                    count={cards.length}
                                    amount={formatAmount(total, 'DZD')}
                                    accent={stageUnderlineColor(stage.slug)}
                                />

                                <PipelineKanbanStack>
                                    {cards.map((deal) => (
                                        <DealCard
                                            key={deal.id}
                                            deal={deal}
                                            stages={stages}
                                            onDragStart={onDragStart}
                                            onDragEnd={() => {
                                                setDraggingId(null);
                                                setOverStage(null);
                                            }}
                                            dragging={draggingId === deal.id}
                                        />
                                    ))}

                                    {cards.length === 0 ? (
                                        <PipelineKanbanEmpty />
                                    ) : null}

                                    {stageIndex === 0 &&
                                        (adding ? (
                                            <Form
                                                action="/crm/deals"
                                                method="post"
                                                resetOnSuccess
                                                onSuccess={() =>
                                                    setAdding(false)
                                                }
                                                className="grid gap-2 rounded-[var(--radius-1)] border border-hairline bg-canvas p-3"
                                            >
                                                {({ processing }) => (
                                                    <>
                                                        <input
                                                            type="hidden"
                                                            name="stage_id"
                                                            value={
                                                                firstStage.id
                                                            }
                                                        />
                                                        <Input
                                                            name="title"
                                                            placeholder="Lead title"
                                                            required
                                                            autoFocus
                                                        />
                                                        <Input
                                                            name="contact_name"
                                                            placeholder="Contact name"
                                                            required
                                                        />
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                disabled={
                                                                    processing
                                                                }
                                                            >
                                                                Add
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                type="button"
                                                                onClick={() =>
                                                                    setAdding(
                                                                        false,
                                                                    )
                                                                }
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    </>
                                                )}
                                            </Form>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setAdding(true)}
                                                className="flex items-center justify-center gap-1.5 rounded-[var(--radius-1)] border border-dashed border-hairline px-3 py-2 text-xs font-medium text-mute transition-colors hover:border-ink hover:text-ink"
                                            >
                                                <Plus className="size-3.5" />
                                                Quick add
                                            </button>
                                        ))}
                                </PipelineKanbanStack>
                            </PipelineKanbanColumn>
                        );
                    })}
                </PipelineKanban>
                </div>
            </div>
        </>
    );
}

LeadsBoard.layout = {
    breadcrumbs: [{ title: 'Leads', href: '/leads' }],
};
