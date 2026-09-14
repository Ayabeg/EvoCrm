import { Form, Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { BulkActionBar } from '@/components/crm/bulk-action-bar';
import { CreateDrawer } from '@/components/crm/create-drawer';
import { CrmListShell } from '@/components/crm/crm-list-shell';
import { CrmObjectSecondaryLink } from '@/components/crm/crm-object-header';
import { SkeletonList } from '@/components/crm/empty-room';
import { CrmEmptyState, CrmListFooter } from '@/components/crm/list-chrome';
import { hasActiveListFilters, listPageHref } from '@/components/crm/list-query';
import ListViewTable from '@/components/crm/list-view-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInertiaLoading } from '@/hooks/use-inertia-loading';
import type { ListViewMeta, SavedView } from '@/lib/list-view-config';
import { t } from '@/lib/i18n';
import type { Auth } from '@/types';

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
    paginator,
    cities,
    wilayas,
    hasMailbox,
    createOpen,
    bulk,
}: {
    contacts: Contact[];
    companies: { id: number; name: string }[];
    members: { id: number; name: string }[];
    savedFilters: SavedView[];
    activeFilters: Record<string, unknown>;
    listView: ListViewMeta;
    recordCount: number;
    paginator?: { page: number; per_page: number; total: number; last_page: number };
    cities: string[];
    wilayas: string[];
    hasMailbox: boolean;
    createOpen?: boolean;
    bulk?: { enabled: boolean; sequences: { id: number; name: string }[] };
}) {
    const [drawer, setDrawer] = useState(Boolean(createOpen));
    const loading = useInertiaLoading();
    const { auth } = usePage<{ auth: Auth }>().props;
    const canImport = auth.capabilities.includes('crm.import');
    const canMerge = auth.capabilities.includes('crm.merge');
    const canBulk = Boolean(bulk?.enabled);

    return (
        <>
            <Head title={t('Contacts')} />
            <div
                className="flex h-app-workspace min-h-0 flex-col bg-canvas-soft"
                data-crm="contacts-workspace"
            >
                <CrmListShell
                    title="Contacts"
                    entity="contact"
                    basePath="/crm/contacts"
                    primaryLabel="Create contact"
                    onCreate={() => setDrawer(true)}
                    activeFilters={activeFilters}
                    savedFilters={savedFilters}
                    listView={listView}
                    recordCount={recordCount}
                    members={members}
                    cities={cities}
                    wilayas={wilayas}
                    companies={companies}
                    exportHref="/crm/contacts/export"
                    className="bg-white"
                    contentClassName="bg-white"
                    headerActions={
                        <>
                            {canMerge ? (
                                <CrmObjectSecondaryLink href="/crm/contacts/duplicates">
                                    {t('Duplicates')}
                                </CrmObjectSecondaryLink>
                            ) : null}
                            {canImport ? (
                                <CrmObjectSecondaryLink href="/crm/contacts/import">
                                    {t('Import')}
                                </CrmObjectSecondaryLink>
                            ) : null}
                        </>
                    }
                    selection={{
                        mode: 'uncontrolled',
                        selectable: canBulk,
                        pageIds: contacts.map((contact) => contact.id),
                    }}
                    banner={
                        !hasMailbox ? (
                            <div className="border-b border-hairline bg-white px-4 py-2 text-[12px] text-mute sm:px-6">
                                {t('Connect email to log outbound from this list.')}{' '}
                                <Link
                                    href="/outbound/mailboxes"
                                    className="text-ink underline-offset-2 hover:underline"
                                >
                                    {t('Connect email')}
                                </Link>
                            </div>
                        ) : null
                    }
                >
                    {(columns, selection) => (
                        <>
                            {canBulk && selection.bulkActive ? (
                                <BulkActionBar
                                    entity="contact"
                                    selectedIds={selection.selectedIds}
                                    members={members}
                                    sequences={bulk?.sequences ?? []}
                                    onClear={selection.clearSelection}
                                />
                            ) : null}
                            {loading ? (
                                <SkeletonList />
                            ) : contacts.length === 0 ? (
                                <CrmEmptyState
                                    title={
                                        hasActiveListFilters(activeFilters)
                                            ? 'No contacts match these filters'
                                            : 'No contacts yet'
                                    }
                                    line={
                                        hasActiveListFilters(activeFilters)
                                            ? 'Clear filters or open another saved view to see records.'
                                            : 'Add the first person you sell to. Name, phone, and company are enough to start.'
                                    }
                                    actionLabel={
                                        hasActiveListFilters(activeFilters)
                                            ? undefined
                                            : 'Create contact'
                                    }
                                    onAction={
                                        hasActiveListFilters(activeFilters)
                                            ? undefined
                                            : () => setDrawer(true)
                                    }
                                />
                            ) : (
                                <div className="min-h-0 flex-1 overflow-auto bg-white">
                                    <ListViewTable
                                        entity="contact"
                                        rows={contacts}
                                        columnDefs={listView.columnDefs}
                                        columns={columns}
                                        basePath="/crm/contacts"
                                        selectable={canBulk}
                                        selectedIds={selection.selectedIds}
                                        onToggle={selection.toggleOne}
                                        onTogglePage={selection.togglePage}
                                    />
                                </div>
                            )}
                            <CrmListFooter
                                count={contacts.length}
                                total={recordCount}
                                noun="contacts"
                                exportHref="/crm/contacts/export"
                                page={paginator?.page}
                                lastPage={paginator?.last_page}
                                perPage={paginator?.per_page}
                                prevHref={
                                    paginator && paginator.page > 1
                                        ? listPageHref('/crm/contacts', activeFilters, paginator.page - 1)
                                        : null
                                }
                                nextHref={
                                    paginator && paginator.page < paginator.last_page
                                        ? listPageHref('/crm/contacts', activeFilters, paginator.page + 1)
                                        : null
                                }
                            />
                        </>
                    )}
                </CrmListShell>
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
                                    {t('First name')}{' '}
                                    <span className="text-brand">*</span>
                                </Label>
                                <Input name="first_name" required />
                            </div>
                            <div>
                                <Label className="mb-1 block text-[12px]">
                                    {t('Last name')}
                                </Label>
                                <Input name="last_name" />
                            </div>
                            <div>
                                <Label className="mb-1 block text-[12px]">
                                    {t('Email')}
                                </Label>
                                <Input name="email" type="email" />
                            </div>
                            <div>
                                <Label className="mb-1 block text-[12px]">
                                    {t('Phone')}
                                </Label>
                                <Input name="phone" placeholder="0550…" />
                            </div>
                            <div>
                                <Label className="mb-1 block text-[12px]">
                                    {t('Company')}
                                </Label>
                                <select
                                    name="company_id"
                                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                >
                                    <option value="">{t('None')}</option>
                                    {companies.map((company) => (
                                        <option
                                            key={company.id}
                                            value={company.id}
                                        >
                                            {company.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label className="mb-1 block text-[12px]">
                                    {t('Lead status')}
                                </Label>
                                <select
                                    name="lead_status"
                                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                >
                                    <option value="">{t('None')}</option>
                                    <option value="new">{t('New')}</option>
                                    <option value="open">{t('Open')}</option>
                                    <option value="unqualified">
                                        {t('Unqualified')}
                                    </option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setDrawer(false)}
                                >
                                    {t('Cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    name="add_another"
                                    value="1"
                                    variant="outline"
                                    disabled={processing}
                                >
                                    {t('Create and add another')}
                                </Button>
                                <Button disabled={processing}>{t('Create')}</Button>
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
