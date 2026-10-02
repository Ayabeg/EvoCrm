import { Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { CrmObjectHeader } from '@/components/crm/crm-object-header';
import { CrmShell } from '@/components/crm/crm-shell';
import TicketLayoutToggle from '@/components/crm/ticket-layout-toggle';
import { Pipeline } from '@/evo/crm/pipeline/Pipeline';
import { TicketCard } from '@/evo/crm/pipeline/TicketCard';
import type { PipelineColumnData } from '@/evo/crm/pipeline/types';
import { Button } from '@/evo/ui/button';
import { useInertiaLoading } from '@/hooks/use-inertia-loading';
import { t } from '@/lib/i18n';
import { stageUnderlineColor } from '@/lib/stage-colors';
import { cn } from '@/lib/utils';

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

function BoardTicketCard({ ticket }: { ticket: BoardTicket }) {
    const association =
        ticket.company_name || ticket.contact_name || t('No company');
    const inactiveLabel =
        ticket.inactive_days && ticket.inactive_days >= 1
            ? ticket.inactive_days === 1
                ? t('Inactive for :count day', { count: ticket.inactive_days })
                : t('Inactive for :count days', { count: ticket.inactive_days })
            : null;
    const showSla =
        ticket.status !== 'closed' &&
        Boolean(ticket.sla_label) &&
        ticket.sla_label !== '—';

    return (
        <TicketCard
            ticket={{
                id: ticket.id,
                subject: ticket.subject,
                number: ticket.number,
                association,
                owner: ticket.owner_name,
                href: ticket.url,
                priority: ticket.priority ?? null,
                sla: showSla ? ticket.sla_label : null,
                sla_label: showSla ? ticket.sla_label : null,
                slaBreached: ticket.sla_breached,
                inactive: inactiveLabel,
            }}
            onOpen={() => router.visit(ticket.url)}
        />
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
    const loading = useInertiaLoading();
    const createHref = '/crm/tickets?create=1';
    const ticketById = new Map(
        tickets.map((ticket) => [String(ticket.id), ticket]),
    );
    const pipelineColumns: PipelineColumnData[] = columns.map((column) => ({
        id: column.slug,
        name: column.name,
        slug: column.slug,
        count: column.count,
        accent: stageUnderlineColor(column.slug),
    }));
    const itemsByColumn = columns.reduce<Record<string, string[]>>(
        (acc, column) => {
            acc[column.slug] = tickets
                .filter((ticket) => ticket.status === column.slug)
                .map((ticket) => `ticket:${ticket.id}`);

            return acc;
        },
        {},
    );

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
                                    aria-current={
                                        view === 'all' ? 'page' : undefined
                                    }
                                    className={cn(
                                        'px-2.5 py-1',
                                        view === 'all'
                                            ? 'bg-canvas-soft font-medium text-ink'
                                            : 'bg-canvas text-mute hover:text-ink',
                                    )}
                                >
                                    {t('All open')}
                                </Link>
                                <Link
                                    href="/crm/tickets/board?view=my"
                                    aria-current={
                                        view === 'my' ? 'page' : undefined
                                    }
                                    className={cn(
                                        'px-2.5 py-1',
                                        view === 'my'
                                            ? 'bg-canvas-soft font-medium text-ink'
                                            : 'bg-canvas text-mute hover:text-ink',
                                    )}
                                >
                                    {t('Assigned to me')}
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
                        <p className="text-[13px] font-medium text-ink">
                            No tickets yet
                        </p>
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
                    {/* PipelineKanban — evo Pipeline board. Keep identifier for P2/P7. */}
                    <Pipeline
                        columns={pipelineColumns}
                        itemsByColumn={itemsByColumn}
                        columnTestIdPrefix="ticket-column"
                        loading={loading}
                        renderCard={(itemId) => {
                            const ticket = ticketById.get(
                                itemId.replace(/^ticket:/, ''),
                            );

                            return ticket ? (
                                <BoardTicketCard ticket={ticket} />
                            ) : null;
                        }}
                        renderOverlay={(itemId) =>
                            ticketById.get(itemId.replace(/^ticket:/, ''))
                                ?.subject
                        }
                        onMove={({ itemId, toColumnId }) => {
                            const ticketId = Number(
                                itemId.replace(/^ticket:/, ''),
                            );
                            const ticket = ticketById.get(String(ticketId));

                            if (
                                !ticket ||
                                ticket.status === toColumnId ||
                                Number.isNaN(ticketId)
                            ) {
                                return;
                            }

                            router.post(
                                `/crm/tickets/${ticketId}/move`,
                                { status: toColumnId },
                                {
                                    preserveScroll: true,
                                    onError: () => {
                                        toast.error(
                                            t(
                                                'Could not move this ticket. Try again.',
                                            ),
                                        );
                                    },
                                },
                            );
                        }}
                    />
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
