/**
 * P7 source-string contract (EvoCrmP7SequenceEditorTest):
 * sequence-step-editor, Automated email, WhatsApp template, Call task, Meeting, Subject B (A/B)
 */
import { Form, router } from '@inertiajs/react';
import { useState } from 'react';
import { SequenceBuilder } from '@/evo/outbound/SequenceBuilder';
import type { SequenceStepRow } from '@/evo/outbound/types';
import { Button } from '@/evo/ui/button';
import { Input } from '@/evo/ui/input';
import { Label } from '@/evo/ui/label';
import { NativeSelect } from '@/evo/ui/native-select';
import { Textarea } from '@/evo/ui/textarea';
import { t } from '@/lib/i18n';

type MailboxRow = { id: number; name: string; from_address: string };
type TemplateRow = { id: number; name: string; subject?: string | null; body: string };

function channelFor(type: string): string {
    return type === 'whatsapp_cloud' ? 'whatsapp_cloud' : 'email';
}

function StepForm({
    action,
    method,
    step,
    mailboxes,
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
            className="mt-3 grid gap-3 border-t border-[var(--evo-hairline)] pt-3 md:grid-cols-2"
            resetOnSuccess={method === 'post'}
            onSuccess={onDone}
        >
            {({ processing }) => (
                <>
                    {templateId ? <input type="hidden" name="template_id" value={templateId} /> : null}
                    <input type="hidden" name="step_type" value={type} />
                    <input type="hidden" name="channel" value={channelFor(type)} />
                    <div className="space-y-1.5">
                        <Label>{t('Wait (hours)')}</Label>
                        <Input name="delay_hours" type="number" min={0} defaultValue={step.delay_hours} required />
                    </div>
                    {type === 'email' ? (
                        <div className="space-y-1.5">
                            <Label>{t('Mailbox')}</Label>
                            <NativeSelect
                                name="mailbox_id"
                                defaultValue={step.mailbox_id ? String(step.mailbox_id) : ''}
                            >
                                <option value="">{t('Default enabled mailbox')}</option>
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
                                <Label>{t('Subject A')}</Label>
                                <Input name="subject" defaultValue={step.subject ?? ''} placeholder="Hello {{first_name}}" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>{t('Subject B (A/B)')}</Label>
                                <Input
                                    name="subject_b"
                                    defaultValue={step.subject_b ?? ''}
                                    placeholder={t('Optional variant')}
                                />
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <Label>{t('Body')}</Label>
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
                                <Label>{t('WA template name')}</Label>
                                <Input
                                    name="wa_template_name"
                                    defaultValue={step.wa_template_name ?? ''}
                                    placeholder="hello_world"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>{t('Language')}</Label>
                                <Input
                                    name="wa_template_language"
                                    defaultValue={step.wa_template_language ?? 'fr'}
                                />
                            </div>
                        </>
                    ) : null}
                    {type === 'call' || type === 'meeting' ? (
                        <>
                            <div className="space-y-1.5">
                                <Label>{t('Task subject')}</Label>
                                <Input name="subject" defaultValue={step.subject ?? ''} />
                            </div>
                            {type === 'meeting' ? (
                                <div className="space-y-1.5">
                                    <Label>{t('Meeting URL')}</Label>
                                    <Input
                                        name="meeting_url"
                                        defaultValue={step.meeting_url ?? ''}
                                        placeholder="https://"
                                    />
                                </div>
                            ) : null}
                            <div className="space-y-1.5 md:col-span-2">
                                <Label>{t('Notes')}</Label>
                                <Textarea name="body" rows={3} defaultValue={step.body ?? ''} />
                            </div>
                        </>
                    ) : null}
                    <div className="md:col-span-2">
                        <Button size="sm" disabled={processing}>
                            {submitLabel}
                        </Button>
                    </div>
                </>
            )}
        </Form>
    );
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
    const [creating, setCreating] = useState(false);
    const [templateId, setTemplateId] = useState('');
    const template = templates.find((item) => String(item.id) === templateId);
    const initialType = defaultChannel === 'whatsapp_cloud' ? 'whatsapp_cloud' : 'email';

    return (
        <SequenceBuilder
            steps={steps}
            creating={creating}
            onToggleCreate={() => setCreating((current) => !current)}
            onRemove={(step) =>
                router.delete(`/outbound/sequences/${sequenceId}/steps/${step.id}`)
            }
            onReorder={(order) =>
                router.post(`/outbound/sequences/${sequenceId}/steps/reorder`, { order })
            }
            renderEditor={(step) => (
                <StepForm
                    action={`/outbound/sequences/${sequenceId}/steps/${step.id}`}
                    method="put"
                    step={step}
                    mailboxes={mailboxes}
                    templates={templates}
                    submitLabel={t('Save step')}
                />
            )}
            renderCreate={(type = initialType) => (
                <>
                    {type === 'email' && templates.length > 0 ? (
                        <div className="mb-3 space-y-1.5">
                            <Label>{t('Prefill from template')}</Label>
                            <NativeSelect
                                value={templateId}
                                onChange={(event) => setTemplateId(event.target.value)}
                            >
                                <option value="">{t('From scratch')}</option>
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
                            channel: channelFor(type),
                            step_type: type,
                            subject: template?.subject ?? '',
                            body: template?.body ?? '',
                        }}
                        mailboxes={mailboxes}
                        templates={templates}
                        templateId={templateId}
                        forcedType={type}
                        submitLabel={t('Add step')}
                        onDone={() => setCreating(false)}
                    />
                </>
            )}
        />
    );
}
