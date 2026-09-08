import { Form, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';

export type SequenceStepRow = {
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

type MailboxRow = { id: number; name: string; from_address: string };
type TemplateRow = { id: number; name: string; subject?: string | null; body: string };

const STEP_TYPES = [
    { value: 'email', label: 'Automated email' },
    { value: 'whatsapp_cloud', label: 'WhatsApp template' },
    { value: 'call', label: 'Call task' },
    { value: 'meeting', label: 'Meeting' },
] as const;

function typeLabel(step: SequenceStepRow): string {
    const type = step.step_type || step.channel;
    return STEP_TYPES.find((item) => item.value === type)?.label
        ?? (step.channel === 'whatsapp_cloud' ? 'WhatsApp template' : 'Automated email');
}

function channelFor(type: string): string {
    return type === 'whatsapp_cloud' ? 'whatsapp_cloud' : 'email';
}

export default function SequenceStepEditor({
    sequenceId,
    steps,
    mailboxes,
    templates,
    defaultChannel,
}: {
    sequenceId: number;
    steps: SequenceStepRow[];
    mailboxes: MailboxRow[];
    templates: TemplateRow[];
    defaultChannel: string;
}) {
    const [editing, setEditing] = useState<number | 'new' | null>(null);
    const [newType, setNewType] = useState(
        defaultChannel === 'whatsapp_cloud' ? 'whatsapp_cloud' : 'email',
    );
    const [templateId, setTemplateId] = useState('');
    const template = templates.find((item) => String(item.id) === templateId);

    return (
        <section data-testid="sequence-step-editor" className="space-y-4">
            <ol className="space-y-0">
                {steps.map((step, index) => (
                    <li key={step.id} className="relative pl-8">
                        {index < steps.length - 1 ? (
                            <span
                                className="absolute top-8 bottom-0 left-[11px] w-px bg-hairline"
                                aria-hidden
                            />
                        ) : null}
                        <span className="absolute top-3 left-0 flex size-6 items-center justify-center rounded-full border border-hairline bg-canvas text-[11px] font-medium text-ink">
                            {step.position}
                        </span>
                        <div className="mb-4 rounded-[var(--radius-1)] border border-hairline p-3">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[13px] font-medium text-ink">
                                        {typeLabel(step)}
                                        <span className="ml-2 text-[11px] font-normal text-mute">
                                            Wait {step.delay_hours}h
                                        </span>
                                    </p>
                                    {step.subject ? (
                                        <p className="mt-0.5 text-[12px] text-mute">
                                            A: {step.subject}
                                            {step.subject_b
                                                ? ` · B: ${step.subject_b}`
                                                : ''}
                                        </p>
                                    ) : null}
                                    {step.wa_template_name ? (
                                        <p className="text-[12px] text-mute">
                                            WA {step.wa_template_name} (
                                            {step.wa_template_language ?? 'fr'})
                                        </p>
                                    ) : null}
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            setEditing(
                                                editing === step.id
                                                    ? null
                                                    : step.id,
                                            )
                                        }
                                    >
                                        {editing === step.id ? 'Close' : 'Edit'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            router.delete(
                                                `/outbound/sequences/${sequenceId}/steps/${step.id}`,
                                            )
                                        }
                                    >
                                        Remove
                                    </Button>
                                </div>
                            </div>
                            {editing === step.id ? (
                                <StepForm
                                    action={`/outbound/sequences/${sequenceId}/steps/${step.id}`}
                                    method="put"
                                    step={step}
                                    mailboxes={mailboxes}
                                    templates={templates}
                                    submitLabel="Save step"
                                    onDone={() => setEditing(null)}
                                />
                            ) : null}
                        </div>
                    </li>
                ))}
            </ol>
            {steps.length === 0 ? (
                <p className="text-[13px] text-mute">
                    No steps yet. Add an automated email, call, meeting, or
                    WhatsApp template.
                </p>
            ) : null}

            {editing === 'new' ? (
                <div className="rounded-[var(--radius-1)] border border-hairline p-3">
                    <div className="mb-3 flex flex-wrap gap-2">
                        {STEP_TYPES.map((item) => (
                            <Button
                                key={item.value}
                                type="button"
                                size="sm"
                                variant={
                                    newType === item.value ? 'secondary' : 'ghost'
                                }
                                onClick={() => setNewType(item.value)}
                            >
                                {item.label}
                            </Button>
                        ))}
                    </div>
                    {newType === 'email' && templates.length > 0 ? (
                        <div className="mb-3 space-y-1.5">
                            <Label>Prefill from template</Label>
                            <NativeSelect
                                value={templateId}
                                onChange={(event) =>
                                    setTemplateId(event.target.value)
                                }
                            >
                                <option value="">From scratch</option>
                                {templates.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                            </NativeSelect>
                        </div>
                    ) : null}
                    <StepForm
                        action={`/outbound/sequences/${sequenceId}/steps`}
                        method="post"
                        step={{
                            id: 0,
                            position: steps.length + 1,
                            delay_hours: steps.length === 0 ? 0 : 24,
                            channel: channelFor(newType),
                            step_type: newType,
                            subject: template?.subject ?? '',
                            body: template?.body ?? '',
                        }}
                        mailboxes={mailboxes}
                        templates={templates}
                        templateId={templateId}
                        forcedType={newType}
                        submitLabel="Add step"
                        onDone={() => setEditing(null)}
                    />
                </div>
            ) : (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing('new')}
                >
                    Add step
                </Button>
            )}
        </section>
    );
}

function StepForm({
    action,
    method,
    step,
    mailboxes,
    templates,
    templateId,
    forcedType,
    submitLabel,
    onDone,
}: {
    action: string;
    method: 'post' | 'put';
    step: SequenceStepRow;
    mailboxes: MailboxRow[];
    templates: TemplateRow[];
    templateId?: string;
    forcedType?: string;
    submitLabel: string;
    onDone?: () => void;
}) {
    const type = forcedType || step.step_type || step.channel || 'email';

    return (
        <Form
            action={action}
            method={method}
            className="mt-3 grid gap-3 border-t border-hairline pt-3 md:grid-cols-2"
            resetOnSuccess={method === 'post'}
            onSuccess={onDone}
        >
            {({ processing }) => (
                <>
                    {templateId ? (
                        <input type="hidden" name="template_id" value={templateId} />
                    ) : null}
                    <input type="hidden" name="step_type" value={type} />
                    <input
                        type="hidden"
                        name="channel"
                        value={channelFor(type)}
                    />
                    <div className="space-y-1.5">
                        <Label>Wait (hours)</Label>
                        <Input
                            name="delay_hours"
                            type="number"
                            min={0}
                            defaultValue={step.delay_hours}
                            required
                        />
                    </div>
                    {type === 'email' ? (
                        <div className="space-y-1.5">
                            <Label>Mailbox</Label>
                            <NativeSelect
                                name="mailbox_id"
                                defaultValue={
                                    step.mailbox_id ? String(step.mailbox_id) : ''
                                }
                            >
                                <option value="">Default mailbox</option>
                                {mailboxes.map((box) => (
                                    <option key={box.id} value={box.id}>
                                        {box.name} — {box.from_address}
                                    </option>
                                ))}
                            </NativeSelect>
                        </div>
                    ) : (
                        <input type="hidden" name="mailbox_id" value="" />
                    )}
                    {type === 'email' ? (
                        <>
                            <div className="space-y-1.5">
                                <Label>Subject A</Label>
                                <Input
                                    name="subject"
                                    defaultValue={step.subject ?? ''}
                                    placeholder="Hello {{first_name}}"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Subject B (A/B)</Label>
                                <Input
                                    name="subject_b"
                                    defaultValue={step.subject_b ?? ''}
                                    placeholder="Optional variant"
                                />
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <Label>Body</Label>
                                <Textarea
                                    name="body"
                                    rows={4}
                                    defaultValue={step.body ?? ''}
                                    placeholder="Bonjour {{first_name}}, …"
                                />
                            </div>
                        </>
                    ) : null}
                    {type === 'whatsapp_cloud' ? (
                        <>
                            <div className="space-y-1.5">
                                <Label>WA template name</Label>
                                <Input
                                    name="wa_template_name"
                                    defaultValue={step.wa_template_name ?? ''}
                                    placeholder="hello_world"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Language</Label>
                                <Input
                                    name="wa_template_language"
                                    defaultValue={
                                        step.wa_template_language ?? 'fr'
                                    }
                                />
                            </div>
                        </>
                    ) : null}
                    {type === 'call' || type === 'meeting' ? (
                        <>
                            <div className="space-y-1.5">
                                <Label>Task subject</Label>
                                <Input
                                    name="subject"
                                    defaultValue={step.subject ?? ''}
                                />
                            </div>
                            {type === 'meeting' ? (
                                <div className="space-y-1.5">
                                    <Label>Meeting URL</Label>
                                    <Input
                                        name="meeting_url"
                                        defaultValue={step.meeting_url ?? ''}
                                        placeholder="https://"
                                    />
                                </div>
                            ) : null}
                            <div className="space-y-1.5 md:col-span-2">
                                <Label>Notes</Label>
                                <Textarea
                                    name="body"
                                    rows={3}
                                    defaultValue={step.body ?? ''}
                                />
                            </div>
                        </>
                    ) : null}
                    <div className="md:col-span-2">
                        <Button size="sm" disabled={processing}>
                            {submitLabel}
                        </Button>
                    </div>
                    {templates.length === 0 ? null : null}
                </>
            )}
        </Form>
    );
}
