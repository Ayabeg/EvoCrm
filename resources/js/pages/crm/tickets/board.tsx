import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import type { DragEvent } from 'react';
import { toast } from 'sonner';
import { CrmObjectHeader } from '@/components/crm/crm-object-header';
import { CrmShell } from '@/components/crm/crm-shell';
import {
    PipelineKanban,
    PipelineKanbanCard,
    PipelineKanbanColumn,
    PipelineKanbanEmpty,
    PipelineKanbanHeader,
    PipelineKanbanStack,
} from '@/components/crm/pipeline-kanban';
import TicketLayoutToggle from '@/components/crm/ticket-layout-toggle';
import { Button } from '@/components/ui/button';
import { useInertiaLoading } from '@/hooks/use-inertia-loading';
import { cn } from '@/lib/utils';
import { stageUnderlineColor } from '@/lib/stage-colors';

type BoardColumn = {
    id: number;
    slug: string;
    name: string;
    count: number;
};

type BoardTicket = {
    id: number;
    number: string;
    subject: string;
    status: string;
    priority?: 'high' | 'medium' | 'low' | null;
    company_name: string | null;
    contact_name: string | null;
    owner_name: string | null;
    inactive_days?: number | null;
    is_inactive?: boolean;
    sla_label?: string | null;
    sla_breached?: boolean;
    url: string;
};

function TicketCard({
    ticket,
    dragging,
    onDragStart,
    onDragEnd,
}: {
    ticket: BoardTicket;
    dragging: boolean;
    onDragStart: (event: DragEvent, ticketId: number) => void;
    onDragEnd: () => void;
}) {
    const association = ticket.company_name || ticket.contact_name || 'No company';
    const inactiveLabel =
        ticket.inactive_days && ticket.inactive_days >= 1
            ? `Inactive for ${ticket.inactive_days} day${ticket.inactive_days === 1 ? '' : 's'}`
            : null;
    const showSla = ticket.status !== 'closed' && Boolean(ticket.sla_label) && ticket.sla_label !== '—';

    return (
        <PipelineKanbanCard
            dragging={dragging}
            testId={`ticket-card-${ticket.id}`}
            onDragStart={(event) => onDragStart(event, ticket.id)}
            onDragEnd={onDragEnd}
            onOpen={() => router.visit(ticket.url)}
        >
            <div className="flex items-start justify-between gap-2">
                <Link
                    href={ticket.url}
                    className="block min-w-0 truncate font-medium text-ink hover:underline"
                >
                    {ticket.subject}
                </Link>
                {ticket.priority && ticket.priority !== 'medium' ? (
                    <span
                        className={
                            ticket.priority === 'high'
                                ? 'shrink-0 text-[10px] font-medium text-ink'
                                : 'shrink-0 text-[10px] font-medium text-mute'
                        }
                    >
                        {ticket.priority === 'high' ? 'High' : 'Low'}
                    </span>
                ) : null}
            </div>
            <p className="mt-0.5 truncate text-[11px] tabular-nums text-mute">{ticket.number}</p>
            <p className="mt-0.5 truncate text-[11px] text-mute">{association}</p>
            {inactiveLabel ? (
                <p
                    className={cn(
                        'mt-1 text-[11px]',
                        ticket.is_inactive ? 'font-medium text-ink' : 'text-mute',
                    )}
                >
                    {inactiveLabel}
                </p>
            ) : null}
            {showSla ? (
                <p
                    className={cn(
                        'mt-0.5 text-[11px]',
                        ticket.sla_breached ? 'font-medium text-ink' : 'text-mute',
                    )}
                >
                    SLA {ticket.sla_label}
                </p>
            ) : null}
            <p className="mt-0.5 truncate text-[11px] text-mute">
                {ticket.owner_name ?? 'Unassigned'}
            </p>
        </PipelineKanbanCard>
    );
}

function TicketBoardSkeleton() {
    return (
        <PipelineKanban className="h-full px-2 sm:px-3" busy>
            {Array.from({ length: 4 }).map((_, index) => (
                <PipelineKanbanColumn key={index}>
                    <div className="mb-2 space-y-1.5 px-0.5">
                        <div className="h-3.5 w-24 animate-pulse rounded bg-hairline" />
                        <div className="h-2.5 w-14 animate-pulse rounded bg-hairline" />
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

export default function TicketBoard({
    columns,
    tickets,
    view = 'all',
}: {
    columns: BoardColumn[];
    tickets: BoardTicket[];
    view?: 'all' | 'my';
}) {
    const [draggingId, setDraggingId] = useState<number | null>(null);
    const [overStatus, setOverStatus] = useState<string | null>(null);
    const loading = useInertiaLoading();
    const createHref = '/crm/tickets?create=1';

    const onDragStart = (event: DragEvent, ticketId: number) => {
        event.dataTransfer.setData('text/plain', String(ticketId));
        event.dataTransfer.effectAllowed = 'move';
        setDraggingId(ticketId);
    };

    const onDrop = (event: DragEvent, column: BoardColumn) => {
        event.preventDefault();
        const ticketId = Number(event.dataTransfer.getData('text/plain'));
        setDraggingId(null);
        setOverStatus(null);

        const ticket = tickets.find((row) => row.id === ticketId);

        if (!ticket || ticket.status === column.slug) {
            return;
        }

        router.post(
            `/crm/tickets/${ticketId}/move`,
            { status: column.slug },
            {
                preserveScroll: true,
                onError: () => {
                    toast.error('Could not move this ticket. Try again.');
                },
            },
        );
    };

    return (
        <CrmShell title="Tickets" chrome="workspace">
            <div
                className="flex h-full min-h-0 flex-col bg-canvas-soft"
                data-crm="ticket-board"
            >
                <CrmObjectHeader
                    title="Tickets"
                    primaryLabel="Create ticket"
                    onPrimary={() => {
                        window.location.href = createHref;
                    }}
                    secondary={
                        <>
                            <div
                                className="inline-flex overflow-hidden rounded border border-hairline text-[11px]"
                                data-testid="ticket-board-views"
                            >
                                <Link
                                    href="/crm/tickets/board"
                                    aria-current={view === 'all' ? 'page' : undefined}
                                    className={cn(
                                        'px-2.5 py-1',
                                        view === 'all'
                                            ? 'bg-canvas-soft font-medium text-ink'
                                            : 'bg-canvas text-mute hover:text-ink',
                                    )}
                                >
                                    All open
                                </Link>
                                <Link
                                    href="/crm/tickets/board?view=my"
                                    aria-current={view === 'my' ? 'page' : undefined}
                                    className={cn(
                                        'px-2.5 py-1',
                                        view === 'my'
                                            ? 'bg-canvas-soft font-medium text-ink'
                                            : 'bg-canvas text-mute hover:text-ink',
                                    )}
                                >
                                    Assigned to me
                                </Link>
                            </div>
                            <TicketLayoutToggle current="board" />
                        </>
                    }
                />

                {tickets.length === 0 && !loading ? (
                    <div
                        className="border-b border-hairline bg-canvas px-4 py-2.5 sm:px-6"
                        data-crm="ticket-board-empty"
                    >
                        <p className="text-[13px] font-medium text-ink">No tickets yet</p>
                        <p className="mt-0.5 text-[12px] text-mute">
                            Create a ticket on a contact. Desk stays the inbox.
                        </p>
                        <Button
                            type="button"
                            size="sm"
                            className="mt-2 h-8"
                            onClick={() => {
                                window.location.href = createHref;
                            }}
                        >
                            Create ticket
                        </Button>
                    </div>
                ) : null}

                <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-canvas">
                    {loading ? (
                        <TicketBoardSkeleton />
                    ) : (
                        <PipelineKanban className="h-full min-h-[22rem] px-1 sm:px-2">
                            {columns.map((column) => {
                                const cards = tickets.filter(
                                    (ticket) => ticket.status === column.slug,
                                );

                                return (
                                    <PipelineKanbanColumn
                                        key={column.slug}
                                        testId={`ticket-column-${column.slug}`}
                                        over={overStatus === column.slug}
                                        onDragOver={(event) => {
                                            event.preventDefault();
                                            event.dataTransfer.dropEffect = 'move';
                                            setOverStatus(column.slug);
                                        }}
                                        onDragLeave={() =>
                                            setOverStatus((current) =>
                                                current === column.slug ? null : current,
                                            )
                                        }
                                        onDrop={(event) => onDrop(event, column)}
                                    >
                                        <PipelineKanbanHeader
                                            name={column.name}
                                            count={column.count}
                                            unit="ticket"
                                            accent={stageUnderlineColor(column.slug)}
                                        />

                                        <PipelineKanbanStack>
                                            {cards.map((ticket) => (
                                                <TicketCard
                                                    key={ticket.id}
                                                    ticket={ticket}
                                                    dragging={draggingId === ticket.id}
                                                    onDragStart={onDragStart}
                                                    onDragEnd={() => {
                                                        setDraggingId(null);
                                                        setOverStatus(null);
                                                    }}
                                                />
                                            ))}

                                            {cards.length === 0 ? (
                                                <PipelineKanbanEmpty label="No tickets" />
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

TicketBoard.layout = {
    breadcrumbs: [
        { title: 'Tickets', href: '/crm/tickets' },
        { title: 'Board', href: '/crm/tickets/board' },
    ],
};
