import { Form, Head, router } from '@inertiajs/react';
import { useState } from 'react';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
            <div>
                <Label>Delay (hours)</Label>
                <Input
                    name="delay_hours"
                    type="number"
                    min={0}
                    defaultValue={step?.delay_hours ?? 24}
                    required
                />
            </div>
            <div>
                <Label>Channel</Label>
                <select
                    name="channel"
                    defaultValue={step?.channel ?? defaultChannel}
                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                >
                    <option value="email">Email</option>
                    <option value="whatsapp_cloud">
                        WhatsApp Cloud template
                    </option>
                </select>
            </div>
            <div>
                <Label>Mailbox</Label>
                <select
                    name="mailbox_id"
                    defaultValue={
                        step?.mailbox_id ? String(step.mailbox_id) : ''
                    }
                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                >
                    <option value="">Default enabled mailbox</option>
                    {mailboxes.map((box) => (
                        <option key={box.id} value={box.id}>
                            {box.name} — {box.from_address}
                        </option>
                    ))}
                </select>
            </div>
            <div className="md:col-span-3">
                <Label>Subject</Label>
                <Input
                    name="subject"
                    placeholder="Email subject"
                    defaultValue={step?.subject ?? ''}
                />
            </div>
            <div className="md:col-span-3">
                <Label>
                    Body — variables:{' '}
                    {
                        '{{first_name}} {{last_name}} {{name}} {{email}} {{phone}} {{company}} {{city}} {{wilaya}} {{unsub}}'
                    }
                </Label>
                <textarea
                    name="body"
                    rows={4}
                    placeholder="Bonjour {{first_name}}, …"
                    defaultValue={step?.body ?? ''}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
            </div>
            <div>
                <Label>WA template name</Label>
                <Input
                    name="wa_template_name"
                    placeholder="hello_world"
                    defaultValue={step?.wa_template_name ?? ''}
                />
            </div>
            <div>
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
        <>
            <Head title={sequence.name} />
            <div className="flex-1 space-y-6 p-6">
                <PageHeader
                    title={sequence.name}
                    description={`Channel: ${sequence.channel} · ${sequence.active ? 'active — the runner sends due steps every minute' : 'draft — activate to start sending'}`}
                >
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
                </PageHeader>

                {editingSequence ? (
                    <Card className="p-4">
                        <h2 className="mb-3 font-medium">Edit sequence</h2>
                        <Form
                            action={`/outbound/sequences/${sequence.id}`}
                            method="put"
                            className="grid gap-3 md:grid-cols-3"
                        >
                            {({ processing }) => (
                                <>
                                    <div>
                                        <Label>Name</Label>
                                        <Input
                                            name="name"
                                            required
                                            defaultValue={sequence.name}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
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
                    </Card>
                ) : null}

                <Card className="p-4">
                    <h2 className="mb-3 font-medium">Steps</h2>
                    <div className="space-y-2 text-sm">
                        {(sequence.steps ?? []).map((step) => (
                            <div
                                key={step.id}
                                className="rounded-md border border-hairline px-3 py-2"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-medium">
                                            Step {step.position} · +
                                            {step.delay_hours}h · {step.channel}
                                            {step.mailbox ? (
                                                <span className="text-muted-foreground">
                                                    {' '}
                                                    · via {step.mailbox.name}
                                                </span>
                                            ) : null}
                                        </p>
                                        {step.subject ? (
                                            <p className="text-muted-foreground">
                                                Subject: {step.subject}
                                            </p>
                                        ) : null}
                                        {step.body ? (
                                            <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                                                {step.body}
                                            </p>
                                        ) : null}
                                        {step.wa_template_name ? (
                                            <p className="text-muted-foreground">
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
                            <p className="text-muted-foreground">
                                No steps — add the first one below.
                            </p>
                        ) : null}
                    </div>
                </Card>

                <Card className="p-4">
                    <h2 className="mb-3 font-medium">Add step</h2>
                    {templates.length > 0 && sequence.channel === 'email' ? (
                        <div className="mb-3">
                            <Label>Prefill from template</Label>
                            <select
                                value={templateId}
                                onChange={(event) =>
                                    setTemplateId(event.target.value)
                                }
                                className="h-9 w-full rounded-md border bg-background px-2 text-sm md:w-72"
                            >
                                <option value="">No template</option>
                                {templates.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
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
                </Card>

                <Card className="p-4">
                    <h2 className="mb-3 font-medium">Enroll contacts</h2>
                    {filters.length > 0 ? (
                        <Form
                            action={`/outbound/sequences/${sequence.id}/enroll`}
                            method="post"
                            className="mb-4"
                        >
                            {({ processing }) => (
                                <div className="flex flex-wrap items-end gap-3 rounded-md border border-hairline p-3">
                                    <div>
                                        <Label>Enroll a CRM list</Label>
                                        <select
                                            name="saved_filter_id"
                                            className="h-9 w-full rounded-md border bg-background px-2 text-sm md:w-72"
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
                                        </select>
                                    </div>
                                    <Button
                                        variant="outline"
                                        disabled={processing}
                                    >
                                        Enroll list
                                    </Button>
                                    <p className="text-xs text-muted-foreground">
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
                                <div className="grid max-h-56 gap-1 overflow-y-auto rounded-md border border-hairline p-2 md:grid-cols-3">
                                    {contacts.map((contact) => (
                                        <label
                                            key={contact.id}
                                            className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted/40"
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
                                            />
                                            <span>
                                                {contact.first_name}{' '}
                                                {contact.last_name}
                                                <span className="block text-xs text-muted-foreground">
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
                                    <p className="text-xs text-muted-foreground">
                                        Suppressed contacts are skipped. The
                                        runner sends step 1 immediately unless
                                        quiet hours defer it.
                                    </p>
                                </div>
                            </>
                        )}
                    </Form>
                </Card>

                <Card className="overflow-hidden">
                    <h2 className="border-b border-hairline px-4 py-2 text-sm font-medium">
                        Enrollments
                    </h2>
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-2">Contact</th>
                                <th className="px-4 py-2">Status</th>
                                <th className="px-4 py-2">Next step</th>
                                <th className="px-4 py-2">Next run</th>
                                <th className="px-4 py-2"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {(sequence.enrollments ?? []).length === 0 ? (
                                <tr>
                                    <td
                                        className="px-4 py-6 text-muted-foreground"
                                        colSpan={5}
                                    >
                                        Nobody enrolled yet.
                                    </td>
                                </tr>
                            ) : (
                                (sequence.enrollments ?? []).map(
                                    (enrollment) => (
                                        <tr
                                            key={enrollment.id}
                                            className="border-t border-hairline"
                                        >
                                            <td className="px-4 py-2">
                                                {enrollment.contact?.first_name}{' '}
                                                {enrollment.contact?.last_name}
                                                <span className="block text-xs text-muted-foreground">
                                                    {enrollment.contact
                                                        ?.email ?? '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2">
                                                <Badge
                                                    variant={
                                                        enrollment.status ===
                                                        'active'
                                                            ? 'default'
                                                            : enrollment.status ===
                                                                'finished'
                                                              ? 'secondary'
                                                              : 'outline'
                                                    }
                                                >
                                                    {enrollment.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-2">
                                                {enrollment.next_step}
                                            </td>
                                            <td className="px-4 py-2 text-xs text-muted-foreground">
                                                {enrollment.next_run_at ?? '—'}
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                {enrollment.status ===
                                                'active' ? (
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
                                                {enrollment.status ===
                                                'paused' ? (
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
                                                {['active', 'paused'].includes(
                                                    enrollment.status,
                                                ) ? (
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
                                            </td>
                                        </tr>
                                    ),
                                )
                            )}
                        </tbody>
                    </table>
                </Card>
            </div>
        </>
    );
}

SequenceShow.layout = {
    breadcrumbs: [
        { title: 'Sequences', href: '/outbound/sequences' },
        { title: 'Sequence', href: '#' },
    ],
};
