import {
    AssociationCard,
    RelatedRecordLink,
} from '@/components/crm/record-chrome';
import { useSimpleMode } from '@/hooks/use-simple-mode';
import { t } from '@/lib/i18n';

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
    const { features } = useSimpleMode();
    const openCount = tickets?.open_count ?? 0;
    const rows = tickets?.rows ?? [];

    if (!features.tickets) {
        return null;
    }

    return (
        <AssociationCard title={t('Tickets')} addHref={addHref} addLabel={t('Add')}>
            {rows.length === 0 ? (
                <p className="text-mute">{t('No tickets')}</p>
            ) : (
                <>
                    <p className="aurora-text-caption text-mute">
                        {t(':count open', { count: String(openCount) })}
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
