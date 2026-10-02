/**
 * CRM list cell renderers for the ONE DataGrid.
 * Extracted from ListViewTable so identity / money / date contracts stay put.
 */
import { Link } from '@inertiajs/react';

import LeadScorePill from '@/components/crm/lead-score-pill';
import { LtrValue, shouldIsolateColumn } from '@/components/ltr-value';
import { formatDate, formatDateTime, formatMoneyFromCents, formatPhone } from '@/evo/lib/format';
import { formatContactName } from '@/lib/contact-name';
import { t } from '@/lib/i18n';
import type { ListObjectType } from '@/lib/list-view-config';
import {
    CompanyIdentityCell as CompanyNameCell,
} from '@/pages/crm/companies/company-columns';
import {
    ContactIdentityCell as ContactNameCell,
} from '@/pages/crm/contacts/contact-columns';
import {
    DealAmountCell,
    DealAttentionCell,
    DealIdentityCell as DealNameCell,
    DealStageCell,
} from '@/pages/crm/deals/deal-columns';
import type { DealListRow } from '@/pages/crm/deals/deal-columns';
import {
    LeadIdentityCell as LeadNameCell,
    leadContactName,
    leadScorePayload,
} from '@/pages/crm/leads/lead-columns';
import type { LeadListRow } from '@/pages/crm/leads/lead-columns';
import {
    QuoteAmountCell,
    QuoteIdentityCell as QuoteNameCell,
    QuoteStatusCell,
} from '@/pages/crm/quotes/quote-columns';
import type { QuoteListRow } from '@/pages/crm/quotes/quote-columns';

export type AttributeMap = Record<string, string | null>;

export type ContactRow = {
    id: number;
    first_name: string;
    last_name?: string | null;
    email?: string | null;
    phone_e164?: string | null;
    lead_status?: string | null;
    city?: string | null;
    wilaya?: string | null;
    created_at?: string | null;
    last_activity_at?: string | null;
    company?: { name: string } | null;
    owner?: { name: string } | null;
    attributes?: AttributeMap;
};

export type DealRow = DealListRow & { attributes?: AttributeMap };

export type CompanyRow = {
    id: number;
    name: string;
    city?: string | null;
    wilaya?: string | null;
    created_at?: string | null;
    owner?: { name: string } | null;
    attributes?: AttributeMap;
};

export type TicketRow = {
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
    owner?: { name: string } | null;
};

export type QuoteRow = QuoteListRow;
export type { LeadListRow };

export type ListRow = ContactRow | DealRow | CompanyRow | TicketRow | QuoteRow | LeadListRow;

function parseListDate(value?: string | null): Date | null {
    if (!value) {
        return null;
    }

    const parsed = new Date(
        value.includes('T') || value.includes(' ') ? value.replace(' ', 'T') : `${value}T00:00:00`,
    );

    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatListDate(value?: string | null, withTime = false): string {
    const parsed = parseListDate(value);

    if (!parsed) {
        return value || '—';
    }

    return withTime ? formatDateTime(parsed) : formatDate(parsed);
}

function titleCase(value?: string | null): string {
    if (!value) {
        return '—';
    }

    return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function customAttributeValue(attributes: AttributeMap | undefined, columnId: string): string {
    if (!columnId.startsWith('custom:')) {
        return '—';
    }

    const value = attributes?.[columnId.slice(7)];

    return value == null || value === '' ? '—' : value;
}

export function primaryColumnId(entity: ListObjectType): string {
    if (entity === 'deal' || entity === 'quote' || entity === 'lead') {
        return 'title';
    }

    if (entity === 'ticket') {
        return 'subject';
    }

    return 'name';
}

export function contactCommunicationHref(columnId: string, row: ContactRow): string | null {
    if (columnId === 'email' && row.email) {
        return `mailto:${row.email}`;
    }

    if (columnId === 'phone' && row.phone_e164) {
        return `tel:${row.phone_e164}`;
    }

    return null;
}

export function renderListCell(entity: ListObjectType, columnId: string, row: ListRow): string {
    if (entity === 'contact') {
        const contact = row as ContactRow;

        switch (columnId) {
            case 'name':
                return formatContactName(contact.first_name, contact.last_name);
            case 'email':
                return contact.email ?? '—';
            case 'phone':
                return contact.phone_e164 ? formatPhone(contact.phone_e164) : '—';
            case 'lead_status':
                return titleCase(contact.lead_status);
            case 'company':
                return contact.company?.name ?? '—';
            case 'owner':
                return contact.owner?.name ?? '—';
            case 'city':
                return contact.city ?? '—';
            case 'wilaya':
                return contact.wilaya ?? '—';
            case 'created_at':
                return formatListDate(contact.created_at);
            case 'last_activity_at':
                return formatListDate(contact.last_activity_at);
            default:
                return customAttributeValue(contact.attributes, columnId);
        }
    }

    if (entity === 'deal') {
        const deal = row as DealRow;

        switch (columnId) {
            case 'title':
                return deal.title;
            case 'amount':
                return formatMoneyFromCents(deal.amount_cents ?? 0);
            case 'stage':
                return deal.stage?.name ?? '—';
            case 'company':
                return deal.company?.name ?? '—';
            case 'contact':
                return deal.contact
                    ? formatContactName(deal.contact.first_name, deal.contact.last_name)
                    : '—';
            case 'owner':
                return deal.owner?.name ?? '—';
            case 'close_date':
                return formatListDate(deal.close_date, true);
            case 'created_at':
                return formatListDate(deal.created_at);
            case 'last_activity_at':
                return formatListDate(deal.last_activity_at);
            case 'health':
                return deal.health ? `${deal.health.score} ${deal.health.label ?? ''}`.trim() : '—';
            case 'next_step':
                return deal.next_step ?? '—';
            case 'attention':
                return deal.attention?.primary?.label ?? '—';
            default:
                return customAttributeValue(deal.attributes, columnId);
        }
    }

    if (entity === 'ticket') {
        const ticket = row as TicketRow;

        switch (columnId) {
            case 'number':
                return ticket.number;
            case 'subject':
                return ticket.subject;
            case 'status':
                return ticket.status_label ?? titleCase(ticket.status);
            case 'priority':
                return titleCase(ticket.priority);
            case 'channel':
                return ticket.channel_label ?? titleCase(ticket.channel);
            case 'contact':
                return ticket.contact
                    ? `${ticket.contact.first_name} ${ticket.contact.last_name ?? ''}`.trim()
                    : '—';
            case 'company':
                return ticket.company?.name ?? '—';
            case 'owner':
                return ticket.owner?.name ?? t('Unassigned');
            case 'created_at':
                return formatListDate(ticket.created_at);
            case 'sla_due_at':
                return ticket.sla_label ?? formatListDate(ticket.sla_due_at, true);
            default:
                return '—';
        }
    }

    if (entity === 'quote') {
        const quote = row as QuoteRow;

        switch (columnId) {
            case 'title':
                return quote.title || `Quote #${quote.id}`;
            case 'amount':
                return formatMoneyFromCents(quote.total_cents ?? 0);
            case 'status':
                return quote.status_label ?? titleCase(quote.status);
            case 'owner':
                return quote.owner?.name ?? '—';
            case 'created_at':
                return formatListDate(quote.created_at);
            case 'expires_at':
                return quote.expires_at ? formatListDate(quote.expires_at) : t('No expiration');
            case 'sent_at':
                return formatListDate(quote.sent_at);
            default:
                return '—';
        }
    }

    if (entity === 'lead') {
        const lead = row as LeadListRow;

        switch (columnId) {
            case 'title':
                return lead.title.trim() || '—';
            case 'contact':
                return leadContactName(lead) ?? '—';
            case 'status':
                return titleCase(lead.status);
            case 'score': {
                const score = leadScorePayload(lead);

                return score ? String(score.score) : '—';
            }
            default:
                return '—';
        }
    }

    const company = row as CompanyRow;

    switch (columnId) {
        case 'name':
            return company.name;
        case 'city':
            return company.city ?? '—';
        case 'wilaya':
            return company.wilaya ?? '—';
        case 'owner':
            return company.owner?.name ?? '—';
        case 'created_at':
            return formatListDate(company.created_at);
        default:
            return customAttributeValue(company.attributes, columnId);
    }
}

export function renderContactCell(columnId: string, row: ContactRow): string {
    return renderListCell('contact', columnId, row);
}

export function renderDealCell(columnId: string, row: DealRow): string {
    return renderListCell('deal', columnId, row);
}

export function renderTicketCell(columnId: string, row: TicketRow): string {
    return renderListCell('ticket', columnId, row);
}

export function renderQuoteCell(columnId: string, row: QuoteRow): string {
    return renderListCell('quote', columnId, row);
}

export function renderLeadCell(columnId: string, row: LeadListRow): string {
    return renderListCell('lead', columnId, row);
}

export function renderCompanyCell(columnId: string, row: CompanyRow): string {
    return renderListCell('company', columnId, row);
}

export function ListCell({
    entity,
    columnId,
    row,
    href,
    label,
}: {
    entity: ListObjectType;
    columnId: string;
    row: ListRow;
    href: string;
    label: string;
}) {
    if (entity === 'contact' && columnId === 'name') {
        return <ContactNameCell row={row as ContactRow} href={href} />;
    }

    if (entity === 'company' && columnId === 'name') {
        return <CompanyNameCell row={row as CompanyRow} href={href} />;
    }

    if (entity === 'deal' && columnId === 'title') {
        return <DealNameCell row={row as DealRow} href={href} />;
    }

    if (entity === 'deal' && columnId === 'stage') {
        return <DealStageCell stage={(row as DealRow).stage} />;
    }

    if (entity === 'deal' && columnId === 'amount') {
        return <DealAmountCell cents={(row as DealRow).amount_cents} />;
    }

    if (entity === 'deal' && columnId === 'attention') {
        return <DealAttentionCell attention={(row as DealRow).attention} />;
    }

    if (entity === 'lead' && columnId === 'title') {
        return <LeadNameCell row={row as LeadListRow} href={href} />;
    }

    if (entity === 'lead' && columnId === 'score') {
        return <LeadScorePill compact score={leadScorePayload(row as LeadListRow)} />;
    }

    if (entity === 'quote' && columnId === 'title') {
        return <QuoteNameCell row={row as QuoteRow} href={href} />;
    }

    if (entity === 'quote' && columnId === 'status') {
        return <QuoteStatusCell status={(row as QuoteRow).status} statusLabel={(row as QuoteRow).status_label} />;
    }

    if (entity === 'quote' && columnId === 'amount') {
        return <QuoteAmountCell cents={(row as QuoteRow).total_cents} />;
    }

    const communicationHref = entity === 'contact' ? contactCommunicationHref(columnId, row as ContactRow) : null;

    const display = shouldIsolateColumn(columnId) ? <LtrValue>{label}</LtrValue> : label;

    if (communicationHref) {
        return (
            <a href={communicationHref} className="hover:underline">
                {display}
            </a>
        );
    }

    if (columnId === primaryColumnId(entity)) {
        return (
            <Link href={href} className="font-medium text-ink hover:underline">
                {display}
            </Link>
        );
    }

    return (
        <span className="block truncate" dir="auto" title={label !== '—' ? label : undefined}>
            {display}
        </span>
    );
}
