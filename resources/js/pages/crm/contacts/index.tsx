import { Form, Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { CreateDrawer } from '@/components/crm/create-drawer';
import {
    ColumnFilter,
    CrmEmptyState,
    CrmListFooter,
    CrmListHeader,
    CrmListToolbar,
} from '@/components/crm/list-chrome';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Contact = {
    id: number;
    first_name: string;
    last_name?: string | null;
    email?: string | null;
    phone_e164?: string | null;
    lead_status?: string | null;
    created_at?: string;
    company?: { name: string } | null;
    owner?: { name: string } | null;
};

type Member = { id: number; name: string };

export default function ContactsIndex({
    contacts,
    companies,
    members,
    savedFilters,
    activeFilters,
    hasMailbox,
    createOpen,
}: {
    contacts: Contact[];
    companies: { id: number; name: string }[];
    members: Member[];
    savedFilters: { id: number; name: string }[];
    activeFilters: Record<string, string | null | boolean>;
    hasMailbox: boolean;
    createOpen?: boolean;
}) {
    const [drawer, setDrawer] = useState(Boolean(createOpen));
    const [columns, setColumns] = useState({
        email: true,
        phone: true,
        lead: true,
        created: true,
    });
    const view = String(activeFilters.view ?? 'all');
    const dateOptions = [
        { value: '7d', label: 'Last 7 days' },
        { value: '30d', label: 'Last 30 days' },
        { value: '90d', label: 'Last 90 days' },
        { value: 'none', label: 'No date' },
    ];

    const visible = useMemo(() => columns, [columns]);

    return (
        <>
            <Head title="Contacts" />
            <div className="flex h-[calc(100vh-52px)] flex-col bg-canvas text-[13px] text-ink">
                <CrmListHeader
                    title="Contacts"
                    views={[
                        { key: 'all', label: 'All contacts', href: '/crm/contacts?view=all' },
                        { key: 'mine', label: 'My contacts', href: '/crm/contacts?view=mine' },
                        ...savedFilters.map((filter) => ({
                            key: `saved-${filter.id}`,
                            label: filter.name,
                            href: `/crm/contacts?filter_id=${filter.id}`,
                        })),
                    ]}
                    activeView={
                        activeFilters.filter_id
                            ? `saved-${activeFilters.filter_id}`
                            : view
                    }
                    primaryLabel="Add contacts"
                    onPrimary={() => setDrawer(true)}
                />

                {!hasMailbox ? (
                    <div className="border-b border-hairline bg-canvas-soft px-6 py-2 text-[13px]">
                        Connect email to log outbound from this list.{' '}
                        <Link href="/outbound/mailboxes" className="font-medium text-brand">
                            Connect email
                        </Link>
                    </div>
                ) : null}

                <CrmListToolbar
                    action="/crm/contacts"
                    query={String(activeFilters.q ?? '')}
                    sort={String(activeFilters.sort ?? 'last_activity')}
                    sortOptions={[
                        { value: 'last_activity', label: 'Last activity' },
                        { value: 'created_at', label: 'Create date' },
                        { value: 'email', label: 'Email' },
                    ]}
                >
                    <input type="hidden" name="view" value={view} />
                    <ColumnFilter
                        name="owner"
                        label="Contact owner"
                        value={String(activeFilters.owner ?? '')}
                        options={[
                            { value: 'unassigned', label: 'Unassigned' },
                            ...members.map((member) => ({
                                value: String(member.id),
                                label: member.name,
                            })),
                        ]}
                    />
                    <ColumnFilter
                        name="create_date"
                        label="Create date"
                        value={String(activeFilters.create_date ?? '')}
                        options={dateOptions}
                    />
                    <ColumnFilter
                        name="last_activity"
                        label="Last activity date"
                        value={String(activeFilters.last_activity ?? '')}
                        options={dateOptions}
                    />
                    <ColumnFilter
                        name="lead_status"
                        label="Lead status"
                        value={String(activeFilters.lead_status ?? '')}
                        options={[
                            { value: 'new', label: 'New' },
                            { value: 'open', label: 'Open' },
                            { value: 'unqualified', label: 'Unqualified' },
                        ]}
                    />
                </CrmListToolbar>

                <div className="flex items-center justify-end gap-3 px-6 py-2 text-[12px]">
                    <label className="flex items-center gap-1">
                        <input
                            type="checkbox"
                            checked={visible.email}
                            onChange={() =>
                                setColumns((current) => ({
                                    ...current,
                                    email: !current.email,
                                }))
                            }
                        />
                        Email
                    </label>
                    <label className="flex items-center gap-1">
                        <input
                            type="checkbox"
                            checked={visible.phone}
                            onChange={() =>
                                setColumns((current) => ({
                                    ...current,
                                    phone: !current.phone,
                                }))
                            }
                        />
                        Phone
                    </label>
                    <span className="text-muted-foreground">Columns</span>
                </div>

                {contacts.length === 0 ? (
                    <CrmEmptyState
                        line="No contacts in this view."
                        actionLabel="Add contacts"
                        onAction={() => setDrawer(true)}
                    />
                ) : (
                    <div className="min-h-0 flex-1 overflow-auto">
                        <table className="w-full text-left text-[13px]">
                            <thead className="sticky top-0 bg-canvas-soft text-[11px] tracking-wide text-muted-foreground uppercase">
                                <tr>
                                    <th className="w-8 px-4 py-2">
                                        <input type="checkbox" aria-label="Select all" />
                                    </th>
                                    <th className="px-3 py-2">Name</th>
                                    {visible.email ? <th className="px-3 py-2">Email</th> : null}
                                    {visible.phone ? <th className="px-3 py-2">Phone</th> : null}
                                    {visible.lead ? <th className="px-3 py-2">Lead status</th> : null}
                                    {visible.created ? <th className="px-3 py-2">Create date</th> : null}
                                </tr>
                            </thead>
                            <tbody>
                                {contacts.map((contact) => (
                                    <tr
                                        key={contact.id}
                                        className="border-t border-hairline hover:bg-canvas-soft"
                                    >
                                        <td className="px-4 py-2">
                                            <input
                                                type="checkbox"
                                                aria-label={`${contact.first_name} ${contact.last_name ?? ''}`}
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <Link
                                                href={`/crm/contacts/${contact.id}`}
                                                className="font-medium text-ink hover:text-brand"
                                            >
                                                {contact.first_name} {contact.last_name}
                                            </Link>
                                            <p className="text-[12px] text-muted-foreground">
                                                {contact.company?.name ?? 'No company'}
                                            </p>
                                        </td>
                                        {visible.email ? (
                                            <td className="px-3 py-2">{contact.email ?? '—'}</td>
                                        ) : null}
                                        {visible.phone ? (
                                            <td className="px-3 py-2">
                                                {contact.phone_e164 ?? '—'}
                                            </td>
                                        ) : null}
                                        {visible.lead ? (
                                            <td className="px-3 py-2">
                                                {contact.lead_status ?? '—'}
                                            </td>
                                        ) : null}
                                        {visible.created ? (
                                            <td className="px-3 py-2 text-muted-foreground">
                                                {contact.created_at
                                                    ? String(contact.created_at).slice(0, 10)
                                                    : '—'}
                                            </td>
                                        ) : null}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <CrmListFooter
                    count={contacts.length}
                    noun="contacts"
                    exportHref="/crm/contacts/export"
                />
            </div>

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
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setDrawer(false)}
                                >
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
