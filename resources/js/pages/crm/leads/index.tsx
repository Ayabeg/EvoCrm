import { Form, Head, Link } from '@inertiajs/react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LeadsIndex({ leads, contacts }: { leads: any[]; contacts: any[] }) {
    return (
        <>
            <Head title="Leads" />
            <div className="flex-1 space-y-6 p-6">
                <PageHeader title="Leads" description="Qualify inbound interest before it becomes a Deal." />
                <Card className="p-4">
                    <Form action="/crm/leads" method="post" className="grid gap-3 md:grid-cols-4" resetOnSuccess>
                        {({ processing }) => (
                            <>
                                <div>
                                    <Label>Title</Label>
                                    <Input name="title" required />
                                </div>
                                <div>
                                    <Label>Contact</Label>
                                    <select name="contact_id" className="h-9 w-full rounded-md border bg-background px-2 text-sm" required>
                                        <option value="">Select</option>
                                        {contacts.map((contact) => (
                                            <option key={contact.id} value={contact.id}>
                                                {contact.first_name} {contact.last_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label>Source</Label>
                                    <Input name="source" placeholder="manual" />
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
                                <th className="px-4 py-2">Title</th>
                                <th className="px-4 py-2">Contact</th>
                                <th className="px-4 py-2">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.map((lead) => (
                                <tr key={lead.id} className="border-t">
                                    <td className="px-4 py-2">
                                        <Link href={`/crm/leads/${lead.id}`} className="font-medium text-brand">
                                            {lead.title}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-2">
                                        {lead.contact?.first_name} {lead.contact?.last_name}
                                    </td>
                                    <td className="px-4 py-2">{lead.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </div>
        </>
    );
}

LeadsIndex.layout = {
    breadcrumbs: [{ title: 'Leads', href: '/crm/leads' }],
};
