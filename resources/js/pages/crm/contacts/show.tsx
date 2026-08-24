import { Form, Head, Link } from '@inertiajs/react';
import AskEvoPanel from '@/components/crm/ask-evo-panel';
import AssociationsCard from '@/components/crm/associations-card';
import CatchUpBlock from '@/components/crm/catch-up-block';
import RecordActionRow from '@/components/crm/record-action-row';
import { RecordFact, RecordFacts } from '@/components/crm/record-workspace';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ContactShow({
    contact,
    companies,
    associations,
    catchUp,
    askEvo,
}: {
    contact: any;
    companies: { id: number; name: string }[];
    associations?: any;
    catchUp?: { inbound?: any[]; outbound?: any[] };
    askEvo?: any;
}) {
    return (
        <>
            <Head title={contact.first_name} />
            <div className="flex-1 space-y-6 p-6">
                <PageHeader
                    title={`${contact.first_name} ${contact.last_name ?? ''}`}
                    description="Canonical person record. Conversation history and Deals attach here."
                >
                    <Button asChild variant="secondary">
                        <Link href="/inbox">Open inbox</Link>
                    </Button>
                </PageHeader>
                <RecordFacts>
                    <RecordFact label="Phone">{contact.phone_e164 ?? contact.phone ?? '—'}</RecordFact>
                    <RecordFact label="Email">{contact.email ?? '—'}</RecordFact>
                    <RecordFact label="Owner">{contact.owner?.name ?? 'Unassigned'}</RecordFact>
                    <RecordFact label="City">{contact.city ?? contact.company?.city ?? '—'}</RecordFact>
                    <RecordFact label="Wilaya">{contact.wilaya ?? contact.company?.wilaya ?? '—'}</RecordFact>
                    <RecordFact label="Inbox">{contact.unanswered ? 'Unanswered' : 'Caught up'}</RecordFact>
                </RecordFacts>
                <RecordActionRow
                    contactId={contact.id}
                    companyId={contact.company_id}
                    ownerId={contact.owner_id}
                />
                <AskEvoPanel action={`/crm/contacts/${contact.id}/ask`} insight={askEvo} />
                <CatchUpBlock inbound={catchUp?.inbound} outbound={catchUp?.outbound} />
                <AssociationsCard associations={associations ?? { company: contact.company, deals: contact.deals, leads: contact.leads, threads: contact.threads }} />
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
