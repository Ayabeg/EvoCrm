import { Form, Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { CrmListShell } from '@/components/crm/crm-list-shell';
import { CrmEmptyState, CrmListFooter } from '@/components/crm/list-chrome';
import { CreateDrawer } from '@/components/crm/create-drawer';
import ListViewTable from '@/components/crm/list-view-table';
import type { ListViewMeta, SavedView } from '@/lib/list-view-config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Contact = {
    id: number;
    first_name: string;
    last_name?: string | null;
    email?: string | null;
    phone_e164?: string | null;
    city?: string | null;
    wilaya?: string | null;
    lead_status?: string | null;
    created_at?: string | null;
    last_activity_at?: string | null;
    company?: { name: string } | null;
    owner?: { name: string } | null;
};

export default function ContactsIndex({
    contacts,
    companies,
    members,
    savedFilters,
    activeFilters,
    listView,
    recordCount,
    cities,
    wilayas,
    hasMailbox,
    createOpen,
}: {
    contacts: Contact[];
    companies: { id: number; name: string }[];
    members: { id: number; name: string }[];
    savedFilters: SavedView[];
    activeFilters: Record<string, unknown>;
    listView: ListViewMeta;
    recordCount: number;
    cities: string[];
    wilayas: string[];
    hasMailbox: boolean;
    createOpen?: boolean;
}) {
    const [drawer, setDrawer] = useState(Boolean(createOpen));

    return (
        <>
            <Head title="Contacts" />
            <CrmListShell
                title="Contacts"
                entity="contact"
                basePath="/crm/contacts"
                primaryLabel="Add contacts"
                activeFilters={activeFilters}
                savedFilters={savedFilters}
                listView={listView}
                recordCount={recordCount}
                members={members}
                cities={cities}
                wilayas={wilayas}
                companies={companies}
                exportHref="/crm/contacts/export"
                banner={
                    !hasMailbox ? (
                        <div className="border-b border-hairline bg-canvas-soft px-6 py-2">
                            Connect email to log outbound from this list.{' '}
                            <Link href="/outbound/mailboxes" className="font-medium text-brand">
                                Connect email
                            </Link>
                        </div>
                    ) : null
                }
            >
                {(columns) => (
                    <>
                        {contacts.length === 0 ? (
                            <CrmEmptyState
                                line="No contacts in this view."
                                actionLabel="Add contacts"
                                onAction={() => setDrawer(true)}
                            />
                        ) : (
                            <div className="min-h-0 flex-1 overflow-auto">
                                <ListViewTable
                                    entity="contact"
                                    rows={contacts}
                                    columnDefs={listView.columnDefs}
                                    columns={columns}
                                    basePath="/crm/contacts"
                                />
                            </div>
                        )}
                        <CrmListFooter count={contacts.length} noun="contacts" exportHref="/crm/contacts/export" />
                    </>
                )}
            </CrmListShell>

            <CreateDrawer
                open={drawer}
                onOpenChange={setDrawer}
                title="Create contact"
            >
                <Form
                    action="/crm/contacts"
                    method="post"
                    className="space-y-3"
                    resetOnSuccess
                    onSuccess={() => setDrawer(false)}
                >
                    {({ processing }) => (
                        <>
                            <div>
                                <Label className="mb-1 block text-[12px]">
                                    First name <span className="text-brand">*</span>
                                </Label>
                                <Input name="first_name" required />
                            </div>
                            <div>
                                <Label className="mb-1 block text-[12px]">Last name</Label>
                                <Input name="last_name" />
                            </div>
                            <div>
                                <Label className="mb-1 block text-[12px]">Email</Label>
                                <Input name="email" type="email" />
                            </div>
                            <div>
                                <Label className="mb-1 block text-[12px]">Phone</Label>
                                <Input name="phone" placeholder="0550…" />
                            </div>
                            <div>
                                <Label className="mb-1 block text-[12px]">Company</Label>
                                <select
                                    name="company_id"
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
                            <div>
                                <Label className="mb-1 block text-[12px]">Lead status</Label>
                                <select
                                    name="lead_status"
                                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                >
                                    <option value="">None</option>
                                    <option value="new">New</option>
                                    <option value="open">Open</option>
                                    <option value="unqualified">Unqualified</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="ghost" onClick={() => setDrawer(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    name="add_another"
                                    value="1"
                                    variant="outline"
                                    disabled={processing}
                                >
                                    Create and add another
                                </Button>
                                <Button disabled={processing}>Create</Button>
                            </div>
                        </>
                    )}
                </Form>
            </CreateDrawer>
        </>
    );
}

ContactsIndex.layout = {
    breadcrumbs: [{ title: 'Contacts', href: '/crm/contacts' }],
};
