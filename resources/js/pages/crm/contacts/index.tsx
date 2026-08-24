import { Form, Head } from '@inertiajs/react';
import ListToolbar from '@/components/crm/list-toolbar';
import ListViewTable from '@/components/crm/list-view-table';
import PageHeader from '@/components/page-header';
import type { ListViewMeta, SavedView } from '@/lib/list-view-config';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Contact = {
    id: number;
    first_name: string;
    last_name?: string | null;
    email?: string | null;
    phone_e164?: string | null;
    company?: { name: string } | null;
    owner?: { name: string } | null;
    city?: string | null;
    wilaya?: string | null;
    created_at?: string | null;
    last_activity_at?: string | null;
};

export default function ContactsIndex({
    contacts,
    companies,
    members = [],
    savedFilters = [],
    activeFilters = {},
    listView,
    recordCount,
    cities = [],
    wilayas = [],
}: {
    contacts: Contact[];
    companies: { id: number; name: string }[];
    members?: { id: number; name: string }[];
    savedFilters?: SavedView[];
    activeFilters?: Record<string, unknown>;
    listView?: ListViewMeta;
    recordCount?: number;
    cities?: string[];
    wilayas?: string[];
}) {
    return (
        <>
            <Head title="Contacts" />
            <div className="flex-1 space-y-6 p-6">
                <PageHeader
                    title="Contacts"
                    description="One person, one Contact. Conversation history and Deals both point here."
                />
                <ListToolbar
                    entity="contact"
                    basePath="/crm/contacts"
                    activeFilters={activeFilters}
                    savedFilters={savedFilters}
                    listView={listView}
                    recordCount={recordCount}
                    members={members}
                    cities={cities}
                    wilayas={wilayas}
                    companies={companies}
                    exportHref="/crm/contacts/export"
                />
                <Card className="p-4">
                    <Form
                        action="/crm/contacts"
                        method="post"
                        className="grid gap-3 md:grid-cols-5"
                        resetOnSuccess
                    >
                        {({ processing }) => (
                            <>
                                <div>
                                    <Label>First name</Label>
                                    <Input name="first_name" required />
                                </div>
                                <div>
                                    <Label>Last name</Label>
                                    <Input name="last_name" />
                                </div>
                                <div>
                                    <Label>Phone (+213)</Label>
                                    <Input name="phone" placeholder="0550…" />
                                </div>
                                <div>
                                    <Label>Email</Label>
                                    <Input name="email" type="email" />
                                </div>
                                <div>
                                    <Label>Company</Label>
                                    <select name="company_id" className="h-9 w-full rounded-md border bg-background px-2 text-sm">
                                        <option value="">None</option>
                                        {companies.map((company) => (
                                            <option key={company.id} value={company.id}>
                                                {company.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <Button disabled={processing}>Add</Button>
                                </div>
                            </>
                        )}
                    </Form>
                </Card>
                <Card className="overflow-hidden">
                    {listView ? (
                        <ListViewTable
                            entity="contact"
                            rows={contacts}
                            columnDefs={listView.columnDefs}
                            columns={listView.columns}
                            basePath="/crm/contacts"
                        />
                    ) : null}
                </Card>
            </div>
        </>
    );
}

ContactsIndex.layout = {
    breadcrumbs: [{ title: 'Contacts', href: '/crm/contacts' }],
};
