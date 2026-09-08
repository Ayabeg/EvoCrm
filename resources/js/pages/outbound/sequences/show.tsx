import { Form, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { HairlinePanel, HairlineTable } from '@/components/crm/hairline-table';
import { OutboundPage, OutboundShell } from '@/components/crm/outbound-shell';
import SequenceStepEditor from '@/components/outbound/sequence-step-editor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';

type Step = {
    id: number;
    position: number;
    delay_hours: number;
    channel: string;
    step_type?: string | null;
    mailbox_id?: number | null;
    subject?: string | null;
    subject_b?: string | null;
    body?: string | null;
    meeting_url?: string | null;
    wa_template_name?: string | null;
    wa_template_language?: string | null;
    mailbox?: { id: number; name: string } | null;
};

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

function channelLabel(channel: string): string {
    return channel === 'whatsapp_cloud' ? 'WhatsApp Cloud' : 'Email';
}

function StepFields({
    step,
    mailboxes,
    defaultChannel,
}: {
    step?: Step;
    mailboxes: MailboxRow[];
    defaultChannel: string;
}) {
    return (
        <>
            <div className="space-y-1.5">
                <Label>Delay (hours)</Label>
                <Input
                    name="delay_hours"
                    type="number"
                    min={0}
                    defaultValue={step?.delay_hours ?? 24}
                    required
                />
            </div>
            <div className="space-y-1.5">
                <Label>Channel</Label>
                <NativeSelect
                    name="channel"
                    defaultValue={step?.channel ?? defaultChannel}
                >
                    <option value="email">Email</option>
                    <option value="whatsapp_cloud">
                        WhatsApp Cloud template
                    </option>
                </NativeSelect>
            </div>
            <div className="space-y-1.5">
                <Label>Mailbox</Label>
                <NativeSelect
                    name="mailbox_id"
                    defaultValue={
                        step?.mailbox_id ? String(step.mailbox_id) : ''
                    }
                >
                    <option value="">Default enabled mailbox</option>
                    {mailboxes.map((box) => (
                        <option key={box.id} value={box.id}>
                            {box.name} - {box.from_address}
                        </option>
                    ))}
                </NativeSelect>
            </div>
            <div className="space-y-1.5 md:col-span-3">
                <Label>Subject</Label>
                <Input
                    name="subject"
                    placeholder="Email subject"
                    defaultValue={step?.subject ?? ''}
                />
            </div>
            <div className="space-y-1.5 md:col-span-3">
                <Label>
                    Body (variables:{' '}
                    {
                        '{{first_name}} {{last_name}} {{name}} {{email}} {{phone}} {{company}} {{city}} {{wilaya}} {{unsub}}'
                    }
                    )
                </Label>
                <Textarea
                    name="body"
                    rows={4}
                    placeholder="Bonjour {{first_name}}, …"
                    defaultValue={step?.body ?? ''}
                />
            </div>
            <div className="space-y-1.5">
                <Label>WA template name</Label>
                <Input
                    name="wa_template_name"
                    placeholder="hello_world"
                    defaultValue={step?.wa_template_name ?? ''}
                />
            </div>
            <div className="space-y-1.5">
                <Label>WA language</Label>
                <Input
                    name="wa_template_language"
                    defaultValue={step?.wa_template_language ?? 'fr'}
                />
            </div>
        </>
    );
}

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
        active: boolean;
        description?: string | null;
        steps: Step[];
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
            current.includes(id)
                ? current.filter((c) => c !== id)
                : [...current, id],
        );

    return (
        <OutboundShell title={sequence.name}>
            <OutboundPage
                title={sequence.name}
                description={`${channelLabel(sequence.channel)} · ${sequence.active ? 'active - the runner sends due steps every minute' : 'draft - activate to start sending'}`}
                actions={
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            onClick={() =>
                                setEditingSequence((current) => !current)
                            }
                        >
                            {editingSequence ? 'Close edit' : 'Edit'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() =>
                                router.post(
                                    `/outbound/sequences/${sequence.id}/toggle`,
                                )
                            }
                        >
                            {sequence.active
                                ? 'Pause sequence'
                                : 'Activate sequence'}
                        </Button>
                    </div>
                }
            >
                {editingSequence ? (
                    <HairlinePanel title="Edit sequence">
                        <Form
                            action={`/outbound/sequences/${sequence.id}`}
                            method="put"
                            className="grid gap-3 md:grid-cols-3"
                        >
                            {({ processing }) => (
                                <>
                                    <div className="space-y-1.5">
                                        <Label>Name</Label>
                                        <Input
                                            name="name"
                                            required
                                            defaultValue={sequence.name}
                                        />
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                        <Label>Description</Label>
                                        <Input
                                            name="description"
                                            defaultValue={
                                                sequence.description ?? ''
                                            }
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <Button disabled={processing} size="sm">
                                            Save
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </HairlinePanel>
                ) : null}

                {stepAnalytics.length > 0 && tab === 'steps' ? (
                    <HairlinePanel title="Step funnel" padded={false}>
                        <ul className="divide-y divide-hairline">
                            {stepAnalytics.map((row) => (
                                <li
                                    key={row.position}
                                    className="flex items-center justify-between px-4 py-2.5"
                                >
                                    <span className="aurora-text-body-sm text-ink">
                                        Step {row.position}: {row.name} (
                                        {row.step_type})
                                    </span>
                                    <span className="aurora-text-caption money text-mute tabular-nums">
                                        {row.enrolled} enrolled · {row.sent}{' '}
                                        sent
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </HairlinePanel>
                ) : null}

                <div className="flex gap-1 border-b border-hairline">
                    {(
                        [
                            ['steps', 'Steps'],
                            ['enroll', 'Enroll'],
                            ['settings', 'Settings'],
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
                                    ? 'rounded-none border-b-2 border-brand'
                                    : 'rounded-none'
                            }
                            onClick={() => setTab(key)}
                        >
                            {label}
                        </Button>
                    ))}
                </div>

                {tab === 'steps' ? (
                    <HairlinePanel title="Step editor">
                        <SequenceStepEditor
                            sequenceId={sequence.id}
                            steps={sequence.steps ?? []}
                            mailboxes={mailboxes}
                            templates={templates}
                            defaultChannel={sequence.channel}
                        />
                    </HairlinePanel>
                ) : null}

                {tab === 'enroll' ? (
                    <>
                <HairlinePanel title="Enroll contacts">
                    {(sequence.enrollments ?? []).length === 0 ? (
                        <div className="mb-4 rounded-[var(--radius-1)] border border-hairline p-3">
                            <p className="text-[13px] text-ink">
                                Nobody enrolled yet. Enroll contacts below or
                                auto-enroll when a segment is entered.
                            </p>
                            <Link
                                href="/crm/workflows"
                                className="mt-2 inline-flex text-[13px] font-medium text-ink hover:underline"
                            >
                                Create workflow
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
                                <div className="flex flex-wrap items-end gap-3 rounded-xl border border-hairline p-3">
                                    <div className="space-y-1.5">
                                        <Label>Enroll a CRM list</Label>
                                        <NativeSelect
                                            name="saved_filter_id"
                                            className="md:w-72"
                                            required
                                        >
                                            <option value="">
                                                Pick a saved list…
                                            </option>
                                            {filters.map((filter) => (
                                                <option
                                                    key={filter.id}
                                                    value={filter.id}
                                                >
                                                    {filter.name}
                                                </option>
                                            ))}
                                        </NativeSelect>
                                    </div>
                                    <Button
                                        variant="outline"
                                        disabled={processing}
                                    >
                                        Enroll list
                                    </Button>
                                    <p className="aurora-text-caption text-mute">
                                        Lists come from the CRM contacts hub
                                        (saved filters). Suppressed contacts are
                                        skipped.
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
                                <div className="grid max-h-56 gap-1 overflow-y-auto rounded-xl border border-hairline p-2 md:grid-cols-3">
                                    {contacts.map((contact) => (
                                        <label
                                            key={contact.id}
                                            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-canvas-soft"
                                        >
                                            <input
                                                type="checkbox"
                                                name="contact_ids[]"
                                                value={contact.id}
                                                checked={selected.includes(
                                                    contact.id,
                                                )}
                                                onChange={() =>
                                                    toggleContact(contact.id)
                                                }
                                                className="size-4 accent-[var(--evosales-mark)]"
                                            />
                                            <span>
                                                {contact.first_name}{' '}
                                                {contact.last_name}
                                                <span className="block text-xs text-mute">
                                                    {contact.email ??
                                                        'no email'}
                                                </span>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                <div className="mt-3 flex items-center gap-3">
                                    <Button
                                        disabled={
                                            processing || selected.length === 0
                                        }
                                    >
                                        Enroll{' '}
                                        {selected.length > 0
                                            ? `${selected.length} contact(s)`
                                            : ''}
                                    </Button>
                                    <p className="aurora-text-caption text-mute">
                                        Suppressed contacts are skipped. The
                                        runner sends step 1 immediately unless
                                        quiet hours defer it.
                                    </p>
                                </div>
                            </>
                        )}
                    </Form>
                </HairlinePanel>

                <HairlineTable
                    minWidth={640}
                    empty="Nobody enrolled yet."
                    columns={[
                        { key: 'contact', header: 'Contact' },
                        { key: 'status', header: 'Status' },
                        { key: 'next', header: 'Next step' },
                        { key: 'run', header: 'Next run' },
                        { key: 'actions', header: '', align: 'right' },
                    ]}
                    rows={(sequence.enrollments ?? []).map((enrollment) => {
                        const name =
                            `${enrollment.contact?.first_name ?? ''} ${enrollment.contact?.last_name ?? ''}`.trim();

                        return {
                            id: enrollment.id,
                            mobileTitle:
                                name || enrollment.contact?.email || 'Contact',
                            mobileMeta: [
                                { label: 'Status', value: enrollment.status },
                                {
                                    label: 'Next step',
                                    value: enrollment.next_step,
                                },
                                {
                                    label: 'Next run',
                                    value: enrollment.next_run_at ?? '-',
                                },
                            ],
                            mobileFooter: (
                                <EnrollmentActions enrollment={enrollment} />
                            ),
                            cells: {
                                contact: (
                                    <div>
                                        {enrollment.contact ? (
                                            <Link
                                                href={`/crm/contacts/${enrollment.contact.id}`}
                                                className="font-medium text-brand hover:underline"
                                            >
                                                {name}
                                            </Link>
                                        ) : (
                                            <span className="font-medium text-ink">
                                                {name || 'Contact'}
                                            </span>
                                        )}
                                        <span className="aurora-text-caption block text-mute">
                                            {enrollment.contact?.email ?? '-'}
                                        </span>
                                    </div>
                                ),
                                status: (
                                    <Badge
                                        variant={
                                            enrollment.status === 'active'
                                                ? 'default'
                                                : enrollment.status ===
                                                    'finished'
                                                  ? 'secondary'
                                                  : 'outline'
                                        }
                                    >
                                        {enrollment.status}
                                    </Badge>
                                ),
                                next: (
                                    <span className="money tabular-nums">
                                        {enrollment.next_step}
                                    </span>
                                ),
                                run: (
                                    <span className="aurora-text-caption text-mute">
                                        {enrollment.next_run_at ?? '-'}
                                    </span>
                                ),
                                actions: (
                                    <EnrollmentActions
                                        enrollment={enrollment}
                                    />
                                ),
                            },
                        };
                    })}
                />
                    </>
                ) : null}

                {tab === 'settings' ? (
                    <HairlinePanel title="Send settings">
                        <p className="text-[13px] text-ink">
                            Warmup:{' '}
                            {warmup
                                ? `${warmup.warming} of ${warmup.total} mailboxes warming`
                                : 'not loaded'}
                            . Quiet hours:{' '}
                            {quietHours?.enabled
                                ? `${quietHours.starts_at}–${quietHours.ends_at} ${quietHours.timezone}`
                                : 'off'}
                            .
                        </p>
                        <div className="mt-2 flex gap-3 text-[13px]">
                            <Link
                                href="/outbound/warmup"
                                className="font-medium text-ink hover:underline"
                            >
                                Warmup
                            </Link>
                            <Link
                                href="/outbound/quiet-hours"
                                className="font-medium text-ink hover:underline"
                            >
                                Quiet hours
                            </Link>
                        </div>
                    </HairlinePanel>
                ) : null}
            </OutboundPage>
        </OutboundShell>
    );
}

function EnrollmentActions({ enrollment }: { enrollment: EnrollmentRow }) {
    return (
        <div className="mt-3 flex flex-wrap justify-end gap-1 @[480px]/hairline:mt-0">
            {enrollment.status === 'active' ? (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        router.post(
                            `/outbound/enrollments/${enrollment.id}/pause`,
                        )
                    }
                >
                    Pause
                </Button>
            ) : null}
            {enrollment.status === 'paused' ? (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        router.post(
                            `/outbound/enrollments/${enrollment.id}/resume`,
                        )
                    }
                >
                    Resume
                </Button>
            ) : null}
            {['active', 'paused'].includes(enrollment.status) ? (
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-brand"
                    onClick={() =>
                        router.post(
                            `/outbound/enrollments/${enrollment.id}/cancel`,
                        )
                    }
                >
                    Cancel
                </Button>
            ) : null}
        </div>
    );
}

SequenceShow.layout = {
    breadcrumbs: [
        { title: 'Sequences', href: '/outbound/sequences' },
        { title: 'Sequence', href: '#' },
    ],
};
