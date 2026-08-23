import { Form, Head, Link, usePage } from '@inertiajs/react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ContactShow({
    contact,
    companies,
    deskUrl,
}: {
    contact: any;
    companies: { id: number; name: string }[];
    deskUrl: string;
}) {
    const sharedDesk = usePage<{ deskUrl?: string }>().props.deskUrl || deskUrl;

    return (
        <>
            <Head title={contact.first_name} />
            <div className="flex-1 space-y-6 p-6">
                <PageHeader
                    title={`${contact.first_name} ${contact.last_name ?? ''}`}
                    description="Canonical person record. Conversation history and Deals attach here."
                >
                    <Button asChild variant="secondary">
                        <a href={sharedDesk}>Open Desk</a>
                    </Button>
                </PageHeader>
                <Card className="p-4">
                    <Form action={`/crm/contacts/${contact.id}`} method="put" className="grid gap-3 md:grid-cols-3">
                        {({ processing }) => (
                            <>
                                <div>
                                    <Label>First name</Label>
                                    <Input name="first_name" defaultValue={contact.first_name} required />
                                </div>
                                <div>
                                    <Label>Last name</Label>
                                    <Input name="last_name" defaultValue={contact.last_name ?? ''} />
                                </div>
                                <div>
                                    <Label>Phone</Label>
                                    <Input name="phone" defaultValue={contact.phone ?? contact.phone_e164 ?? ''} />
                                </div>
                                <div>
                                    <Label>Email</Label>
                                    <Input name="email" type="email" defaultValue={contact.email ?? ''} />
                                </div>
                                <div>
                                    <Label>Company</Label>
                                    <select
                                        name="company_id"
                                        defaultValue={contact.company_id ?? ''}
                                        className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                    >
                                        <option value="">None</option>
                                        {companies.map((company) => (
                                            <option key={company.id} value={company.id}>
                                                {company.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <Button disabled={processing}>Save contact</Button>
                                </div>
                            </>
                        )}
                    </Form>
                </Card>
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="p-4 text-sm">
                        <h2 className="mb-2 font-medium">Leads</h2>
                        {(contact.leads ?? []).map((lead: any) => (
                            <Link
                                key={lead.id}
                                href={`/crm/leads/${lead.id}`}
                                className="block text-brand"
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
                                className="block text-brand"
                            >
                                {deal.title} · {deal.stage?.name}
                            </Link>
                        ))}
                    </Card>
                    <Card className="p-4 text-sm">
                        <h2 className="mb-2 font-medium">Conversation history</h2>
                        <p className="mb-2 text-xs text-muted-foreground">Synced from EvoDesk — not the Chatwoot clone.</p>
                        {(contact.threads ?? []).length === 0 ? (
                            <p className="text-muted-foreground">No synced threads.</p>
                        ) : (
                            (contact.threads ?? []).map((thread: any) => (
                                <Link
                                    key={thread.id}
                                    href={`/conversations?thread=${thread.id}`}
                                    className="block text-brand"
                                >
                                    {thread.subject ?? 'Thread'} · {thread.status}
                                </Link>
                            ))
                        )}
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
