import { Form, Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { BulkActionBar } from '@/components/crm/bulk-action-bar';
import { CrmListShell } from '@/components/crm/crm-list-shell';
import { CrmObjectSecondaryLink } from '@/components/crm/crm-object-header';
import { hasActiveListFilters } from '@/components/crm/list-query';
import { MorphingForm } from '@/components/crm/morphing-form';
import { Button } from '@/evo/ui/button';
import { Input } from '@/evo/ui/input';
import { Label } from '@/evo/ui/label';
import { useInertiaLoading } from '@/hooks/use-inertia-loading';
import { t } from '@/lib/i18n';
import type { ListViewMeta, SavedView } from '@/lib/list-view-config';
import {
    contactEmptyState,
    contactRowHref,
} from '@/pages/crm/contacts/contact-columns';
import type { ContactListRow } from '@/pages/crm/contacts/contact-columns';
import type { Auth } from '@/types';

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
    dataQuality,
}: {
    contacts: ContactListRow[];
    companies: { id: number; name: string }[];
    members: { id: number; name: string }[];
    savedFilters: SavedView[];
    activeFilters: Record<string, unknown>;
    listView: ListViewMeta;
    recordCount: number;
    paginator?: {
        page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
    cities: string[];
    wilayas: string[];
    hasMailbox: boolean;
    createOpen?: boolean;
    bulk?: { enabled: boolean; sequences: { id: number; name: string }[] };
    dataQuality: {
        missing_contact: number;
        missing_company: number;
        unassigned: number;
        missing_source: number;
        duplicate_groups: number;
        duplicate_contacts: number;
    };
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
                className="v02-list h-app-workspace flex min-h-0 flex-col bg-[var(--evo-canvas)]"
                data-crm="contacts-workspace"
            >
                <section
                    aria-label={t('Contact data quality')}
                    className="grid shrink-0 grid-cols-2 gap-3 border-b border-hairline bg-white px-4 py-3 lg:grid-cols-3 xl:grid-cols-6"
                >
                    <QualityMetric
                        label={t('Missing email and phone')}
                        value={dataQuality.missing_contact}
                    />
                    <QualityMetric
                        label={t('Missing company')}
                        value={dataQuality.missing_company}
                    />
                    <QualityMetric
                        label={t('Unassigned owner')}
                        value={dataQuality.unassigned}
                    />
                    <QualityMetric
                        label={t('Missing lead source')}
                        value={dataQuality.missing_source}
                    />
                    {canMerge ? (
                        <QualityMetric
                            label={t('Duplicate groups')}
                            value={dataQuality.duplicate_groups}
                            href="/crm/contacts/duplicates"
                        />
                    ) : null}
                    {canMerge ? (
                        <QualityMetric
                            label={t('Contacts in duplicate groups')}
                            value={dataQuality.duplicate_contacts}
                            href="/crm/contacts/duplicates"
                        />
                    ) : null}
                </section>
                <CrmListShell
                    resultMode="shared-table"
                    title="Contacts"
                    entity="contact"
                    basePath="/crm/contacts"
                    primaryLabel="Create contact"
                    onCreate={() => setDrawer(true)}
                    primarySlot={
                        <MorphingForm
                            label="Create contact"
                            title="Create contact"
                            open={drawer}
                            onOpenChange={setDrawer}
                        >
                            <ContactCreateForm
                                onDone={() => setDrawer(false)}
                                companies={companies}
                            />
                        </MorphingForm>
                    }
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
                    rows={contacts}
                    rowHref={contactRowHref}
                    empty={contactEmptyState(
                        hasActiveListFilters(activeFilters),
                    )}
                    paginator={paginator}
                    loading={loading}
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
                    bulk={
                        canBulk
                            ? (selection) => (
                                  <BulkActionBar
                                      entity="contact"
                                      selectedIds={selection.selectedIds}
                                      members={members}
                                      sequences={bulk?.sequences ?? []}
                                      onClear={selection.clearSelection}
                                  />
                              )
                            : undefined
                    }
                    banner={
                        !hasMailbox ? (
                            <div className="border-b border-hairline bg-white px-4 py-2 text-[12px] text-mute sm:px-6">
                                {t(
                                    'Connect email to log outbound from this list.',
                                )}{' '}
                                <Link
                                    href="/outbound/mailboxes"
                                    className="text-ink underline-offset-2 hover:underline"
                                >
                                    {t('Connect email')}
                                </Link>
                            </div>
                        ) : null
                    }
                />
            </div>
        </>
    );
}

function QualityMetric({
    label,
    value,
    href,
}: {
    label: string;
    value: number;
    href?: string;
}) {
    const content = (
        <div className="rounded-lg border border-hairline bg-canvas-soft px-3 py-2.5">
            <p className="text-[12px] font-medium text-mute">{label}</p>
            <p className="mt-1 text-xl font-semibold text-ink">
                {value.toLocaleString()}
            </p>
        </div>
    );

    return href ? (
        <Link href={href} className="block rounded-lg hover:border-brand/40">
            {content}
        </Link>
    ) : (
        content
    );
}

function ContactCreateForm({
    companies,
    onDone,
}: {
    companies: { id: number; name: string }[];
    onDone: () => void;
}) {
    return (
        <Form
            action="/crm/contacts"
            method="post"
            className="space-y-3"
            resetOnSuccess
            onSuccess={onDone}
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
                                <option key={company.id} value={company.id}>
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
                    <div>
                        <Label className="mb-1 block text-[12px]">
                            {t('Lead source')}
                        </Label>
                        <select
                            name="source"
                            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                            defaultValue=""
                        >
                            <option value="">{t('Unknown')}</option>
                            <option value="website">{t('Website')}</option>
                            <option value="referral">{t('Referral')}</option>
                            <option value="facebook">{t('Facebook')}</option>
                            <option value="instagram">{t('Instagram')}</option>
                            <option value="whatsapp">WhatsApp</option>
                            <option value="phone">{t('Phone')}</option>
                            <option value="event">{t('Event')}</option>
                            <option value="partner">{t('Partner')}</option>
                            <option value="import">{t('Import')}</option>
                            <option value="other">{t('Other')}</option>
                        </select>
                    </div>
                    <div>
                        <Label className="mb-1 block text-[12px]">
                            {t('Source detail')}
                        </Label>
                        <Input
                            name="source_detail"
                            placeholder={t(
                                'Landing page, partner, or campaign detail',
                            )}
                            maxLength={180}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={onDone}>
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
    );
}

ContactsIndex.layout = {
    breadcrumbs: [{ title: 'Contacts', href: '/crm/contacts' }],
};
