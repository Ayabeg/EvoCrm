import { Form, Head, Link } from '@inertiajs/react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CompanyShow({ company }: { company: any }) {
    return (
        <>
            <Head title={company.name} />
            <div className="flex-1 space-y-6 p-6">
                <PageHeader title={company.name} description={`${company.city ?? ''} · ${company.country}`} />
                <Card className="p-4">
                    <Form action={`/crm/companies/${company.id}`} method="put" className="grid gap-3 md:grid-cols-3">
                        {({ processing }) => (
                            <>
                                <div>
                                    <Label>Name</Label>
                                    <Input name="name" defaultValue={company.name} required />
                                </div>
                                <div>
                                    <Label>City</Label>
                                    <Input name="city" defaultValue={company.city ?? ''} />
                                </div>
                                <div>
                                    <Label>Domain</Label>
                                    <Input name="domain" defaultValue={company.domain ?? ''} />
                                </div>
                                <div>
                                    <Label>Phone</Label>
                                    <Input name="phone" defaultValue={company.phone ?? ''} />
                                </div>
                                <div className="flex items-end">
                                    <Button disabled={processing}>Save company</Button>
                                </div>
                            </>
                        )}
                    </Form>
                </Card>
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
