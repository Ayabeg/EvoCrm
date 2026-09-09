import { Form } from '@inertiajs/react';
import { useState } from 'react';
import { CreateDrawer } from '@/components/crm/create-drawer';
import { CrmListShell } from '@/components/crm/crm-list-shell';
import { CrmShell } from '@/components/crm/crm-shell';
import { SkeletonList } from '@/components/crm/empty-room';
import { CrmEmptyState, CrmListFooter } from '@/components/crm/list-chrome';
import { hasActiveListFilters, listPageHref } from '@/components/crm/list-query';
import ListViewTable from '@/components/crm/list-view-table';
import type { StagePill } from '@/components/crm/stage-pills';
import TicketLayoutToggle from '@/components/crm/ticket-layout-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInertiaLoading } from '@/hooks/use-inertia-loading';
import type { ListViewMeta, SavedView } from '@/lib/list-view-config';

type TicketRow = {
    id: number;
    number: string;
    subject: string;
    status: string;
    status_label?: string;
    priority?: string | null;
    channel?: string | null;
    channel_label?: string | null;
    created_at?: string | null;
    sla_due_at?: string | null;
    contact?: { first_name: string; last_name?: string | null } | null;
    company?: { name: string } | null;
    owner?: { id: number; name: string } | null;
};

type Contact = { id: number; first_name: string; last_name?: string | null };

export default function TicketsIndex({
    tickets,
    stagePills,
    contacts,
    members,
    savedFilters,
    activeFilters,
    listView,
    recordCount,
    paginator,
    createOpen,
    createDefaults,
}: {
    tickets: TicketRow[];
    stagePills: StagePill[];
    contacts: Contact[];
    members: { id: number; name: string }[];
    savedFilters: SavedView[];
    activeFilters: Record<string, unknown>;
    listView: ListViewMeta;
    recordCount: number;
    paginator?: { page: number; per_page: number; total: number; last_page: number };
    createOpen?: boolean;
    createDefaults?: { contact_id?: number | null; deal_id?: number | null };
}) {
    const [drawer, setDrawer] = useState(Boolean(createOpen));
    const loading = useInertiaLoading();

    return (
        <>
            <CrmShell title="Tickets" chrome="workspace">
                <CrmListShell
                    title="Tickets"
                    entity="ticket"
                    basePath="/crm/tickets"
                    primaryLabel="Create ticket"
                    activeFilters={activeFilters}
                    savedFilters={savedFilters}
                    listView={listView}
                    recordCount={recordCount}
                    members={members}
                    contacts={contacts}
                    stagePills={stagePills}
                    createHref="/crm/tickets?create=1"
                    layoutToggle={<TicketLayoutToggle current="list" />}
                >
                    {(columns) => (
                        <>
                            {loading ? (
                                <SkeletonList />
                            ) : tickets.length === 0 ? (
                                <CrmEmptyState
                                    title={
                                        hasActiveListFilters(activeFilters)
                                            ? 'No tickets match these filters'
                                            : 'No tickets yet'
                                    }
                                    line={
                                        hasActiveListFilters(activeFilters)
                                            ? 'Clear filters or pick another status to see records.'
                                            : 'Create a ticket on a contact. Desk stays the inbox.'
                                    }
                                    actionLabel={
                                        hasActiveListFilters(activeFilters)
                                            ? undefined
                                            : 'Create ticket'
                                    }
                                    onAction={
                                        hasActiveListFilters(activeFilters)
                                            ? undefined
                                            : () => setDrawer(true)
                                    }
                                />
                            ) : (
                                <div className="min-h-0 flex-1 overflow-auto">
                                    <ListViewTable
                                        entity="ticket"
                                        rows={tickets}
                                        columnDefs={listView.columnDefs}
                                        columns={columns}
                                        basePath="/crm/tickets"
                                    />
                                </div>
                            )}
                            <CrmListFooter
                                count={tickets.length}
                                total={recordCount}
                                noun="tickets"
                                page={paginator?.page}
                                lastPage={paginator?.last_page}
                                perPage={paginator?.per_page}
                                prevHref={
                                    paginator && paginator.page > 1
                                        ? listPageHref('/crm/tickets', activeFilters, paginator.page - 1)
                                        : null
                                }
                                nextHref={
                                    paginator && paginator.page < paginator.last_page
                                        ? listPageHref('/crm/tickets', activeFilters, paginator.page + 1)
                                        : null
                                }
                            />
                        </>
                    )}
                </CrmListShell>
            </CrmShell>

            <CreateDrawer open={drawer} onOpenChange={setDrawer} title="Create ticket">
                <Form
                    action="/crm/tickets"
                    method="post"
                    className="space-y-3"
                    resetOnSuccess
                    onSuccess={() => setDrawer(false)}
                >
                    {({ processing }) => (
                        <>
                            {createDefaults?.deal_id ? (
                                <input type="hidden" name="deal_id" value={createDefaults.deal_id} />
                            ) : null}
                            <div>
                                <Label className="mb-1 block text-[12px]">
                                    Subject <span className="text-brand">*</span>
                                </Label>
                                <Input name="subject" required maxLength={180} />
                            </div>
                            <div>
                                <Label className="mb-1 block text-[12px]">
                                    Contact <span className="text-brand">*</span>
                                </Label>
                                <select
                                    name="contact_id"
                                    required
                                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                    defaultValue={createDefaults?.contact_id ? String(createDefaults.contact_id) : ''}
                                >
                                    <option value="" disabled>
                                        Select a contact
                                    </option>
                                    {contacts.map((contact) => (
                                        <option key={contact.id} value={contact.id}>
                                            {contact.first_name} {contact.last_name ?? ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label className="mb-1 block text-[12px]">Priority</Label>
                                <select
                                    name="priority"
                                    defaultValue="medium"
                                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                >
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>
                            <div>
                                <Label className="mb-1 block text-[12px]">Channel</Label>
                                <select
                                    name="channel"
                                    defaultValue="manual"
                                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                >
                                    <option value="whatsapp_cloud">WhatsApp</option>
                                    <option value="email">Email</option>
                                    <option value="manual">Manual</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="ghost" onClick={() => setDrawer(false)}>
                                    Cancel
                                </Button>
                                <Button disabled={processing}>Create ticket</Button>
                            </div>
                        </>
                    )}
                </Form>
            </CreateDrawer>
        </>
    );
}

TicketsIndex.layout = {
    breadcrumbs: [{ title: 'Tickets', href: '/crm/tickets' }],
};
