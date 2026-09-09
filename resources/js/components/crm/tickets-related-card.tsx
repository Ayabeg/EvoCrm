import {
    AssociationCard,
    RelatedRecordLink,
} from '@/components/crm/record-chrome';

export type RelatedTicket = {
    id: number;
    number: string;
    subject: string;
    status: string;
    status_label?: string;
    priority?: string | null;
    priority_label?: string | null;
    url: string;
};

export type TicketsRelated = {
    open_count: number;
    rows: RelatedTicket[];
};

export default function TicketsRelatedCard({
    tickets,
    addHref,
}: {
    tickets?: TicketsRelated | null;
    addHref?: string;
}) {
    const openCount = tickets?.open_count ?? 0;
    const rows = tickets?.rows ?? [];

    return (
        <AssociationCard title="Tickets" addHref={addHref} addLabel="Add">
            {rows.length === 0 ? (
                <p className="text-mute">No tickets</p>
            ) : (
                <>
                    <p className="aurora-text-caption text-mute">
                        {openCount} open
                    </p>
                    {rows.map((ticket) => (
                        <RelatedRecordLink
                            key={ticket.id}
                            href={ticket.url}
                            meta={ticket.priority_label ?? ticket.priority ?? undefined}
                        >
                            <span className="tabular-nums">{ticket.number}</span>
                            {' '}
                            {ticket.subject}
                        </RelatedRecordLink>
                    ))}
                </>
            )}
        </AssociationCard>
    );
}
