import { Form, Head, Link, router } from '@inertiajs/react';
import {
    CalendarClock,
    Ellipsis,
    Plus,
    Search,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
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
        return `${new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 0 }).format(cents / 100)} DZD`;
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
            { preserveScroll: true },
        );
    };

    return (
        <div
            draggable
            onDragStart={(event) => onDragStart(event, deal.id)}
            onDragEnd={onDragEnd}
            className={cn(
                'group cursor-grab rounded-lg border border-hairline bg-canvas p-4 text-sm shadow-xs transition-opacity',
                dragging && 'opacity-40',
            )}
            data-testid={`deal-card-${deal.id}`}
        >
            <div className="flex items-start justify-between gap-1">
                <Link
                    href={deal.url}
                    className="min-w-0 flex-1 truncate font-medium hover:text-brand"
                >
                    {deal.title}
                </Link>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            aria-label={`Move ${deal.title}`}
                            className="grid size-6 shrink-0 place-content-center rounded text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted"
                        >
                            <Ellipsis className="size-4" />
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

            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {[deal.contact_name, deal.company_name]
                    .filter(Boolean)
                    .join(' · ') || 'No contact'}
            </p>

            <p className="mt-1.5 text-sm font-semibold">
                {formatAmount(deal.amount_cents, deal.currency)}
            </p>

            {deal.next_task ? (
                <p
                    className={cn(
                        'mt-1.5 flex items-center gap-1.5 truncate text-xs',
                        deal.next_task.overdue
                            ? 'text-destructive'
                            : deal.task_due_today
                              ? 'text-brand'
                              : 'text-muted-foreground',
                    )}
                >
                    <CalendarClock className="size-3.5 shrink-0" />
                    <span className="truncate">{deal.next_task.subject}</span>
                    <span className="shrink-0">
                        · {dueLabel(deal.next_task)}
                    </span>
                </p>
            ) : (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground/70">
                    <CalendarClock className="size-3.5 shrink-0" />
                    No task
                </p>
            )}
        </div>
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
            `/crm/deals/${dealId}/move`,
            { stage_id: stage.id },
            { preserveScroll: true },
        );
    };

    return (
        <>
            <Head title="Leads" />
            <div className="flex-1 p-6">
                <PageHeader
                    title="Leads"
                    description={`${pipeline.name} pipeline — drag a card to another stage to update the deal.`}
                >
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                        <Input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search title, contact, company…"
                            className="pl-8"
                            aria-label="Search leads"
                        />
                    </div>
                </PageHeader>

                <div className="mb-4 flex flex-wrap items-center gap-1.5">
                    {STRIP.map((chip) => (
                        <Link
                            key={chip.key}
                            href={`/leads?filter=${chip.key}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                            preserveScroll
                            className={cn(
                                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                                filter === chip.key
                                    ? 'border-brand bg-brand text-primary-foreground'
                                    : 'bg-card text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {chip.label}
                            <span
                                className={cn(
                                    'ml-1.5',
                                    filter === chip.key
                                        ? 'text-primary-foreground/80'
                                        : 'text-muted-foreground/70',
                                )}
                            >
                                {counts[chip.key as keyof Counts]}
                            </span>
                        </Link>
                    ))}
                </div>

                <div className="flex items-start gap-4 overflow-x-auto pb-2 sm:gap-5">
                    {stages.map((stage, stageIndex) => {
                        const cards = deals.filter(
                            (deal) => deal.stage_id === stage.id,
                        );
                        const total = cards.reduce(
                            (sum, deal) => sum + deal.amount_cents,
                            0,
                        );

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
                                    'w-72 shrink-0 rounded-xl border border-hairline bg-canvas p-3 shadow-xs transition-shadow',
                                    overStage === stage.id &&
                                        'ring-2 ring-brand/50',
                                )}
                                data-testid={`stage-column-${stage.slug}`}
                            >
                                <header className="px-1 pb-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <h2 className="truncate text-sm font-semibold">
                                            {stage.name}
                                        </h2>
                                        <span className="text-xs text-muted-foreground">
                                            {cards.length}
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {formatAmount(total, 'DZD')}
                                    </p>
                                    <div
                                        className="mt-2 h-1 rounded-full"
                                        style={{
                                            backgroundColor: stageUnderlineColor(
                                                stage.slug,
                                            ),
                                        }}
                                    />
                                </header>

                                <div className="grid min-h-16 gap-3">
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

                                    {cards.length === 0 && (
                                        <p className="rounded-lg border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
                                            Drop a card here
                                        </p>
                                    )}

                                    {stageIndex === 0 &&
                                        (adding ? (
                                            <Form
                                                action="/crm/deals"
                                                method="post"
                                                resetOnSuccess
                                                onSuccess={() =>
                                                    setAdding(false)
                                                }
                                                className="grid gap-2 rounded-lg border bg-card p-2"
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
                                                className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-brand hover:text-brand"
                                            >
                                                <Plus className="size-3.5" />
                                                Quick add
                                            </button>
                                        ))}
                                </div>
                            </section>
                        );
                    })}
                </div>
            </div>
        </>
    );
}

LeadsBoard.layout = {
    breadcrumbs: [{ title: 'Leads', href: '/leads' }],
};
