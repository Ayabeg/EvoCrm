import { Link } from '@inertiajs/react';

type Named = { id: number; name?: string | null; first_name?: string | null; last_name?: string | null; title?: string | null; stage?: { name?: string } | null };

export default function AssociationsCard({
    associations,
}: {
    associations?: {
        contact?: Named | null;
        company?: Named | null;
        deals?: Named[];
        contacts?: Named[];
        leads?: Named[];
    } | null;
}) {
    if (!associations) {
        return null;
    }

    const nameOf = (row: Named) =>
        row.name ?? row.title ?? `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim() ?? 'Record';

    return (
        <section className="rounded border border-hairline bg-canvas p-3 text-sm">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-mute">Associations</h3>
            {associations.contact ? (
                <p>
                    Contact:{' '}
                    <Link href={`/crm/contacts/${associations.contact.id}`} className="text-brand">
                        {nameOf(associations.contact)}
                    </Link>
                </p>
            ) : null}
            {associations.company ? (
                <p>
                    Company:{' '}
                    <Link href={`/crm/companies/${associations.company.id}`} className="text-brand">
                        {nameOf(associations.company)}
                    </Link>
                </p>
            ) : (
                <p className="text-mute">Company: —</p>
            )}
            {(associations.contacts ?? []).length > 0 ? (
                <div className="mt-2">
                    <p className="text-[11px] text-mute">Contacts</p>
                    {(associations.contacts ?? []).map((contact) => (
                        <Link key={contact.id} href={`/crm/contacts/${contact.id}`} className="block text-brand">
                            {nameOf(contact)}
                        </Link>
                    ))}
                </div>
            ) : null}
            {(associations.deals ?? []).length > 0 ? (
                <div className="mt-2">
                    <p className="text-[11px] text-mute">Deals</p>
                    {(associations.deals ?? []).map((deal) => (
                        <Link key={deal.id} href={`/crm/deals/${deal.id}`} className="block text-brand">
                            {nameOf(deal)}
                            {deal.stage?.name ? ` · ${deal.stage.name}` : ''}
                        </Link>
                    ))}
                </div>
            ) : null}
            {(associations.leads ?? []).length > 0 ? (
                <div className="mt-2">
                    <p className="text-[11px] text-mute">Leads</p>
                    {(associations.leads ?? []).map((lead) => (
                        <Link key={lead.id} href={`/crm/leads/${lead.id}`} className="block text-brand">
                            {nameOf(lead)}
                        </Link>
                    ))}
                </div>
            ) : null}
        </section>
    );
}
