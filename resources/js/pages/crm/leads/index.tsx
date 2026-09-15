import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import { CreateDrawer } from '@/components/crm/create-drawer';
import { CrmListShell } from '@/components/crm/crm-list-shell';
import { CrmObjectSecondaryLink } from '@/components/crm/crm-object-header';
import { hasActiveListFilters } from '@/components/crm/list-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInertiaLoading } from '@/hooks/use-inertia-loading';
import type { ListViewMeta, SavedView } from '@/lib/list-view-config';
import {
    leadEmptyState,
    leadRowHref,
} from '@/pages/crm/leads/lead-columns';
import type { LeadListRow } from '@/pages/crm/leads/lead-columns';

type ContactOption = {
    id: number;
    first_name: string;
    last_name?: string | null;
};

export default function LeadsIndex({
    leads,
    contacts,
    savedFilters = [],
    activeFilters = {},
    listView,
    recordCount,
    paginator,
}: {
    leads: LeadListRow[];
    contacts: ContactOption[];
    savedFilters?: SavedView[];
    activeFilters?: Record<string, unknown>;
    listView: ListViewMeta;
    recordCount: number;
    paginator?: { page: number; per_page: number; total: number; last_page: number };
}) {
    const [drawer, setDrawer] = useState(false);
    const loading = useInertiaLoading();

    return (
        <>
            <Head title="Leads" />
            <div
                className="flex h-app-workspace min-h-0 flex-col bg-canvas-soft"
                data-crm="leads-workspace"
            >
                <CrmListShell
                    resultMode="shared-table"
                    title="Leads"
                    entity="lead"
                    basePath="/crm/leads"
                    primaryLabel="Create lead"
                    onCreate={() => setDrawer(true)}
                    activeFilters={activeFilters}
                    savedFilters={savedFilters}
                    listView={listView}
                    recordCount={recordCount}
                    className="bg-white"
                    contentClassName="bg-white"
                    rows={leads}
                    rowHref={leadRowHref}
                    empty={leadEmptyState(hasActiveListFilters(activeFilters))}
                    paginator={paginator}
                    loading={loading}
                    headerActions={
                        <CrmObjectSecondaryLink href="/crm/leads/captures">
                            Capture inbox
                        </CrmObjectSecondaryLink>
                    }
                    selection={{
                        mode: 'uncontrolled',
                        // Page does not participate now. Not a permanent bulk ban.
                        selectable: false,
                        pageIds: leads.map((lead) => lead.id),
                    }}
                />
            </div>

            <CreateDrawer
                open={drawer}
                onOpenChange={setDrawer}
                title="Create lead"
            >
                <Form
                    action="/crm/leads"
                    method="post"
                    className="space-y-3"
                    resetOnSuccess
                    onSuccess={() => setDrawer(false)}
                >
                    {({ processing }) => (
                        <>
                            <div>
                                <Label className="mb-1 block text-[12px]">
                                    Title <span className="text-brand">*</span>
                                </Label>
                                <Input name="title" required />
                            </div>
                            <div>
                                <Label className="mb-1 block text-[12px]">
                                    Contact{' '}
                                    <span className="text-brand">*</span>
                                </Label>
                                <select
                                    name="contact_id"
                                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                    required
                                >
                                    <option value="">Select</option>
                                    {contacts.map((contact) => (
                                        <option
                                            key={contact.id}
                                            value={contact.id}
                                        >
                                            {contact.first_name}{' '}
                                            {contact.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label className="mb-1 block text-[12px]">
                                    Source
                                </Label>
                                <Input name="source" placeholder="manual" />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setDrawer(false)}
                                >
                                    Cancel
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

LeadsIndex.layout = {
    breadcrumbs: [{ title: 'Leads', href: '/crm/leads' }],
};
