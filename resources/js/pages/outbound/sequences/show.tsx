import { Form, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { HairlinePanel, HairlineTable } from '@/components/crm/hairline-table';
import { OutboundPage, OutboundShell } from '@/components/crm/outbound-shell';
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
    mailbox_id?: number | null;
    subject?: string | null;
    body?: string | null;
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
                    <option value="whatsapp_cloud">WhatsApp Cloud template</option>
                </NativeSelect>
            </div>
            <div className="space-y-1.5">
                <Label>Mailbox</Label>
                <NativeSelect
                    name="mailbox_id"
                    defaultValue={step?.mailbox_id ? String(step.mailbox_id) : ''}
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
}) {
    const [selected, setSelected] = useState<number[]>([]);
    const [templateId, setTemplateId] = useState<string>('');
    const [editingStep, setEditingStep] = useState<number | null>(null);
    const [editingSequence, setEditingSequence] = useState(false);

    const template = templates.find((t) => String(t.id) === templateId);

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

                {stepAnalytics.length > 0 ? (
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
                                    <span className="aurora-text-caption money tabular-nums text-mute">
                                        {row.enrolled} enrolled · {row.sent}{' '}
                                        sent
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </HairlinePanel>
                ) : null}

                <HairlinePanel title="Steps">
                    <div className="space-y-2">
                        {(sequence.steps ?? []).map((step) => (
                            <div
                                key={step.id}
                                className="rounded-xl border border-hairline px-3 py-2.5"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="aurora-text-body-sm font-medium text-ink">
                                            Step {step.position} · +
                                            {step.delay_hours}h ·{' '}
                                            {channelLabel(step.channel)}
                                            {step.mailbox ? (
                                                <span className="text-mute">
                                                    {' '}
                                                    · via {step.mailbox.name}
                                                </span>
                                            ) : null}
                                        </p>
                                        {step.subject ? (
                                            <p className="aurora-text-caption mt-0.5 text-mute">
                                                Subject: {step.subject}
                                            </p>
                                        ) : null}
                                        {step.body ? (
                                            <p className="aurora-text-body-sm mt-1 whitespace-pre-wrap text-mute">
                                                {step.body}
                                            </p>
                                        ) : null}
                                        {step.wa_template_name ? (
                                            <p className="aurora-text-caption text-mute">
                                                Template {step.wa_template_name}{' '}
                                                (
                                                {step.wa_template_language ??
                                                    'fr'}
                                                )
                                            </p>
                                        ) : null}
                                    </div>
                                    <div className="flex flex-shrink-0 items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                setEditingStep((current) =>
                                                    current === step.id
                                                        ? null
                                                        : step.id,
                                                )
                                            }
                                        >
                                            {editingStep === step.id
                                                ? 'Close'
                                                : 'Edit'}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-brand"
                                            onClick={() =>
                                                router.delete(
                                                    `/outbound/sequences/${sequence.id}/steps/${step.id}`,
                                                )
                                            }
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                                {editingStep === step.id ? (
                                    <Form
                                        action={`/outbound/sequences/${sequence.id}/steps/${step.id}`}
                                        method="put"
                                        className="mt-3 grid gap-3 border-t border-hairline pt-3 md:grid-cols-3"
                                    >
                                        {({ processing }) => (
                                            <>
                                                <StepFields
                                                    step={step}
                                                    mailboxes={mailboxes}
                                                    defaultChannel={
                                                        sequence.channel
                                                    }
                                                />
                                                <div className="flex items-end">
                                                    <Button
                                                        size="sm"
                                                        disabled={processing}
                                                    >
                                                        Save step
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </Form>
                                ) : null}
                            </div>
                        ))}
                        {(sequence.steps ?? []).length === 0 ? (
                            <p className="aurora-text-body-sm text-mute">
                                No steps - add the first one below.
                            </p>
                        ) : null}
                    </div>
                </HairlinePanel>

                <HairlinePanel title="Add step">
                    {templates.length > 0 && sequence.channel === 'email' ? (
                        <div className="mb-3 space-y-1.5">
                            <Label>Prefill from template</Label>
                            <NativeSelect
                                value={templateId}
                                onChange={(event) =>
                                    setTemplateId(event.target.value)
                                }
                                className="md:w-72"
                            >
                                <option value="">No template</option>
                                {templates.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}
                                    </option>
                                ))}
                            </NativeSelect>
                        </div>
                    ) : null}
                    <Form
                        action={`/outbound/sequences/${sequence.id}/steps`}
                        method="post"
                        className="grid gap-3 md:grid-cols-3"
                        resetOnSuccess
                    >
                        {({ processing }) => (
                            <>
                                <input
                                    type="hidden"
                                    name="template_id"
                                    value={templateId}
                                />
                                <StepFields
                                    mailboxes={mailboxes}
                                    defaultChannel={sequence.channel}
                                    step={
                                        template
                                            ? {
                                                  id: 0,
                                                  position: 0,
                                                  delay_hours: 24,
                                                  channel: sequence.channel,
                                                  subject: template.subject,
                                                  body: template.body,
                                              }
                                            : undefined
                                    }
                                    key={template?.id ?? 'blank'}
                                />
                                <div className="flex items-end">
                                    <Button disabled={processing}>
                                        Add step
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </HairlinePanel>

                <HairlinePanel title="Enroll contacts">
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
                        const name = `${enrollment.contact?.first_name ?? ''} ${enrollment.contact?.last_name ?? ''}`.trim();

                        return {
                            id: enrollment.id,
                            mobileTitle: name || enrollment.contact?.email || 'Contact',
                            mobileMeta: [
                                { label: 'Status', value: enrollment.status },
                                { label: 'Next step', value: enrollment.next_step },
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
