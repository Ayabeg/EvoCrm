import { Form, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { OutboundPage, OutboundShell } from '@/components/crm/outbound-shell';
import SequenceStepEditor from '@/components/outbound/sequence-step-editor';
import { DataGrid, DataGridRowAction } from '@/evo/data/data-grid';
import type { EvoDataGridColumn } from '@/evo/data/data-grid';
import { Field, OutboundSection } from '@/evo/outbound/section';
import { channelLabel, contactName } from '@/evo/outbound/status';
import type { SequenceStepRow } from '@/evo/outbound/types';
import { Button } from '@/evo/ui/button';
import { Input } from '@/evo/ui/input';
import { NativeSelect } from '@/evo/ui/native-select';
import { Status } from '@/evo/ui/status';
import { t } from '@/lib/i18n';

type EnrollmentRow = {
    id: number;
    status: string;
    next_step: number;
    next_run_at?: string | null;
    contact?: {
        id: number;
        first_name: string;
        last_name?: string | null;
        email?: string | null;
    } | null;
};

type TemplateRow = {
    id: number;
    name: string;
    subject?: string | null;
    body: string;
};

type ContactRow = {
    id: number;
    first_name: string;
    last_name?: string | null;
    email?: string | null;
};

type MailboxRow = { id: number; name: string; from_address: string };
type FilterRow = { id: number; name: string };

export default function SequenceShow({
    sequence,
    contacts,
    templates,
    mailboxes,
    filters,
    stepAnalytics = [],
    quietHours,
    warmup,
}: {
    sequence: {
        id: number;
        name: string;
        channel: string;
        email_verification_policy?: string;
        active: boolean;
        description?: string | null;
        steps: SequenceStepRow[];
        enrollments: EnrollmentRow[];
    };
    contacts: ContactRow[];
    templates: TemplateRow[];
    mailboxes: MailboxRow[];
    filters: FilterRow[];
    stepAnalytics?: Array<{
        position: number;
        name: string;
        enrolled: number;
        sent: number;
        step_type: string;
    }>;
    quietHours?: {
        starts_at: string;
        ends_at: string;
        timezone: string;
        enabled: boolean;
    } | null;
    warmup?: { warming: number; total: number } | null;
}) {
    const [selected, setSelected] = useState<number[]>([]);
    const [editingSequence, setEditingSequence] = useState(false);
    const [tab, setTab] = useState<'steps' | 'enroll' | 'settings'>('steps');

    const toggleContact = (id: number) =>
        setSelected((current) =>
            current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
        );

    const enrollmentColumns: EvoDataGridColumn<EnrollmentRow>[] = [
        {
            id: 'contact',
            header: t('Contact'),
            accessorFn: (row) => contactName(row.contact),
            cell: ({ row }) => {
                const name = contactName(row.original.contact) || t('Contact');

                return (
                    <div>
                        {row.original.contact ? (
                            <button
                                type="button"
                                className="font-medium text-[var(--evo-ink)] underline-offset-2 hover:underline"
                                onClick={() => router.visit(`/crm/contacts/${row.original.contact?.id}`)}
                            >
                                {name}
                            </button>
                        ) : (
                            <span className="font-medium text-[var(--evo-ink)]">{name}</span>
                        )}
                        <span className="block text-[11px] text-[var(--evo-ink-muted)]">
                            {row.original.contact?.email ?? '—'}
                        </span>
                    </div>
                );
            },
        },
        {
            id: 'status',
            header: t('Status'),
            accessorFn: (row) => row.status,
            cell: ({ row }) => <Status tone={row.original.status === 'active' ? 'success' : 'neutral'} label={t(row.original.status)} />,
        },
        {
            id: 'next',
            header: t('Next step'),
            accessorFn: (row) => row.next_step,
            cell: ({ row }) => <span className="tabular-nums">{row.original.next_step}</span>,
        },
        {
            id: 'run',
            header: t('Next run'),
            accessorFn: (row) => row.next_run_at ?? '—',
        },
    ];

    return (
        <OutboundShell title={sequence.name}>
            <OutboundPage
                title={sequence.name}
                description={t(':channel · :state', {
                    channel: channelLabel(sequence.channel),
                    state: sequence.active
                        ? t('active - the runner sends due steps every minute')
                        : t('draft - activate to start sending'),
                })}
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={() => setEditingSequence((current) => !current)}>
                            {editingSequence ? t('Close edit') : t('Edit')}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.post(`/outbound/sequences/${sequence.id}/toggle`)}
                        >
                            {sequence.active ? t('Pause sequence') : t('Activate sequence')}
                        </Button>
                    </div>
                }
            >
                {editingSequence ? (
                    <OutboundSection title={t('Edit sequence')}>
                        <Form
                            action={`/outbound/sequences/${sequence.id}`}
                            method="put"
                            className="grid gap-3 md:grid-cols-3"
                        >
                            {({ processing }) => (
                                <>
                                    <Field label={t('Name')}>
                                        <Input name="name" required defaultValue={sequence.name} />
                                    </Field>
                                    <Field label={t('Description')} className="md:col-span-2">
                                        <Input name="description" defaultValue={sequence.description ?? ''} />
                                    </Field>
                                    <Field label={t('Uncertain email policy')}>
                                        <NativeSelect name="email_verification_policy" defaultValue={sequence.email_verification_policy ?? 'strict'}>
                                            <option value="strict">{t('Strict — verified results only')}</option>
                                            <option value="allow_catch_all">{t('Allow catch-all if deployment permits')}</option>
                                            <option value="allow_unknown">{t('Allow unknown if deployment permits')}</option>
                                            <option value="allow_uncertain">{t('Allow uncertain results if deployment permits')}</option>
                                        </NativeSelect>
                                    </Field>
                                    <div className="flex items-end">
                                        <Button disabled={processing} size="sm">
                                            {t('Save')}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </OutboundSection>
                ) : null}

                {stepAnalytics.length > 0 && tab === 'steps' ? (
                    <OutboundSection title={t('Step funnel')}>
                        <ul className="divide-y divide-[var(--evo-hairline)]">
                            {stepAnalytics.map((row) => (
                                <li
                                    key={row.position}
                                    className="flex items-center justify-between py-2.5"
                                >
                                    <span className="text-[13px] text-[var(--evo-ink)]">
                                        {t('Step :position: :name (:type)', {
                                            position: row.position,
                                            name: row.name,
                                            type: row.step_type,
                                        })}
                                    </span>
                                    <span className="text-[12px] text-[var(--evo-ink-muted)] tabular-nums">
                                        {t(':enrolled enrolled · :sent sent', {
                                            enrolled: row.enrolled,
                                            sent: row.sent,
                                        })}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </OutboundSection>
                ) : null}

                <div className="flex gap-1 border-b border-[var(--evo-hairline)]">
                    {(
                        [
                            ['steps', t('Steps')],
                            ['enroll', t('Enroll')],
                            ['settings', t('Settings')],
                        ] as const
                    ).map(([key, label]) => (
                        <Button
                            key={key}
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-pressed={tab === key}
                            className={
                                tab === key
                                    ? 'rounded-none border-b-2 border-[var(--evo-teal)]'
                                    : 'rounded-none'
                            }
                            onClick={() => setTab(key)}
                        >
                            {label}
                        </Button>
                    ))}
                </div>

                {tab === 'steps' ? (
                    <OutboundSection title={t('Step editor')}>
                        <SequenceStepEditor
                            sequenceId={sequence.id}
                            steps={sequence.steps ?? []}
                            mailboxes={mailboxes}
                            templates={templates}
                            defaultChannel={sequence.channel}
                        />
                    </OutboundSection>
                ) : null}

                {tab === 'enroll' ? (
                    <>
                        <OutboundSection title={t('Enroll contacts')}>
                            {(sequence.enrollments ?? []).length === 0 ? (
                                <div className="mb-4 rounded-[var(--evo-radius-standard)] border border-[var(--evo-hairline)] p-3">
                                    <p className="text-[13px] text-[var(--evo-ink)]">
                                        {t(
                                            'Nobody enrolled yet. Enroll contacts below or auto-enroll when a segment is entered.',
                                        )}
                                    </p>
                                    <Link
                                        href="/crm/workflows"
                                        className="mt-2 inline-flex text-[13px] font-medium text-[var(--evo-ink)] hover:underline"
                                    >
                                        {t('Create workflow')}
                                    </Link>
                                </div>
                            ) : null}
                            {filters.length > 0 ? (
                                <Form
                                    action={`/outbound/sequences/${sequence.id}/enroll`}
                                    method="post"
                                    className="mb-4"
                                >
                                    {({ processing }) => (
                                        <div className="flex flex-wrap items-end gap-3 rounded-[var(--evo-radius-standard)] border border-[var(--evo-hairline)] p-3">
                                            <Field label={t('Enroll a CRM list')}>
                                                <NativeSelect
                                                    name="saved_filter_id"
                                                    className="md:w-72"
                                                    required
                                                >
                                                    <option value="">{t('Pick a saved list…')}</option>
                                                    {filters.map((filter) => (
                                                        <option key={filter.id} value={filter.id}>
                                                            {filter.name}
                                                        </option>
                                                    ))}
                                                </NativeSelect>
                                            </Field>
                                            <Button variant="outline" disabled={processing}>
                                                {t('Enroll list')}
                                            </Button>
                                            <p className="text-[12px] text-[var(--evo-ink-muted)]">
                                                {t(
                                                    'Lists come from the CRM contacts hub (saved filters). Suppressed contacts are skipped.',
                                                )}
                                            </p>
                                        </div>
                                    )}
                                </Form>
                            ) : null}
                            <Form
                                action={`/outbound/sequences/${sequence.id}/enroll`}
                                method="post"
                            >
                                {({ processing }) => (
                                    <>
                                        <div className="grid max-h-56 gap-1 overflow-y-auto rounded-[var(--evo-radius-standard)] border border-[var(--evo-hairline)] p-2 md:grid-cols-3">
                                            {contacts.map((contact) => (
                                                <label
                                                    key={contact.id}
                                                    className="flex items-center gap-2 rounded-[var(--evo-radius-compact)] px-2 py-1.5 text-[13px] hover:bg-[var(--evo-hover)]"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="contact_ids[]"
                                                        value={contact.id}
                                                        checked={selected.includes(contact.id)}
                                                        onChange={() => toggleContact(contact.id)}
                                                        className="size-4 accent-[var(--evo-teal)]"
                                                    />
                                                    <span>
                                                        {contact.first_name} {contact.last_name}
                                                        <span className="block text-[11px] text-[var(--evo-ink-muted)]">
                                                            {contact.email ?? t('no email')}
                                                        </span>
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                        <div className="mt-3 flex items-center gap-3">
                                            <Button disabled={processing || selected.length === 0}>
                                                {selected.length > 0
                                                    ? t('Enroll :count contact(s)', { count: selected.length })
                                                    : t('Enroll')}
                                            </Button>
                                            <p className="text-[12px] text-[var(--evo-ink-muted)]">
                                                {t(
                                                    'Suppressed contacts are skipped. The runner sends step 1 immediately unless quiet hours defer it.',
                                                )}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </OutboundSection>

                        <DataGrid
                            columns={enrollmentColumns}
                            data={sequence.enrollments ?? []}
                            getRowId={(row) => String(row.id)}
                            density="compact"
                            enableSelection={false}
                            emptyTitle={t('Nobody enrolled yet.')}
                            rowActions={(enrollment) => (
                                <>
                                    {enrollment.status === 'active' ? (
                                        <DataGridRowAction
                                            onClick={() =>
                                                router.post(`/outbound/enrollments/${enrollment.id}/pause`)
                                            }
                                        >
                                            {t('Pause')}
                                        </DataGridRowAction>
                                    ) : null}
                                    {enrollment.status === 'paused' ? (
                                        <DataGridRowAction
                                            onClick={() =>
                                                router.post(`/outbound/enrollments/${enrollment.id}/resume`)
                                            }
                                        >
                                            {t('Resume')}
                                        </DataGridRowAction>
                                    ) : null}
                                    {['active', 'paused'].includes(enrollment.status) ? (
                                        <DataGridRowAction
                                            onClick={() =>
                                                router.post(`/outbound/enrollments/${enrollment.id}/cancel`)
                                            }
                                        >
                                            {t('Cancel')}
                                        </DataGridRowAction>
                                    ) : null}
                                </>
                            )}
                        />
                    </>
                ) : null}

                {tab === 'settings' ? (
                    <OutboundSection title={t('Send settings')}>
                        <p className="text-[13px] text-[var(--evo-ink)]">
                            {t('Warmup: :warming of :total mailboxes warming. Quiet hours: :quiet.', {
                                warming: warmup?.warming ?? t('not loaded'),
                                total: warmup?.total ?? '—',
                                quiet: quietHours?.enabled
                                    ? t(':start–:end :tz', {
                                          start: quietHours.starts_at,
                                          end: quietHours.ends_at,
                                          tz: quietHours.timezone,
                                      })
                                    : t('off'),
                            })}
                        </p>
                        <div className="mt-2 flex gap-3 text-[13px]">
                            <Link
                                href="/outbound/warmup"
                                className="font-medium text-[var(--evo-ink)] hover:underline"
                            >
                                {t('Warmup')}
                            </Link>
                            <Link
                                href="/outbound/quiet-hours"
                                className="font-medium text-[var(--evo-ink)] hover:underline"
                            >
                                {t('Quiet hours')}
                            </Link>
                        </div>
                    </OutboundSection>
                ) : null}
            </OutboundPage>
        </OutboundShell>
    );
}

SequenceShow.layout = {
    breadcrumbs: [
        { title: t('Sequences'), href: '/outbound/sequences' },
        { title: t('Sequence'), href: '#' },
    ],
};
