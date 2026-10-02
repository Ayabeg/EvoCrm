import { Link } from '@inertiajs/react';
import type { DataWorkspaceEmpty } from '@/ds/workspace/types';
import { t } from '@/lib/i18n';
import type { ListColumnDef } from '@/lib/list-view-config';

export const TICKET_COLUMN_IDS = [
    'number',
    'subject',
    'status',
    'priority',
    'channel',
    'contact',
    'company',
    'owner',
    'created_at',
    'sla_due_at',
] as const;

export type TicketListRow = {
    id: number;
    number: string;
    subject: string;
    status: string;
    status_label?: string;
    priority?: string | null;
    channel?: string | null;
    channel_label?: string | null;
    created_at?: string | null;
    sla_due_at?: string | null;
    sla_label?: string | null;
    sla_breached?: boolean;
    contact?: { first_name: string; last_name?: string | null } | null;
    company?: { name: string } | null;
    owner?: { id?: number; name: string } | null;
};

export function ticketRowHref(row: { id: number | string }): string {
    return `/crm/tickets/${row.id}`;
}

export function ticketEmptyState(filtered: boolean): DataWorkspaceEmpty {
    if (filtered) {
        return {
            title: t('No tickets match these filters'),
            body: t('Clear filters or pick another status to see records.'),
        };
    }

    return {
        title: t('No tickets yet'),
        body: t('Create a ticket on a contact. Desk stays the inbox.'),
        actionLabel: t('Create ticket'),
    };
}

export function applyTicketColumnContract(columnDefs: ListColumnDef[]): ListColumnDef[] {
    return columnDefs.map((column) =>
        column.id === 'subject' ? { ...column, label: 'Ticket' } : column,
    );
}

export function TicketIdentityCell({
    row,
    href,
}: {
    row: TicketListRow;
    href: string;
}) {
    return (
        <Link href={href} className="font-medium text-ink hover:underline">
            {row.subject}
        </Link>
    );
}
