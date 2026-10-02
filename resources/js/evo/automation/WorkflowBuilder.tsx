import type { ReactNode } from 'react';

import { workflowActionLabel, workflowOperatorLabel, workflowTriggerLabel } from '@/evo/automation/labels';
import { cn } from '@/evo/lib/cn';
import { Input } from '@/evo/ui/input';
import { Label } from '@/evo/ui/label';
import { NativeSelect } from '@/evo/ui/native-select';
import { t } from '@/lib/i18n';
import {
    WORKFLOW_ACTIONS,
    WORKFLOW_OPERATORS,
    WORKFLOW_TRIGGERS,
    actionAvailability,
    operatorNeedsValue,
    summarizeWorkflow,
} from '@/lib/workflow-authoring';
import type {
    WorkflowCapabilities,
    WorkflowConditionField,
    WorkflowDraft,
    WorkflowMember,
    WorkflowSequence,
    WorkflowStage,
    WorkflowTicketStatus,
} from '@/lib/workflow-authoring';

type Segment = { id: number; name: string };

export type WorkflowBuilderProps = {
    draft: WorkflowDraft;
    onChange: (patch: Partial<WorkflowDraft>) => void;
    stages: WorkflowStage[];
    sequences: WorkflowSequence[];
    segments: Segment[];
    members: WorkflowMember[];
    conditionFields: WorkflowConditionField[];
    ticketStatuses: WorkflowTicketStatus[];
    capabilities: WorkflowCapabilities;
    errors: Record<string, string>;
    disabled?: boolean;
};

function Field({
    label,
    htmlFor,
    error,
    className,
    children,
}: {
    label: string;
    htmlFor?: string;
    error?: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div className={cn('min-w-0', className)}>
            <Label htmlFor={htmlFor} className="mb-1 block text-[12px] text-[var(--evo-ink-muted)]">
                {t(label)}
            </Label>
            {children}
            {error ? (
                <p className="mt-1 text-[12px] text-[var(--evo-danger)]" role="alert">
                    {error}
                </p>
            ) : null}
        </div>
    );
}

function Section({
    step,
    label,
    last = false,
    children,
}: {
    step: 'when' | 'if' | 'then' | 'else';
    label: string;
    last?: boolean;
    children: ReactNode;
}) {
    return (
        <section
            data-workflow-section={step}
            className="grid grid-cols-1 gap-3 md:grid-cols-[3.25rem_minmax(0,1fr)] md:gap-x-4"
        >
            <div className="relative flex items-center gap-2 md:block md:pt-2">
                <span className="text-[11px] font-semibold tracking-[0.14em] text-[var(--evo-ink-muted)]">
                    {t(label)}
                </span>
                {last ? null : (
                    <span
                        aria-hidden
                        className="hidden h-full min-h-8 w-px bg-[var(--evo-hairline)] md:absolute md:top-7 md:bottom-[-1.25rem] md:start-[0.55rem] md:block"
                    />
                )}
            </div>
            <div className="min-w-0 space-y-2 rounded-[var(--evo-radius-compact)] border border-[var(--evo-hairline)] bg-[var(--evo-surface)] px-3 py-3">
                {children}
            </div>
        </section>
    );
}

function ActionFields({
    action,
    prefix,
    draft,
    onChange,
    sequences,
    members,
    errors,
    disabled,
}: {
    action: string;
    prefix: '' | 'else_';
    draft: WorkflowDraft;
    onChange: (patch: Partial<WorkflowDraft>) => void;
    sequences: WorkflowSequence[];
    members: WorkflowMember[];
    errors: Record<string, string>;
    disabled?: boolean;
}) {
    const subjectKey = prefix ? 'else_subject' : 'subject';
    const bodyKey = prefix ? 'else_body' : 'body';

    if (action === 'enroll_sequence') {
        const key = prefix ? 'else_sequence_id' : 'sequence_id';

        return (
            <Field label={prefix ? 'Else sequence' : 'Sequence'} htmlFor={key} error={errors[key]}>
                <NativeSelect
                    id={key}
                    name={key}
                    value={draft[key]}
                    disabled={disabled}
                    onChange={(event) => onChange({ [key]: event.target.value })}
                >
                    <option value="">{t('First sequence in the workspace')}</option>
                    {sequences.map((sequence) => (
                        <option key={sequence.id} value={sequence.id}>
                            {sequence.name}
                        </option>
                    ))}
                </NativeSelect>
            </Field>
        );
    }

    if (action === 'send_webhook') {
        const key = prefix ? 'else_webhook_url' : 'webhook_url';

        return (
            <Field
                label={prefix ? 'Else webhook URL' : 'Webhook URL'}
                htmlFor={key}
                error={errors[key]}
                className="md:col-span-2"
            >
                <Input
                    id={key}
                    name={key}
                    type="url"
                    value={draft[key]}
                    disabled={disabled}
                    placeholder="https://hooks.evotechly.dz/deals"
                    onChange={(event) => onChange({ [key]: event.target.value })}
                />
            </Field>
        );
    }

    if (action === 'set_property') {
        const entityKey = prefix ? 'else_property_entity' : 'property_entity';
        const fieldKey = prefix ? 'else_property_field' : 'property_field';
        const valueKey = prefix ? 'else_property_value' : 'property_value';

        return (
            <>
                <Field label={prefix ? 'Else record' : 'Record'} htmlFor={entityKey}>
                    <NativeSelect
                        id={entityKey}
                        name={entityKey}
                        value={draft[entityKey]}
                        disabled={disabled}
                        onChange={(event) => onChange({ [entityKey]: event.target.value })}
                    >
                        <option value="contact">{t('Contact')}</option>
                        <option value="deal">{t('Deal')}</option>
                    </NativeSelect>
                </Field>
                <Field label={prefix ? 'Else field' : 'Field'} htmlFor={fieldKey} error={errors[fieldKey]}>
                    <Input
                        id={fieldKey}
                        name={fieldKey}
                        value={draft[fieldKey]}
                        disabled={disabled}
                        placeholder="wilaya"
                        onChange={(event) => onChange({ [fieldKey]: event.target.value })}
                    />
                </Field>
                <Field
                    label={prefix ? 'Else value' : 'Value'}
                    htmlFor={valueKey}
                    error={errors[valueKey]}
                    className="md:col-span-2"
                >
                    <Input
                        id={valueKey}
                        name={valueKey}
                        value={draft[valueKey]}
                        disabled={disabled}
                        placeholder="Alger"
                        onChange={(event) => onChange({ [valueKey]: event.target.value })}
                    />
                </Field>
            </>
        );
    }

    if (action === 'assign_owner') {
        const entityKey = prefix ? 'else_assign_entity' : 'assign_entity';
        const ownerKey = prefix ? 'else_assign_owner_id' : 'assign_owner_id';

        return (
            <>
                <Field label={prefix ? 'Else record' : 'Record'} htmlFor={entityKey}>
                    <NativeSelect
                        id={entityKey}
                        name={entityKey}
                        value={draft[entityKey]}
                        disabled={disabled}
                        onChange={(event) => onChange({ [entityKey]: event.target.value })}
                    >
                        <option value="contact">{t('Contact')}</option>
                        <option value="deal">{t('Deal')}</option>
                    </NativeSelect>
                </Field>
                <Field label={prefix ? 'Else owner' : 'Owner'} htmlFor={ownerKey} error={errors[ownerKey]}>
                    <NativeSelect
                        id={ownerKey}
                        name={ownerKey}
                        value={draft[ownerKey]}
                        disabled={disabled}
                        onChange={(event) => onChange({ [ownerKey]: event.target.value })}
                    >
                        <option value="">{t('Choose a person…')}</option>
                        {members.map((member) => (
                            <option key={member.id} value={member.id}>
                                {member.name}
                            </option>
                        ))}
                    </NativeSelect>
                </Field>
            </>
        );
    }

    if (action === 'create_deal') {
        const amountKey = prefix ? 'else_property_value' : 'property_value';

        return (
            <>
                <Field
                    label={prefix ? 'Else deal title' : 'Deal title'}
                    htmlFor={subjectKey}
                    error={errors[subjectKey]}
                >
                    <Input
                        id={subjectKey}
                        name={subjectKey}
                        value={draft[subjectKey]}
                        disabled={disabled}
                        placeholder="New opportunity"
                        onChange={(event) => onChange({ [subjectKey]: event.target.value })}
                    />
                </Field>
                <Field label={prefix ? 'Else amount (DZD)' : 'Amount (DZD)'} htmlFor={amountKey}>
                    <Input
                        id={amountKey}
                        name={amountKey}
                        type="number"
                        min={0}
                        value={draft[amountKey]}
                        disabled={disabled}
                        placeholder="1280000"
                        onChange={(event) => onChange({ [amountKey]: event.target.value })}
                    />
                </Field>
            </>
        );
    }

    if (action === 'send_email' || action === 'notify_user') {
        const userKey = prefix ? 'else_notify_user_id' : 'notify_user_id';

        return (
            <>
                {action === 'notify_user' ? (
                    <Field label={prefix ? 'Else notify' : 'Notify'} htmlFor={userKey}>
                        <NativeSelect
                            id={userKey}
                            name={userKey}
                            value={draft[userKey]}
                            disabled={disabled}
                            onChange={(event) => onChange({ [userKey]: event.target.value })}
                        >
                            <option value="">{t('Record owner')}</option>
                            {members.map((member) => (
                                <option key={member.id} value={member.id}>
                                    {member.name}
                                </option>
                            ))}
                        </NativeSelect>
                    </Field>
                ) : null}
                <Field label={prefix ? 'Else subject' : 'Subject'} htmlFor={subjectKey} error={errors[subjectKey]}>
                    <Input
                        id={subjectKey}
                        name={subjectKey}
                        value={draft[subjectKey]}
                        disabled={disabled}
                        onChange={(event) => onChange({ [subjectKey]: event.target.value })}
                    />
                </Field>
                <Field
                    label={prefix ? 'Else body' : 'Body'}
                    htmlFor={bodyKey}
                    error={errors[bodyKey]}
                    className="md:col-span-2"
                >
                    <Input
                        id={bodyKey}
                        name={bodyKey}
                        value={draft[bodyKey]}
                        disabled={disabled}
                        onChange={(event) => onChange({ [bodyKey]: event.target.value })}
                    />
                </Field>
            </>
        );
    }

    if (action === 'create_task') {
        const dueKey = prefix ? 'else_due_in_days' : 'due_in_days';

        return (
            <>
                <Field label={prefix ? 'Else task subject' : 'Task subject'} htmlFor={subjectKey} className="md:col-span-2">
                    <Input
                        id={subjectKey}
                        name={subjectKey}
                        value={draft[subjectKey]}
                        disabled={disabled}
                        placeholder="Introduce Evotechly to {{contact}}"
                        onChange={(event) => onChange({ [subjectKey]: event.target.value })}
                    />
                </Field>
                <Field label={prefix ? 'Else due in days' : 'Due in days'} htmlFor={dueKey}>
                    <Input
                        id={dueKey}
                        name={dueKey}
                        type="number"
                        min={0}
                        max={90}
                        value={draft[dueKey]}
                        disabled={disabled}
                        onChange={(event) => onChange({ [dueKey]: event.target.value })}
                    />
                </Field>
            </>
        );
    }

    return null;
}

function ActionChooser({
    id,
    name,
    label,
    value,
    onChange,
    capabilities,
    allowEmpty = false,
    emptyLabel = 'Do nothing',
    error,
    disabled,
}: {
    id: string;
    name: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    capabilities: WorkflowCapabilities;
    allowEmpty?: boolean;
    emptyLabel?: string;
    error?: string;
    disabled?: boolean;
}) {
    return (
        <Field label={label} htmlFor={id} error={error}>
            <NativeSelect
                id={id}
                name={name}
                value={value}
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
            >
                {allowEmpty ? <option value="">{t(emptyLabel)}</option> : null}
                {WORKFLOW_ACTIONS.map((action) => {
                    const availability = actionAvailability(action, capabilities);
                    const selected = value === action;

                    return (
                        <option key={action} value={action} disabled={!availability.available && !selected}>
                            {workflowActionLabel(action)}
                            {!availability.available ? t(' — unavailable') : ''}
                        </option>
                    );
                })}
            </NativeSelect>
        </Field>
    );
}

export function WorkflowBuilder({
    draft,
    onChange,
    stages,
    sequences,
    segments,
    members,
    conditionFields,
    ticketStatuses,
    capabilities,
    errors,
    disabled = false,
}: WorkflowBuilderProps) {
    const summary = summarizeWorkflow(draft, conditionFields, stages);
    const thenAvailability = actionAvailability(draft.action, capabilities);
    const elseAvailability = draft.else_action
        ? actionAvailability(draft.else_action, capabilities)
        : { available: true, reason: null };
    const branched = draft.condition_field !== '';

    return (
        <div data-workflow="builder" className="space-y-4">
            <div className="space-y-2">
                <Field label="Workflow name" htmlFor="workflow-name" error={errors.name}>
                    <Input
                        id="workflow-name"
                        name="name"
                        value={draft.name}
                        disabled={disabled}
                        required
                        placeholder="New Evotechly contact — first task"
                        onChange={(event) => onChange({ name: event.target.value })}
                    />
                </Field>
                <p data-workflow="summary" className="text-[13px] leading-5 text-[var(--evo-ink-muted)]">
                    {summary}
                </p>
            </div>

            <div className="space-y-3">
                <Section step="when" label="WHEN">
                    <div className="grid gap-2 md:grid-cols-2">
                        <Field label="Trigger" htmlFor="workflow-trigger" error={errors.trigger}>
                            <NativeSelect
                                id="workflow-trigger"
                                name="trigger"
                                value={draft.trigger}
                                disabled={disabled}
                                onChange={(event) =>
                                    onChange({
                                        trigger: event.target.value,
                                        trigger_stage_id: '',
                                        trigger_status: '',
                                        trigger_saved_filter_id: '',
                                    })
                                }
                            >
                                {WORKFLOW_TRIGGERS.map((trigger) => (
                                    <option key={trigger} value={trigger}>
                                        {workflowTriggerLabel(trigger)}
                                    </option>
                                ))}
                            </NativeSelect>
                        </Field>
                        {draft.trigger === 'deal.stage_changed' ? (
                            <Field label="To stage" htmlFor="workflow-stage" error={errors.trigger_stage_id}>
                                <NativeSelect
                                    id="workflow-stage"
                                    name="trigger_stage_id"
                                    value={draft.trigger_stage_id}
                                    disabled={disabled}
                                    required
                                    onChange={(event) => onChange({ trigger_stage_id: event.target.value })}
                                >
                                    <option value="">{t('Choose a stage…')}</option>
                                    {stages.map((stage) => (
                                        <option key={stage.id} value={stage.id}>
                                            {stage.name}
                                        </option>
                                    ))}
                                </NativeSelect>
                            </Field>
                        ) : null}
                        {draft.trigger === 'ticket.status_changed' ? (
                            <Field label="To status" htmlFor="workflow-status">
                                <NativeSelect
                                    id="workflow-status"
                                    name="trigger_status"
                                    value={draft.trigger_status}
                                    disabled={disabled}
                                    onChange={(event) => onChange({ trigger_status: event.target.value })}
                                >
                                    <option value="">{t('Any status')}</option>
                                    {ticketStatuses.map((status) => (
                                        <option key={status.value} value={status.value}>
                                            {status.label}
                                        </option>
                                    ))}
                                </NativeSelect>
                            </Field>
                        ) : null}
                        {draft.trigger === 'segment.entered' || draft.trigger === 'segment.exited' ? (
                            <Field
                                label="Segment"
                                htmlFor="workflow-segment"
                                error={errors.trigger_saved_filter_id}
                            >
                                <NativeSelect
                                    id="workflow-segment"
                                    name="trigger_saved_filter_id"
                                    value={draft.trigger_saved_filter_id}
                                    disabled={disabled}
                                    required
                                    onChange={(event) =>
                                        onChange({
                                            trigger_saved_filter_id: event.target.value,
                                        })
                                    }
                                >
                                    <option value="">{t('Pick a contact segment…')}</option>
                                    {segments.map((segment) => (
                                        <option key={segment.id} value={segment.id}>
                                            {segment.name}
                                        </option>
                                    ))}
                                </NativeSelect>
                            </Field>
                        ) : null}
                        <Field label="Delay (minutes)" htmlFor="workflow-delay">
                            <Input
                                id="workflow-delay"
                                name="delay_minutes"
                                type="number"
                                min={0}
                                max={43200}
                                value={draft.delay_minutes}
                                disabled={disabled}
                                onChange={(event) => onChange({ delay_minutes: event.target.value })}
                            />
                        </Field>
                    </div>
                </Section>

                <Section step="if" label="IF">
                    <div className="grid gap-2 md:grid-cols-3">
                        <Field label="Field" htmlFor="workflow-condition-field">
                            <NativeSelect
                                id="workflow-condition-field"
                                name="condition_field"
                                value={draft.condition_field}
                                disabled={disabled}
                                onChange={(event) =>
                                    onChange({
                                        condition_field: event.target.value,
                                        else_action: event.target.value ? draft.else_action : '',
                                    })
                                }
                            >
                                <option value="">{t('No condition')}</option>
                                {conditionFields.map((field) => (
                                    <option key={field.value} value={field.value}>
                                        {field.label}
                                    </option>
                                ))}
                            </NativeSelect>
                        </Field>
                        {branched ? (
                            <>
                                <Field label="Operator" htmlFor="workflow-operator" error={errors.condition_operator}>
                                    <NativeSelect
                                        id="workflow-operator"
                                        name="condition_operator"
                                        value={draft.condition_operator}
                                        disabled={disabled}
                                        onChange={(event) =>
                                            onChange({
                                                condition_operator: event.target.value,
                                            })
                                        }
                                    >
                                        {WORKFLOW_OPERATORS.map((operator) => (
                                            <option key={operator} value={operator}>
                                                {workflowOperatorLabel(operator)}
                                            </option>
                                        ))}
                                    </NativeSelect>
                                </Field>
                                {operatorNeedsValue(draft.condition_operator) ? (
                                    draft.condition_field === 'deal.stage' ? (
                                        <Field
                                            label="Stage"
                                            htmlFor="workflow-condition-value"
                                            error={errors.condition_value}
                                        >
                                            <NativeSelect
                                                id="workflow-condition-value"
                                                name="condition_value"
                                                value={draft.condition_value}
                                                disabled={disabled}
                                                required
                                                onChange={(event) =>
                                                    onChange({
                                                        condition_value: event.target.value,
                                                    })
                                                }
                                            >
                                                <option value="">{t('Choose a stage…')}</option>
                                                {stages.map((stage) => (
                                                    <option key={stage.id} value={stage.slug}>
                                                        {stage.name}
                                                    </option>
                                                ))}
                                            </NativeSelect>
                                        </Field>
                                    ) : draft.condition_field === 'ticket.status' ? (
                                        <Field
                                            label="Status"
                                            htmlFor="workflow-condition-value"
                                            error={errors.condition_value}
                                        >
                                            <NativeSelect
                                                id="workflow-condition-value"
                                                name="condition_value"
                                                value={draft.condition_value}
                                                disabled={disabled}
                                                required
                                                onChange={(event) =>
                                                    onChange({
                                                        condition_value: event.target.value,
                                                    })
                                                }
                                            >
                                                <option value="">{t('Choose a status…')}</option>
                                                {ticketStatuses.map((status) => (
                                                    <option key={status.value} value={status.value}>
                                                        {status.label}
                                                    </option>
                                                ))}
                                            </NativeSelect>
                                        </Field>
                                    ) : (
                                        <Field
                                            label={
                                                draft.condition_field === 'deal.amount' ? 'Amount (DZD)' : 'Value'
                                            }
                                            htmlFor="workflow-condition-value"
                                            error={errors.condition_value}
                                        >
                                            <Input
                                                id="workflow-condition-value"
                                                name="condition_value"
                                                value={draft.condition_value}
                                                disabled={disabled}
                                                required
                                                placeholder={
                                                    draft.condition_field === 'deal.amount' ? '1280000' : 'Alger'
                                                }
                                                onChange={(event) =>
                                                    onChange({
                                                        condition_value: event.target.value,
                                                    })
                                                }
                                            />
                                        </Field>
                                    )
                                ) : null}
                            </>
                        ) : (
                            <p className="self-end text-[12px] text-[var(--evo-ink-muted)] md:col-span-2">
                                {t('Optional. The runner evaluates one condition.')}
                            </p>
                        )}
                    </div>
                </Section>

                <Section step="then" label="THEN" last={!branched}>
                    <div className="grid gap-2 md:grid-cols-2">
                        <ActionChooser
                            id="workflow-action"
                            name="action"
                            label="Action"
                            value={draft.action}
                            capabilities={capabilities}
                            error={errors.action}
                            disabled={disabled}
                            onChange={(action) => onChange({ action })}
                        />
                        <ActionFields
                            action={draft.action}
                            prefix=""
                            draft={draft}
                            onChange={onChange}
                            sequences={sequences}
                            members={members}
                            errors={errors}
                            disabled={disabled}
                        />
                    </div>
                    {thenAvailability.reason ? (
                        <p className="text-[12px] text-[var(--evo-ink-muted)]">{thenAvailability.reason}</p>
                    ) : null}
                </Section>

                {branched ? (
                    <Section step="else" label="ELSE" last>
                        <div className="grid gap-2 md:grid-cols-2">
                            <ActionChooser
                                id="workflow-else-action"
                                name="else_action"
                                label="Else action"
                                value={draft.else_action}
                                capabilities={capabilities}
                                allowEmpty
                                error={errors.else_action}
                                disabled={disabled}
                                onChange={(else_action) => onChange({ else_action })}
                            />
                            {draft.else_action ? (
                                <ActionFields
                                    action={draft.else_action}
                                    prefix="else_"
                                    draft={draft}
                                    onChange={onChange}
                                    sequences={sequences}
                                    members={members}
                                    errors={errors}
                                    disabled={disabled}
                                />
                            ) : null}
                        </div>
                        {elseAvailability.reason ? (
                            <p className="text-[12px] text-[var(--evo-ink-muted)]">{elseAvailability.reason}</p>
                        ) : null}
                    </Section>
                ) : null}
            </div>
        </div>
    );
}
