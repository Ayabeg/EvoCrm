import { Form, router } from '@inertiajs/react';
import { OutboundPage, OutboundShell } from '@/components/crm/outbound-shell';
import { DataGrid, DataGridRowAction } from '@/evo/data/data-grid';
import type { EvoDataGridColumn } from '@/evo/data/data-grid';
import { Field, OutboundSection } from '@/evo/outbound/section';
import { TemplateEditor } from '@/evo/outbound/TemplateEditor';
import type { TemplateRow } from '@/evo/outbound/types';
import { Button } from '@/evo/ui/button';
import { Input } from '@/evo/ui/input';
import { NativeSelect } from '@/evo/ui/native-select';
import { Status } from '@/evo/ui/status';
import { t } from '@/lib/i18n';

type ContactRow = {
    id: number;
    first_name: string;
    phone_e164?: string | null;
};

export default function TemplatesIndex({
    templates,
    contacts,
    note,
}: {
    templates: TemplateRow[];
    contacts: ContactRow[];
    note: string;
}) {
    const columns: EvoDataGridColumn<TemplateRow>[] = [
        {
            id: 'name',
            header: t('Name'),
            accessorFn: (row) => row.name,
            cell: ({ row }) => (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-[var(--evo-ink)]">{row.original.name}</span>
                    {row.original.body_html ? <Status tone="info" label={t('HTML')} /> : null}
                </div>
            ),
        },
        {
            id: 'subject',
            header: t('Subject'),
            accessorFn: (row) => row.subject ?? '—',
        },
        {
            id: 'created',
            header: t('When'),
            accessorFn: (row) => row.created_at ?? '—',
        },
    ];

    return (
        <OutboundShell title={t('Templates')}>
            <OutboundPage
                title={t('Email templates')}
                description={t(
                    'Reusable subject + text/HTML body with {{first_name}}, {{last_name}}, {{name}}, {{email}}, {{phone}}, {{company}}, {{city}}, {{wilaya}}, {{unsub}}. Sequence steps and campaigns prefill from these. The unsubscribe link always points at this CRM host.',
                )}
            >
                <OutboundSection title={t('New template')}>
                    <Form action="/outbound/templates" method="post" className="grid gap-3" resetOnSuccess>
                        {({ processing }) => (
                            <>
                                <TemplateEditor />
                                <div>
                                    <Button disabled={processing}>{t('Save template')}</Button>
                                </div>
                            </>
                        )}
                    </Form>
                </OutboundSection>

                <DataGrid
                    columns={columns}
                    data={templates}
                    getRowId={(row) => String(row.id)}
                    density="compact"
                    enableSelection={false}
                    onRowClick={(row) => router.visit(`/outbound/templates/${row.id}`)}
                    emptyTitle={t('No templates yet.')}
                    rowActions={(template) => (
                        <DataGridRowAction onClick={() => router.visit(`/outbound/templates/${template.id}`)}>
                            {t('Edit & preview')}
                        </DataGridRowAction>
                    )}
                />

                <OutboundSection title={t('Official WhatsApp Cloud template send')} description={note}>
                    <Form
                        action="/outbound/templates/send"
                        method="post"
                        className="grid gap-3 md:grid-cols-4"
                    >
                        {({ processing }) => (
                            <>
                                <Field label={t('Contact')}>
                                    <NativeSelect name="contact_id" required>
                                        <option value="">{t('Select')}</option>
                                        {contacts.map((contact) => (
                                            <option key={contact.id} value={contact.id}>
                                                {contact.first_name} {contact.phone_e164}
                                            </option>
                                        ))}
                                    </NativeSelect>
                                </Field>
                                <Field label={t('Template name')}>
                                    <Input name="wa_template_name" placeholder="hello_world" required />
                                </Field>
                                <Field label={t('Language')}>
                                    <Input name="wa_template_language" defaultValue="fr" />
                                </Field>
                                <div className="flex items-end">
                                    <Button disabled={processing}>{t('Send via Evolution Cloud')}</Button>
                                </div>
                            </>
                        )}
                    </Form>
                </OutboundSection>
            </OutboundPage>
        </OutboundShell>
    );
}

TemplatesIndex.layout = {
    breadcrumbs: [{ title: t('Templates'), href: '/outbound/templates' }],
};
