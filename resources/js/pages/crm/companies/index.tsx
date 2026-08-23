import { Form, Head, Link } from '@inertiajs/react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CompaniesIndex({ companies }: { companies: any[] }) {
    return (
        <>
            <Head title="Companies" />
            <div className="flex-1 space-y-6 p-6">
                <PageHeader title="Companies" description="Algeria-first accounts in the Evotechly workspace." />
                <Card className="p-4">
                    <Form action="/crm/companies" method="post" className="grid gap-3 md:grid-cols-4" resetOnSuccess>
                        {({ processing }) => (
                            <>
                                <div>
                                    <Label>Name</Label>
                                    <Input name="name" required />
                                </div>
                                <div>
                                    <Label>City</Label>
                                    <Input name="city" placeholder="Alger" />
                                </div>
                                <div>
                                    <Label>Domain</Label>
                                    <Input name="domain" />
                                </div>
                                <div className="flex items-end">
                                    <Button disabled={processing}>Add</Button>
                                </div>
                            </>
                        )}
                    </Form>
                </Card>
                <Card className="overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-2">Name</th>
                                <th className="px-4 py-2">City</th>
                                <th className="px-4 py-2">Contacts</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.map((company) => (
                                <tr key={company.id} className="border-t">
                                    <td className="px-4 py-2">
                                        <Link href={`/crm/companies/${company.id}`} className="font-medium text-brand">
                                            {company.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-2">{company.city ?? '—'}</td>
                                    <td className="px-4 py-2">{company.contacts_count ?? 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </div>
        </>
    );
}

CompaniesIndex.layout = {
    breadcrumbs: [{ title: 'Companies', href: '/crm/companies' }],
};
