import { Form, Link, router } from '@inertiajs/react';
import { useEffect } from 'react';
import { CrmShell } from '@/components/crm/crm-shell';
import { RecordBack } from '@/components/crm/record-chrome';
import { Button } from '@/evo/ui/button';
import { Label } from '@/evo/ui/label';
import { t } from '@/lib/i18n';

type PreviewCounts = {
    created: number;
    updated: number;
    skipped: number;
    errors: number;
    total: number;
};

type ImportBatchPayload = {
    id: number;
    status: string;
    filename: string;
    headers: string[];
    mapping: Record<string, string>;
    fields: Record<string, string>;
    preview: PreviewCounts;
    progress: PreviewCounts & { processed: number };
    samples: Array<{
        row_number: number;
        action: string | null;
        values: { name: string; email: string; phone: string; company: string };
        error: string | null;
    }>;
    errors: Array<{ row_number: number; message: string | null }>;
};

function Count({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-md border border-hairline bg-canvas px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="text-[18px] font-semibold text-ink">{value}</p>
        </div>
    );
}

export default function ContactImport({ batch }: { batch: ImportBatchPayload | null }) {
    useEffect(() => {
        if (batch?.status !== 'processing') {
            return;
        }

        const timer = window.setInterval(() => {
            router.reload({ only: ['batch'] });
        }, 2000);

        return () => window.clearInterval(timer);
    }, [batch?.status]);

    return (
        <CrmShell title="Import contacts">
            <div className="h-full overflow-auto bg-canvas">
                <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">
                    <RecordBack href="/crm/contacts" label="Contacts" />
                    <div>
                        <h1 className="text-page-title text-ink">{t('Import contacts')}</h1>
                        <p className="mt-1 text-ui text-muted-foreground">
                            {t('Upload a CSV, confirm the column mapping, then import. Matching uses external ID, then email, then phone.')}
                        </p>
                    </div>

                    {!batch ? (
                        <Form
                            action="/crm/contacts/import"
                            method="post"
                            encType="multipart/form-data"
                            className="space-y-4 rounded-md border border-hairline bg-canvas p-5"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div>
                                        <Label htmlFor="file" className="mb-1 block text-[12px]">
                                            {t('CSV file')}
                                        </Label>
                                        <input
                                            id="file"
                                            name="file"
                                            type="file"
                                            accept=".csv,text/csv"
                                            required
                                            className="block w-full text-ui file:mr-3 file:rounded-sm file:border-0 file:bg-canvas-soft file:px-3 file:py-1.5"
                                        />
                                        {errors.file ? (
                                            <p className="mt-1 text-[12px] text-destructive">{errors.file}</p>
                                        ) : (
                                            <p className="mt-1 text-[12px] text-muted-foreground">
                                                {t('HubSpot exports are supported. Maximum 10 MB.')}
                                            </p>
                                        )}
                                    </div>
                                    <Button disabled={processing}>{t('Preview import')}</Button>
                                </>
                            )}
                        </Form>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex flex-wrap items-end justify-between gap-3">
                                <div>
                                    <p className="text-ui font-medium text-ink">{batch.filename}</p>
                                    <p className="text-[12px] text-muted-foreground">
                                        {t(':total rows · :status', {
                                            total: batch.preview.total,
                                            status: t(batch.status),
                                        })}
                                    </p>
                                </div>
                                <Link href="/crm/contacts/import" className="text-ui font-medium text-brand">
                                    {t('Upload another file')}
                                </Link>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <Count label={t('Create')} value={batch.status === 'completed' ? batch.progress.created : batch.preview.created} />
                                <Count label={t('Update')} value={batch.status === 'completed' ? batch.progress.updated : batch.preview.updated} />
                                <Count label={t('Skip')} value={batch.status === 'completed' ? batch.progress.skipped : batch.preview.skipped} />
                                <Count label={t('Errors')} value={batch.status === 'completed' ? batch.progress.errors : batch.preview.errors} />
                            </div>

                            {batch.status !== 'completed' && batch.status !== 'processing' ? (
                                <Form
                                    action={`/crm/contacts/import/${batch.id}`}
                                    method="put"
                                    className="space-y-4 rounded-md border border-hairline"
                                >
                                    {({ processing }) => (
                                        <>
                                            <div className="border-b border-hairline bg-canvas-soft px-4 py-3">
                                                <h2 className="text-[14px] font-semibold">{t('Column mapping')}</h2>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-[13px]">
                                                    <thead className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                                        <tr>
                                                            <th className="px-4 py-2">{t('CSV column')}</th>
                                                            <th className="px-4 py-2">{t('EvoSales field')}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {batch.headers.map((header) => (
                                                            <tr key={header} className="border-t border-hairline">
                                                                <td className="px-4 py-2">{header}</td>
                                                                <td className="px-4 py-2">
                                                                    <select
                                                                        name={`mapping[${header}]`}
                                                                        defaultValue={batch.mapping[header] ?? ''}
                                                                        className="h-8 w-full max-w-xs rounded-md border border-hairline bg-background px-2 text-sm"
                                                                    >
                                                                        <option value="">{t('Ignore')}</option>
                                                                        {Object.entries(batch.fields).map(([value, label]) => (
                                                                            <option key={value} value={value}>
                                                                                {t(label)}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="flex flex-wrap gap-2 px-4 pb-4">
                                                <Button type="submit" variant="outline" disabled={processing}>
                                                    {t('Update preview')}
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </Form>
                            ) : null}

                            <div className="overflow-hidden rounded-md border border-hairline">
                                <div className="border-b border-hairline bg-canvas-soft px-4 py-3">
                                    <h2 className="text-[14px] font-semibold">{t('Sample rows')}</h2>
                                </div>
                                <table className="w-full text-left text-[13px]">
                                    <thead className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-2">{t('Row')}</th>
                                            <th className="px-4 py-2">{t('Action')}</th>
                                            <th className="px-4 py-2">{t('Name')}</th>
                                            <th className="px-4 py-2">{t('Email')}</th>
                                            <th className="px-4 py-2">{t('Phone')}</th>
                                            <th className="px-4 py-2">{t('Company')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {batch.samples.map((row) => (
                                            <tr key={row.row_number} className="border-t border-hairline">
                                                <td className="px-4 py-2">{row.row_number}</td>
                                                <td className="px-4 py-2 capitalize">{row.action ?? '—'}</td>
                                                <td className="px-4 py-2">{row.values.name || '—'}</td>
                                                <td className="px-4 py-2">{row.values.email || '—'}</td>
                                                <td className="px-4 py-2">{row.values.phone || '—'}</td>
                                                <td className="px-4 py-2">{row.values.company || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {batch.errors.length > 0 ? (
                                <div className="rounded-md border border-hairline px-4 py-3">
                                    <h2 className="mb-2 text-[14px] font-semibold">{t('Row errors')}</h2>
                                    <ul className="space-y-1 text-[13px] text-muted-foreground">
                                        {batch.errors.map((error) => (
                                            <li key={error.row_number}>
                                                {t('Row :number: :message', {
                                                    number: error.row_number,
                                                    message: error.message ?? '',
                                                })}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}

                            {batch.status === 'completed' ? (
                                <div className="flex flex-wrap gap-2">
                                    <Button asChild>
                                        <Link href="/crm/contacts">{t('View contacts')}</Link>
                                    </Button>
                                    <Button asChild variant="outline">
                                        <Link href="/crm/contacts/import">{t('Import another file')}</Link>
                                    </Button>
                                </div>
                            ) : batch.status === 'processing' ? (
                                <p className="text-ui text-muted-foreground">
                                    {t('Import is running (:processed of :total rows).', {
                                        processed: batch.progress.processed,
                                        total: batch.progress.total,
                                    })}
                                </p>
                            ) : (
                                <Form action={`/crm/contacts/import/${batch.id}/commit`} method="post">
                                    {({ processing }) => (
                                        <Button disabled={processing || batch.preview.created + batch.preview.updated === 0}>
                                            {t('Import contacts')}
                                        </Button>
                                    )}
                                </Form>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </CrmShell>
    );
}

ContactImport.layout = {
    breadcrumbs: [
        { title: 'Contacts', href: '/crm/contacts' },
        { title: 'Import', href: '/crm/contacts/import' },
    ],
};
