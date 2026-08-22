import { Head, Link } from '@inertiajs/react';
import PageHeader from '@/components/page-header';
import { Card } from '@/components/ui/card';

export default function ContactShow({ contact }: { contact: any }) {
    return (
        <>
            <Head title={contact.first_name} />
            <div className="flex-1 space-y-6 p-6">
                <PageHeader
                    title={`${contact.first_name} ${contact.last_name ?? ''}`}
                    description="Canonical person record. Desk + Deal attach here."
                />
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="space-y-2 p-4 text-sm">
                        <p>Phone: {contact.phone_e164 ?? '—'}</p>
                        <p>Email: {contact.email ?? '—'}</p>
                        <p>Company: {contact.company?.name ?? '—'}</p>
                        <p>Source: {contact.source ?? '—'}</p>
                    </Card>
                    <Card className="p-4 text-sm">
                        <h2 className="mb-2 font-medium">Leads</h2>
                        {(contact.leads ?? []).map((lead: any) => (
                            <Link
                                key={lead.id}
                                href={`/crm/leads/${lead.id}`}
                                className="block text-teal-700 dark:text-teal-300"
                            >
                                {lead.title} · {lead.status}
                            </Link>
                        ))}
                    </Card>
                    <Card className="p-4 text-sm">
                        <h2 className="mb-2 font-medium">Deals</h2>
                        {(contact.deals ?? []).map((deal: any) => (
                            <Link
                                key={deal.id}
                                href={`/crm/deals/${deal.id}`}
                                className="block text-teal-700 dark:text-teal-300"
                            >
                                {deal.title} · {deal.stage?.name}
                            </Link>
                        ))}
                    </Card>
                </div>
            </div>
        </>
    );
}

ContactShow.layout = {
    breadcrumbs: [
        { title: 'Contacts', href: '/crm/contacts' },
        { title: 'Contact', href: '#' },
    ],
};
