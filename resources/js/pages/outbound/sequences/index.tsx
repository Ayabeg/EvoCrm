import { Form, router } from '@inertiajs/react';
import { OutboundPage, OutboundShell } from '@/components/crm/outbound-shell';
import { DataGrid, DataGridRowAction } from '@/evo/data/data-grid';
import type { EvoDataGridColumn } from '@/evo/data/data-grid';
import { Field, OutboundSection } from '@/evo/outbound/section';
import { channelLabel } from '@/evo/outbound/status';
import type { SequenceRow } from '@/evo/outbound/types';
import { Button } from '@/evo/ui/button';
import { Input } from '@/evo/ui/input';
import { NativeSelect } from '@/evo/ui/native-select';
import { Status } from '@/evo/ui/status';
import { t } from '@/lib/i18n';

export default function SequencesIndex({ sequences }: { sequences: SequenceRow[] }) {
    const columns: EvoDataGridColumn<SequenceRow>[] = [
        {
            id: 'sequence',
            header: t('Sequence'),
            accessorFn: (row) => row.name,
            cell: ({ row }) => (
                <div>
                    <button
                        type="button"
                        className="font-medium text-[var(--evo-ink)] underline-offset-2 hover:underline"
                        onClick={() => router.visit(`/outbound/sequences/${row.original.id}`)}
                    >
                        {row.original.name}
                    </button>
                    {row.original.description ? (
                        <p className="mt-0.5 text-[11px] text-[var(--evo-ink-muted)]">
                            {row.original.description}
                        </p>
                    ) : null}
                </div>
            ),
        },
        {
            id: 'channel',
            header: t('Channel'),
            accessorFn: (row) => channelLabel(row.channel),
        },
        {
            id: 'steps',
            header: t('Steps'),
            accessorFn: (row) => row.steps?.length ?? 0,
            cell: ({ row }) => <span className="tabular-nums">{row.original.steps?.length ?? 0}</span>,
        },
        {
            id: 'enrolled',
            header: t('Enrolled'),
            accessorFn: (row) => row.enrollments_count,
            cell: ({ row }) => <span className="tabular-nums">{row.original.enrollments_count}</span>,
        },
        {
            id: 'active',
            header: t('Active'),
            accessorFn: (row) => row.enrollments_active,
            cell: ({ row }) => <span className="tabular-nums">{row.original.enrollments_active}</span>,
        },
        {
            id: 'paused',
            header: t('Paused'),
            accessorFn: (row) => row.enrollments_paused,
            cell: ({ row }) => <span className="tabular-nums">{row.original.enrollments_paused}</span>,
        },
        {
            id: 'finished',
            header: t('Finished'),
            accessorFn: (row) => row.enrollments_finished,
            cell: ({ row }) => <span className="tabular-nums">{row.original.enrollments_finished}</span>,
        },
        {
            id: 'state',
            header: t('State'),
            cell: ({ row }) => (
                <Status
                    tone={row.original.active ? 'success' : 'neutral'}
                    label={row.original.active ? t('active') : t('draft')}
                />
            ),
        },
    ];

    return (
        <OutboundShell title={t('Sequences')}>
            <OutboundPage
                title={t('Sequences')}
                description={t(
                    'Email and Algerian SMS steps with {{variables}}. Quiet hours (Africa/Algiers) defer sends; suppression cancels enrollment. WhatsApp steps use official Cloud templates only. SMS never stubs — connect a DZ gateway in Settings.',
                )}
            >
                <OutboundSection title={t('Create sequence')}>
                    <Form
                        action="/outbound/sequences"
                        method="post"
                        className="grid gap-3 md:grid-cols-3"
                        resetOnSuccess
                    >
                        {({ processing }) => (
                            <>
                                <Field label={t('Start from')} className="md:col-span-3">
                                    <div className="flex flex-wrap gap-3 text-[13px]">
                                        <label className="flex items-center gap-2">
                                            <input type="radio" name="origin" value="scratch" defaultChecked />
                                            {t('From scratch')}
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input type="radio" name="origin" value="template" />
                                            {t('From template')}
                                        </label>
                                    </div>
                                </Field>
                                <Field label={t('Name')} htmlFor="sequence-name">
                                    <Input
                                        id="sequence-name"
                                        name="name"
                                        required
                                        placeholder={t('Clinic email nurture')}
                                    />
                                </Field>
                                <Field label={t('Channel')} htmlFor="sequence-channel">
                                    <NativeSelect id="sequence-channel" name="channel" defaultValue="email">
                                        <option value="email">{t('Email SMTP')}</option>
                                        <option value="sms">{t('SMS (Algeria 05 / 06 / 07)')}</option>
                                        <option value="whatsapp_cloud">{t('WhatsApp Cloud template')}</option>
                                    </NativeSelect>
                                </Field>
                                <Field label={t('Uncertain email policy')} htmlFor="sequence-email-policy">
                                    <NativeSelect id="sequence-email-policy" name="email_verification_policy" defaultValue="strict">
                                        <option value="strict">{t('Strict — verified results only')}</option>
                                        <option value="allow_catch_all">{t('Allow catch-all if deployment permits')}</option>
                                        <option value="allow_unknown">{t('Allow unknown if deployment permits')}</option>
                                        <option value="allow_uncertain">{t('Allow uncertain results if deployment permits')}</option>
                                    </NativeSelect>
                                </Field>
                                <div className="flex items-end">
                                    <Button disabled={processing}>{t('Create')}</Button>
                                </div>
                            </>
                        )}
                    </Form>
                </OutboundSection>

                <DataGrid
                    columns={columns}
                    data={sequences}
                    getRowId={(row) => String(row.id)}
                    density="compact"
                    enableSelection={false}
                    onRowClick={(row) => router.visit(`/outbound/sequences/${row.id}`)}
                    emptyTitle={t('No sequences yet. Create one above.')}
                    rowActions={(sequence) => (
                        <DataGridRowAction
                            onClick={() => router.post(`/outbound/sequences/${sequence.id}/toggle`)}
                        >
                            {sequence.active ? t('Pause') : t('Activate')}
                        </DataGridRowAction>
                    )}
                />
            </OutboundPage>
        </OutboundShell>
    );
}

SequencesIndex.layout = {
    breadcrumbs: [{ title: t('Sequences'), href: '/outbound/sequences' }],
};
