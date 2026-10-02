import { Form, Link } from '@inertiajs/react';
import { CrmShell } from '@/components/crm/crm-shell';
import { RecordBack } from '@/components/crm/record-chrome';
import { Button } from '@/evo/ui/button';
import { t } from '@/lib/i18n';

type MergeContact = {
    id: number;
    first_name: string;
    last_name?: string | null;
    display_name: string;
    email?: string | null;
    phone?: string | null;
    phone_e164?: string | null;
    city?: string | null;
    wilaya?: string | null;
    source?: string | null;
    lead_status?: string | null;
    external_id?: string | null;
    company_id?: number | null;
    company?: string | null;
};

const FIELDS: Array<{ key: keyof MergeContact; label: string }> = [
    { key: 'first_name', label: 'First name' },
    { key: 'last_name', label: 'Last name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'city', label: 'City' },
    { key: 'wilaya', label: 'Wilaya' },
    { key: 'source', label: 'Source' },
    { key: 'lead_status', label: 'Lead status' },
    { key: 'external_id', label: 'External ID' },
    { key: 'company', label: 'Company' },
];

function fieldValue(contact: MergeContact, key: keyof MergeContact): string {
    const value = contact[key];

    return value === null || value === undefined || value === '' ? '' : String(value);
}

export default function ContactMerge({
    survivor,
    absorbed,
}: {
    survivor: MergeContact;
    absorbed: MergeContact;
}) {
    return (
        <CrmShell title="Merge contacts">
            <div className="h-full overflow-auto bg-canvas">
                <div className="mx-auto max-w-4xl space-y-6 px-6 py-6">
                    <RecordBack href="/crm/contacts/duplicates" label="Duplicates" />
                    <div>
                        <h1 className="text-page-title text-ink">{t('Merge contacts')}</h1>
                        <p className="mt-1 text-ui text-muted-foreground">
                            {t(':absorbed will be merged into :survivor. Choose the values that should remain.', {
                                absorbed: absorbed.display_name,
                                survivor: survivor.display_name,
                            })}
                        </p>
                    </div>

                    <Form action="/crm/contacts/merge" method="post" className="space-y-5">
                        {({ processing }) => (
                            <>
                                <input type="hidden" name="survivor_id" value={survivor.id} />
                                <input type="hidden" name="absorbed_id" value={absorbed.id} />

                                <div className="overflow-hidden rounded-md border border-hairline">
                                    <table className="w-full text-left text-[13px]">
                                        <thead className="bg-canvas-soft text-[11px] uppercase tracking-wide text-muted-foreground">
                                            <tr>
                                                <th className="px-4 py-2">{t('Field')}</th>
                                                <th className="px-4 py-2">{survivor.display_name}</th>
                                                <th className="px-4 py-2">{absorbed.display_name}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {FIELDS.map((field) => {
                                                const survivorValue = fieldValue(survivor, field.key);
                                                const absorbedValue = fieldValue(absorbed, field.key);
                                                const name =
                                                    field.key === 'company' ? 'values[company_id]' : `values[${field.key}]`;
                                                const survivorStored =
                                                    field.key === 'company' ? String(survivor.company_id ?? '') : survivorValue;
                                                const absorbedStored =
                                                    field.key === 'company' ? String(absorbed.company_id ?? '') : absorbedValue;

                                                return (
                                                    <tr key={field.key} className="border-t border-hairline">
                                                        <td className="px-4 py-3 font-medium">{t(field.label)}</td>
                                                        <td className="px-4 py-3">
                                                            <label className="inline-flex items-start gap-2">
                                                                <input
                                                                    type="radio"
                                                                    name={name}
                                                                    value={survivorStored}
                                                                    defaultChecked
                                                                />
                                                                <span>{survivorValue || '—'}</span>
                                                            </label>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <label className="inline-flex items-start gap-2">
                                                                <input
                                                                    type="radio"
                                                                    name={name}
                                                                    value={absorbedStored}
                                                                    disabled={absorbedStored === ''}
                                                                />
                                                                <span>{absorbedValue || '—'}</span>
                                                            </label>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Button disabled={processing}>{t('Merge contacts')}</Button>
                                    <Button asChild variant="outline">
                                        <Link href="/crm/contacts/duplicates">{t('Cancel')}</Link>
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </div>
            </div>
        </CrmShell>
    );
}

ContactMerge.layout = {
    breadcrumbs: [
        { title: 'Contacts', href: '/crm/contacts' },
        { title: 'Duplicates', href: '/crm/contacts/duplicates' },
        { title: 'Merge', href: '/crm/contacts/duplicates' },
    ],
};
