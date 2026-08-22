import { Head, Link } from '@inertiajs/react';
import PageHeader from '@/components/page-header';
import { Card } from '@/components/ui/card';

export default function CompanyShow({ company }: { company: any }) {
    return (
        <>
            <Head title={company.name} />
            <div className="flex-1 space-y-6 p-6">
                <PageHeader title={company.name} description={`${company.city ?? ''} · ${company.country}`} />
                <div className="grid gap-4 md:grid-cols-2">
                    <Card className="p-4 text-sm">
                        <h2 className="mb-2 font-medium">Contacts</h2>
                        {(company.contacts ?? []).map((contact: any) => (
                            <Link key={contact.id} href={`/crm/contacts/${contact.id}`} className="block text-teal-700 dark:text-teal-300">
                                {contact.first_name} {contact.last_name}
                            </Link>
                        ))}
                    </Card>
                    <Card className="p-4 text-sm">
                        <h2 className="mb-2 font-medium">Deals</h2>
                        {(company.deals ?? []).map((deal: any) => (
                            <Link key={deal.id} href={`/crm/deals/${deal.id}`} className="block text-teal-700 dark:text-teal-300">
                                {deal.title} · {deal.stage?.name}
                            </Link>
                        ))}
                    </Card>
                </div>
            </div>
        </>
    );
}

CompanyShow.layout = {
    breadcrumbs: [
        { title: 'Companies', href: '/crm/companies' },
        { title: 'Company', href: '#' },
    ],
};
