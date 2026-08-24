import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { formatDzd } from '@/components/crm/hub-chrome';

type Named = {
    id: number;
    name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    title?: string | null;
    status?: string | null;
    subject?: string | null;
    stage?: { name?: string } | null;
    sequence?: { name?: string | null } | null;
    total_cents?: number | null;
};

function nameOf(row: Named): string {
    const person = `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim();

    return row.name ?? row.title ?? row.subject ?? (person || 'Record');
}

function AssociationGroup({
    label,
    empty,
    children,
}: {
    label: string;
    empty?: boolean;
    children: ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-mute">{label}</p>
            {empty ? <p className="text-[13px] text-mute">None yet.</p> : children}
        </div>
    );
}

export default function AssociationsCard({
    associations,
}: {
    associations?: {
        contact?: Named | null;
        company?: Named | null;
        lead?: Named | null;
        deals?: Named[];
        contacts?: Named[];
        leads?: Named[];
        threads?: Named[];
        enrollments?: Named[];
        quotes?: Named[];
    } | null;
}) {
    const bag = associations ?? {};
    const deals = bag.deals ?? [];
    const contacts = bag.contacts ?? [];
    const leads = bag.leads ?? [];
    const threads = bag.threads ?? [];
    const enrollments = bag.enrollments ?? [];
    const quotes = bag.quotes ?? [];

    return (
        <section data-evo-associations="" className="space-y-4 text-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-mute">Associations</h3>
            {bag.contact ? (
                <AssociationGroup label="Contact" empty={false}>
                    <Link href={`/crm/contacts/${bag.contact.id}`} className="block text-brand">
                        {nameOf(bag.contact)}
                    </Link>
                </AssociationGroup>
            ) : null}
            <AssociationGroup label="Company" empty={!bag.company}>
                {bag.company ? (
                    <Link href={`/crm/companies/${bag.company.id}`} className="block text-brand">
                        {nameOf(bag.company)}
                    </Link>
                ) : null}
            </AssociationGroup>
            {bag.lead ? (
                <AssociationGroup label="Lead" empty={false}>
                    <Link href={`/crm/leads/${bag.lead.id}`} className="block text-brand">
                        {nameOf(bag.lead)}
                    </Link>
                </AssociationGroup>
            ) : null}
            {Array.isArray(bag.contacts) ? (
                <AssociationGroup label="Contacts" empty={contacts.length === 0}>
                    {contacts.map((contact) => (
                        <Link key={contact.id} href={`/crm/contacts/${contact.id}`} className="block text-brand">
                            {nameOf(contact)}
                        </Link>
                    ))}
                </AssociationGroup>
            ) : null}
            {Array.isArray(bag.deals) ? (
                <AssociationGroup label="Deals" empty={deals.length === 0}>
                    {deals.map((deal) => (
                        <Link key={deal.id} href={`/crm/deals/${deal.id}`} className="block text-brand">
                            {nameOf(deal)}
                            {deal.stage?.name ? ` · ${deal.stage.name}` : ''}
                        </Link>
                    ))}
                </AssociationGroup>
            ) : null}
            {Array.isArray(bag.leads) ? (
                <AssociationGroup label="Leads" empty={leads.length === 0}>
                    {leads.map((lead) => (
                        <Link key={lead.id} href={`/crm/leads/${lead.id}`} className="block text-brand">
                            {nameOf(lead)}
                        </Link>
                    ))}
                </AssociationGroup>
            ) : null}
            <AssociationGroup label="Desk history" empty={threads.length === 0}>
                {threads.map((thread) => (
                    <Link key={thread.id} href={`/conversations?thread=${thread.id}`} className="block text-brand">
                        {nameOf(thread)}
                        {thread.status ? ` · ${thread.status}` : ''}
                    </Link>
                ))}
            </AssociationGroup>
            <AssociationGroup label="Enrollments" empty={enrollments.length === 0}>
                {enrollments.map((enrollment) => (
                    <p key={enrollment.id} className="text-ink">
                        {enrollment.sequence?.name ?? 'Sequence'}
                        {enrollment.status ? ` · ${enrollment.status}` : ''}
                    </p>
                ))}
            </AssociationGroup>
            <AssociationGroup label="Quotes" empty={quotes.length === 0}>
                {quotes.map((quote) => (
                    <p key={quote.id} className="text-ink">
                        {quote.status ?? 'draft'}
                        {quote.total_cents != null ? (
                            <>
                                {' · '}
                                <span className="money">{formatDzd(quote.total_cents)}</span>
                            </>
                        ) : null}
                    </p>
                ))}
            </AssociationGroup>
        </section>
    );
}
