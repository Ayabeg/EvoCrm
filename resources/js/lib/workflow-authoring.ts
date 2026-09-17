/**
 * P19 structured automation authoring.
 * Mirrors Workflow + WorkflowRunner. Do not invent triggers, operators, or actions.
 */

export const WORKFLOW_TRIGGERS = [
    'contact.created',
    'deal.stage_changed',
    'deal.created',
    'enrollment.finished',
    'segment.entered',
    'segment.exited',
    'enrollment.replied',
    'lead.scored',
    'lead.qualified',
    'meeting.booked',
    'meeting.no_show',
    'ticket.created',
    'ticket.status_changed',
    'ticket.sla_breached',
] as const;

export const WORKFLOW_ACTIONS = [
    'create_task',
    'enroll_sequence',
    'send_webhook',
    'set_property',
    'assign_owner',
    'create_deal',
    'send_email',
    'notify_user',
] as const;

export const WORKFLOW_OPERATORS = [
    'eq',
    'neq',
    'gt',
    'gte',
    'lt',
    'lte',
    'contains',
    'is_set',
    'is_empty',
] as const;

export const BUILT_IN_CONDITION_FIELDS = [
    'deal.amount',
    'deal.stage',
    'ticket.status',
    'contact.wilaya',
    'contact.city',
    'contact.source',
    'contact.email',
    'contact.phone',
] as const;

export type WorkflowTrigger = (typeof WORKFLOW_TRIGGERS)[number];
export type WorkflowAction = (typeof WORKFLOW_ACTIONS)[number];
export type WorkflowOperator = (typeof WORKFLOW_OPERATORS)[number];

export type WorkflowConditionField = {
    value: string;
    label: string;
};

export type WorkflowStage = {
    id: number;
    name: string;
    slug: string;
};

export type WorkflowSequence = {
    id: number;
    name: string;
    channel: string;
};

export type WorkflowMember = {
    id: number;
    name: string;
};

export type WorkflowTicketStatus = {
    value: string;
    label: string;
};

export type WorkflowCapabilities = {
    can_manage: boolean;
    has_mailbox: boolean;
    has_sequences: boolean;
};

export type WorkflowActionConfig = Record<string, unknown>;

export type WorkflowRow = {
    id: number;
    name: string;
    trigger: string;
    trigger_stage: string | null;
    trigger_stage_id: number | null;
    trigger_status: string | null;
    trigger_status_label: string | null;
    trigger_saved_filter_id: number | null;
    action: string;
    action_config: WorkflowActionConfig;
    condition_field: string | null;
    condition_operator: string | null;
    condition_value: string | null;
    else_action: string | null;
    else_action_config: WorkflowActionConfig;
    active: boolean;
    template_key: string | null;
    delay_minutes: number;
    created_at: string | null;
    updated_at: string | null;
};

export type WorkflowTemplate = {
    key: string;
    name: string;
    description: string;
    trigger: string;
    action: string;
};

export type WorkflowDraft = {
    name: string;
    trigger: string;
    trigger_stage_id: string;
    trigger_status: string;
    trigger_saved_filter_id: string;
    delay_minutes: string;
    action: string;
    subject: string;
    body: string;
    due_in_days: string;
    sequence_id: string;
    webhook_url: string;
    property_entity: string;
    property_field: string;
    property_value: string;
    assign_entity: string;
    assign_owner_id: string;
    notify_user_id: string;
    condition_field: string;
    condition_operator: string;
    condition_value: string;
    else_action: string;
    else_subject: string;
    else_body: string;
    else_due_in_days: string;
    else_sequence_id: string;
    else_webhook_url: string;
    else_property_entity: string;
    else_property_field: string;
    else_property_value: string;
    else_assign_entity: string;
    else_assign_owner_id: string;
    else_notify_user_id: string;
};

export const TRIGGER_LABELS: Record<string, string> = {
    'contact.created': 'Contact created',
    'deal.stage_changed': 'Deal stage changed',
    'deal.created': 'Deal created',
    'enrollment.finished': 'Sequence finished',
    'segment.entered': 'Segment entered',
    'segment.exited': 'Segment exited',
    'enrollment.replied': 'Sequence reply received',
    'lead.scored': 'Lead scored',
    'lead.qualified': 'Lead qualified',
    'meeting.booked': 'Meeting booked',
    'meeting.no_show': 'Meeting no-show',
    'ticket.created': 'Ticket created',
    'ticket.status_changed': 'Ticket status changed',
    'ticket.sla_breached': 'Ticket SLA breached',
};

export const ACTION_LABELS: Record<string, string> = {
    create_task: 'Create task',
    enroll_sequence: 'Enroll in sequence',
    send_webhook: 'Send webhook',
    set_property: 'Set property',
    assign_owner: 'Assign owner',
    create_deal: 'Create deal',
    send_email: 'Send email',
    notify_user: 'Notify user',
};

export const OPERATOR_LABELS: Record<string, string> = {
    eq: 'is',
    neq: 'is not',
    gt: 'greater than',
    gte: 'at least',
    lt: 'less than',
    lte: 'at most',
    contains: 'contains',
    is_set: 'is set',
    is_empty: 'is empty',
};

export const OPERATOR_SYMBOLS: Record<string, string> = {
    eq: '=',
    neq: '≠',
    gt: '>',
    gte: '≥',
    lt: '<',
    lte: '≤',
    contains: 'contains',
    is_set: 'is set',
    is_empty: 'is empty',
};

const EMPTY_ACTION_FIELDS = {
    subject: '',
    body: '',
    due_in_days: '1',
    sequence_id: '',
    webhook_url: '',
    property_entity: 'contact',
    property_field: '',
    property_value: '',
    assign_entity: 'contact',
    assign_owner_id: '',
    notify_user_id: '',
};

export function emptyWorkflowDraft(): WorkflowDraft {
    return {
        name: '',
        trigger: 'contact.created',
        trigger_stage_id: '',
        trigger_status: '',
        trigger_saved_filter_id: '',
        delay_minutes: '0',
        action: 'create_task',
        ...EMPTY_ACTION_FIELDS,
        condition_field: '',
        condition_operator: 'eq',
        condition_value: '',
        else_action: '',
        else_subject: '',
        else_body: '',
        else_due_in_days: '1',
        else_sequence_id: '',
        else_webhook_url: '',
        else_property_entity: 'contact',
        else_property_field: '',
        else_property_value: '',
        else_assign_entity: 'contact',
        else_assign_owner_id: '',
        else_notify_user_id: '',
    };
}

function asString(value: unknown): string {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value);
}

function amountDzdFromConfig(config: WorkflowActionConfig): string {
    if (typeof config.amount_cents === 'number') {
        return String(Math.round(config.amount_cents / 100));
    }

    if (typeof config.amount_cents === 'string' && config.amount_cents !== '') {
        return String(Math.round(Number(config.amount_cents) / 100));
    }

    return asString(config.property_value);
}

function hydrateActionFields(
    action: string | null,
    config: WorkflowActionConfig | null,
): Pick<
    WorkflowDraft,
    | 'subject'
    | 'body'
    | 'due_in_days'
    | 'sequence_id'
    | 'webhook_url'
    | 'property_entity'
    | 'property_field'
    | 'property_value'
    | 'assign_entity'
    | 'assign_owner_id'
    | 'notify_user_id'
> {
    const safe = config ?? {};

    if (action === 'enroll_sequence') {
        return {
            ...EMPTY_ACTION_FIELDS,
            sequence_id: asString(safe.sequence_id),
        };
    }

    if (action === 'send_webhook') {
        return {
            ...EMPTY_ACTION_FIELDS,
            webhook_url: asString(safe.url ?? safe.webhook_url),
        };
    }

    if (action === 'set_property') {
        return {
            ...EMPTY_ACTION_FIELDS,
            property_entity: asString(safe.entity) || 'contact',
            property_field: asString(safe.field),
            property_value: asString(safe.value),
        };
    }

    if (action === 'assign_owner') {
        return {
            ...EMPTY_ACTION_FIELDS,
            assign_entity: asString(safe.entity) || 'contact',
            assign_owner_id: asString(safe.owner_id),
        };
    }

    if (action === 'create_deal') {
        return {
            ...EMPTY_ACTION_FIELDS,
            subject: asString(safe.title ?? safe.subject),
            property_value: amountDzdFromConfig(safe),
        };
    }

    if (action === 'notify_user') {
        return {
            ...EMPTY_ACTION_FIELDS,
            subject: asString(safe.subject),
            body: asString(safe.body),
            notify_user_id: asString(safe.user_id),
        };
    }

    return {
        ...EMPTY_ACTION_FIELDS,
        subject: asString(safe.subject),
        body: asString(safe.body),
        due_in_days: asString(safe.due_in_days || 1),
    };
}

export function draftFromWorkflow(workflow: WorkflowRow): WorkflowDraft {
    const thenFields = hydrateActionFields(workflow.action, workflow.action_config);
    const elseFields = hydrateActionFields(workflow.else_action, workflow.else_action_config);

    return {
        name: workflow.name,
        trigger: workflow.trigger,
        trigger_stage_id: asString(workflow.trigger_stage_id),
        trigger_status: asString(workflow.trigger_status),
        trigger_saved_filter_id: asString(workflow.trigger_saved_filter_id),
        delay_minutes: asString(workflow.delay_minutes ?? 0),
        action: workflow.action,
        ...thenFields,
        condition_field: asString(workflow.condition_field),
        condition_operator: asString(workflow.condition_operator || 'eq'),
        condition_value: asString(workflow.condition_value),
        else_action: asString(workflow.else_action),
        else_subject: elseFields.subject,
        else_body: elseFields.body,
        else_due_in_days: elseFields.due_in_days,
        else_sequence_id: elseFields.sequence_id,
        else_webhook_url: elseFields.webhook_url,
        else_property_entity: elseFields.property_entity,
        else_property_field: elseFields.property_field,
        else_property_value: elseFields.property_value,
        else_assign_entity: elseFields.assign_entity,
        else_assign_owner_id: elseFields.assign_owner_id,
        else_notify_user_id: elseFields.notify_user_id,
    };
}

export function operatorNeedsValue(operator: string): boolean {
    return operator !== 'is_set' && operator !== 'is_empty';
}

export function triggerLabel(trigger: string): string {
    return TRIGGER_LABELS[trigger] ?? trigger;
}

export function actionLabel(action: string): string {
    return ACTION_LABELS[action] ?? action;
}

export function operatorLabel(operator: string): string {
    return OPERATOR_LABELS[operator] ?? operator;
}

export function conditionFieldLabel(
    field: string | null,
    fields: WorkflowConditionField[],
): string {
    if (!field) {
        return '';
    }

    return fields.find((item) => item.value === field)?.label ?? field;
}

export function actionAvailability(
    action: string,
    capabilities: WorkflowCapabilities,
): { available: boolean; reason: string | null } {
    if (action === 'send_email' && !capabilities.has_mailbox) {
        return {
            available: false,
            reason: 'No enabled mailbox. Connect email in Integrations.',
        };
    }

    if (action === 'enroll_sequence' && !capabilities.has_sequences) {
        return {
            available: false,
            reason: 'No outbound sequence in this workspace.',
        };
    }

    return { available: true, reason: null };
}

export type WorkflowClientIssue = {
    field: string;
    message: string;
};

export function validateWorkflowDraft(draft: WorkflowDraft): WorkflowClientIssue[] {
    const issues: WorkflowClientIssue[] = [];

    if (draft.name.trim() === '') {
        issues.push({ field: 'name', message: 'Name is required.' });
    }

    if (!WORKFLOW_TRIGGERS.includes(draft.trigger as WorkflowTrigger)) {
        issues.push({ field: 'trigger', message: 'Choose a supported trigger.' });
    }

    if (draft.trigger === 'deal.stage_changed' && draft.trigger_stage_id === '') {
        issues.push({ field: 'trigger_stage_id', message: 'Choose the destination stage.' });
    }

    if (
        (draft.trigger === 'segment.entered' || draft.trigger === 'segment.exited') &&
        draft.trigger_saved_filter_id === ''
    ) {
        issues.push({ field: 'trigger_saved_filter_id', message: 'Choose a contact segment.' });
    }

    if (!WORKFLOW_ACTIONS.includes(draft.action as WorkflowAction)) {
        issues.push({ field: 'action', message: 'Choose a supported action.' });
    }

    issues.push(...validateActionFields(draft.action, draft, ''));

    if (draft.condition_field !== '') {
        if (!WORKFLOW_OPERATORS.includes(draft.condition_operator as WorkflowOperator)) {
            issues.push({ field: 'condition_operator', message: 'Choose a supported operator.' });
        }

        if (operatorNeedsValue(draft.condition_operator) && draft.condition_value.trim() === '') {
            issues.push({ field: 'condition_value', message: 'Condition value is required.' });
        }

        if (draft.else_action !== '') {
            if (!WORKFLOW_ACTIONS.includes(draft.else_action as WorkflowAction)) {
                issues.push({ field: 'else_action', message: 'Choose a supported else action.' });
            } else {
                issues.push(...validateActionFields(draft.else_action, draft, 'else_'));
            }
        }
    }

    return issues;
}

function validateActionFields(
    action: string,
    draft: WorkflowDraft,
    prefix: '' | 'else_',
): WorkflowClientIssue[] {
    const issues: WorkflowClientIssue[] = [];

    if (action === 'send_webhook') {
        const url = prefix ? draft.else_webhook_url : draft.webhook_url;

        if (url.trim() === '') {
            issues.push({ field: `${prefix}webhook_url`, message: 'Webhook URL is required.' });
        }
    }

    if (action === 'set_property') {
        const field = prefix ? draft.else_property_field : draft.property_field;
        const value = prefix ? draft.else_property_value : draft.property_value;

        if (field.trim() === '') {
            issues.push({ field: `${prefix}property_field`, message: 'Property field is required.' });
        }

        if (value.trim() === '') {
            issues.push({ field: `${prefix}property_value`, message: 'Property value is required.' });
        }
    }

    if (action === 'assign_owner') {
        const ownerId = prefix ? draft.else_assign_owner_id : draft.assign_owner_id;

        if (ownerId.trim() === '') {
            issues.push({ field: `${prefix}assign_owner_id`, message: 'Choose an owner.' });
        }
    }

    if (action === 'create_deal') {
        const title = prefix ? draft.else_subject : draft.subject;

        if (title.trim() === '') {
            issues.push({ field: `${prefix}subject`, message: 'Deal title is required.' });
        }
    }

    if (action === 'send_email' || action === 'notify_user') {
        const subject = prefix ? draft.else_subject : draft.subject;
        const body = prefix ? draft.else_body : draft.body;

        if (subject.trim() === '') {
            issues.push({ field: `${prefix}subject`, message: 'Subject is required.' });
        }

        if (body.trim() === '') {
            issues.push({ field: `${prefix}body`, message: 'Body is required.' });
        }
    }

    return issues;
}

export function workflowFormPayload(
    draft: WorkflowDraft,
    options: { includeActive?: boolean; active?: boolean } = {},
): Record<string, string | number | boolean | null> {
    const branched = draft.condition_field !== '';
    const payload: Record<string, string | number | boolean | null> = {
        name: draft.name.trim(),
        trigger: draft.trigger,
        trigger_stage_id:
            draft.trigger === 'deal.stage_changed' && draft.trigger_stage_id !== ''
                ? Number(draft.trigger_stage_id)
                : null,
        trigger_status:
            draft.trigger === 'ticket.status_changed' && draft.trigger_status !== ''
                ? draft.trigger_status
                : null,
        trigger_saved_filter_id:
            (draft.trigger === 'segment.entered' || draft.trigger === 'segment.exited') &&
            draft.trigger_saved_filter_id !== ''
                ? Number(draft.trigger_saved_filter_id)
                : null,
        delay_minutes: Number(draft.delay_minutes || 0),
        action: draft.action,
        subject: draft.subject,
        body: draft.body,
        due_in_days: Number(draft.due_in_days || 1),
        sequence_id: draft.sequence_id !== '' ? Number(draft.sequence_id) : null,
        webhook_url: draft.webhook_url,
        property_entity: draft.property_entity,
        property_field: draft.property_field,
        property_value: draft.property_value,
        assign_entity: draft.assign_entity,
        assign_owner_id: draft.assign_owner_id !== '' ? Number(draft.assign_owner_id) : null,
        notify_user_id: draft.notify_user_id !== '' ? Number(draft.notify_user_id) : null,
        condition_field: branched ? draft.condition_field : null,
        condition_operator: branched ? draft.condition_operator : null,
        condition_value:
            branched && operatorNeedsValue(draft.condition_operator) ? draft.condition_value : null,
        else_action: branched && draft.else_action !== '' ? draft.else_action : null,
        else_subject: draft.else_subject,
        else_body: draft.else_body,
        else_due_in_days: Number(draft.else_due_in_days || 1),
        else_sequence_id: draft.else_sequence_id !== '' ? Number(draft.else_sequence_id) : null,
        else_webhook_url: draft.else_webhook_url,
        else_property_entity: draft.else_property_entity,
        else_property_field: draft.else_property_field,
        else_property_value: draft.else_property_value,
        else_assign_entity: draft.else_assign_entity,
        else_assign_owner_id:
            draft.else_assign_owner_id !== '' ? Number(draft.else_assign_owner_id) : null,
        else_notify_user_id:
            draft.else_notify_user_id !== '' ? Number(draft.else_notify_user_id) : null,
    };

    if (options.includeActive) {
        payload.active = options.active ?? false;
    }

    return payload;
}

export function draftsEqual(left: WorkflowDraft, right: WorkflowDraft): boolean {
    return JSON.stringify(left) === JSON.stringify(right);
}

function triggerSummary(draft: WorkflowDraft, stages: WorkflowStage[]): string {
    const label = triggerLabel(draft.trigger).toLowerCase();

    if (draft.trigger === 'deal.stage_changed') {
        const stage = stages.find((item) => String(item.id) === draft.trigger_stage_id);

        return stage
            ? `When a deal moves to ${stage.name}`
            : 'When a deal stage changes';
    }

    if (draft.trigger === 'ticket.status_changed' && draft.trigger_status) {
        return `When a ticket status changes to ${draft.trigger_status.replaceAll('_', ' ')}`;
    }

    if (draft.trigger === 'contact.created') {
        return 'When a contact is created';
    }

    if (draft.trigger === 'deal.created') {
        return 'When a deal is created';
    }

    return `When ${label}`;
}

function actionSummary(action: string, subject?: string): string {
    if (action === 'create_task') {
        return subject?.trim() ? `create a task “${subject.trim()}”` : 'create a task';
    }

    if (action === 'enroll_sequence') {
        return 'enroll the contact in a sequence';
    }

    if (action === 'send_webhook') {
        return 'send a webhook';
    }

    if (action === 'set_property') {
        return 'update a property';
    }

    if (action === 'assign_owner') {
        return 'assign an owner';
    }

    if (action === 'create_deal') {
        return subject?.trim() ? `create a deal “${subject.trim()}”` : 'create a deal';
    }

    if (action === 'send_email') {
        return 'send an email';
    }

    if (action === 'notify_user') {
        return 'notify a user';
    }

    return actionLabel(action).toLowerCase();
}

export function summarizeWorkflow(
    draft: WorkflowDraft,
    fields: WorkflowConditionField[] = [],
    stages: WorkflowStage[] = [],
): string {
    const parts = [triggerSummary(draft, stages)];

    if (draft.condition_field) {
        const field = conditionFieldLabel(draft.condition_field, fields);
        const operator = operatorLabel(draft.condition_operator);

        if (operatorNeedsValue(draft.condition_operator) && draft.condition_value.trim() !== '') {
            parts.push(`and ${field} ${operator} ${draft.condition_value.trim()}`);
        } else {
            parts.push(`and ${field} ${operator}`);
        }
    }

    parts.push(actionSummary(draft.action, draft.subject));

    if (draft.condition_field && draft.else_action) {
        parts.push(`else ${actionSummary(draft.else_action, draft.else_subject)}`);
    }

    const [when, ...rest] = parts;

    if (rest.length === 0) {
        return when;
    }

    return `${when} ${rest.join(' ')}.`.replace(' .', '.');
}

export function summarizeWorkflowRow(
    workflow: WorkflowRow,
    fields: WorkflowConditionField[] = [],
    stages: WorkflowStage[] = [],
): string {
    return summarizeWorkflow(draftFromWorkflow(workflow), fields, stages);
}

export function formatWorkflowTimestamp(iso: string | null): string {
    if (!iso) {
        return '—';
    }

    const date = new Date(iso);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export function workflowStatusLabel(active: boolean): 'Active' | 'Draft' {
    return active ? 'Active' : 'Draft';
}

export function isRegisteredTrigger(value: string): boolean {
    return WORKFLOW_TRIGGERS.includes(value as WorkflowTrigger);
}

export function isRegisteredAction(value: string): boolean {
    return WORKFLOW_ACTIONS.includes(value as WorkflowAction);
}

export function isRegisteredOperator(value: string): boolean {
    return WORKFLOW_OPERATORS.includes(value as WorkflowOperator);
}
