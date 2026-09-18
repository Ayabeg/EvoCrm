/**
 * Test-only P19 automation authoring proofs. Never import from an Inertia page.
 * Pest source-locks this file. Do not spawn vite-node from CI.
 */
import {
    WORKFLOW_ACTIONS,
    WORKFLOW_OPERATORS,
    WORKFLOW_TRIGGERS,
    actionAvailability,
    beginExclusiveAction,
    draftFromWorkflow,
    draftsEqual,
    emptyWorkflowDraft,
    isRegisteredAction,
    isRegisteredOperator,
    isRegisteredTrigger,
    operatorNeedsValue,
    releaseExclusiveAction,
    summarizeWorkflow,
    validateWorkflowDraft,
    workflowFormPayload,
    workflowStatusLabel,
} from '../../resources/js/lib/workflow-authoring';
import type { WorkflowRow } from '../../resources/js/lib/workflow-authoring';

function expectEqual<T>(actual: T, expected: T, label: string): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

function expectTrue(value: boolean, label: string): void {
    if (!value) {
        throw new Error(label);
    }
}

expectEqual(
    [...WORKFLOW_TRIGGERS],
    [
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
    ],
    'trigger registry matches Workflow::triggers()',
);

expectEqual(
    [...WORKFLOW_ACTIONS],
    [
        'create_task',
        'enroll_sequence',
        'send_webhook',
        'set_property',
        'assign_owner',
        'create_deal',
        'send_email',
        'notify_user',
    ],
    'action registry matches Workflow::actions()',
);

expectEqual(
    [...WORKFLOW_OPERATORS],
    ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'is_set', 'is_empty'],
    'operators match Workflow::operators()',
);

expectTrue(isRegisteredTrigger('contact.created'), 'contact.created is registered');
expectTrue(!isRegisteredTrigger('deal.won'), 'invented trigger is rejected');
expectTrue(isRegisteredAction('create_task'), 'create_task is registered');
expectTrue(!isRegisteredAction('send_whatsapp'), 'invented action is rejected');
expectTrue(isRegisteredOperator('gte'), 'gte is registered');
expectTrue(!isRegisteredOperator('starts_with'), 'frontend-only operator is rejected');
expectTrue(operatorNeedsValue('eq'), 'eq needs a value');
expectTrue(!operatorNeedsValue('is_set'), 'is_set does not need a value');
expectTrue(!operatorNeedsValue('is_empty'), 'is_empty does not need a value');

expectEqual(
    actionAvailability('send_email', {
        can_manage: true,
        has_mailbox: false,
        has_sequences: true,
    }).available,
    false,
    'send_email is unavailable without a mailbox',
);

expectEqual(
    actionAvailability('enroll_sequence', {
        can_manage: true,
        has_mailbox: true,
        has_sequences: false,
    }).available,
    false,
    'enroll_sequence is unavailable without a sequence',
);

const simple = emptyWorkflowDraft();
simple.name = 'New contact task';
simple.trigger = 'contact.created';
simple.action = 'create_task';
simple.subject = 'Introduce Evotechly to {{contact}}';

expectEqual(
    summarizeWorkflow(simple),
    'When a contact is created create a task “Introduce Evotechly to {{contact}}”.',
    'simple summary is deterministic',
);

const conditional = emptyWorkflowDraft();
conditional.name = 'Qualified follow-up';
conditional.trigger = 'deal.created';
conditional.action = 'create_task';
conditional.subject = 'Call today';
conditional.condition_field = 'deal.amount';
conditional.condition_operator = 'gte';
conditional.condition_value = '500000';

expectEqual(
    summarizeWorkflow(conditional, [{ value: 'deal.amount', label: 'Deal amount (DZD)' }]),
    'When a deal is created and Deal amount (DZD) at least 500000 create a task “Call today”.',
    'conditional summary is deterministic',
);

const branched = { ...conditional, else_action: 'create_task', else_subject: 'Light check-in' };
expectTrue(
    summarizeWorkflow(branched, [{ value: 'deal.amount', label: 'Deal amount (DZD)' }]).includes(
        'else create a task “Light check-in”',
    ),
    'else is included only when the engine branch exists',
);

const missing = emptyWorkflowDraft();
const issues = validateWorkflowDraft(missing);
expectTrue(
    issues.some((issue) => issue.field === 'name'),
    'name is required',
);

const webhook = emptyWorkflowDraft();
webhook.name = 'Ping';
webhook.action = 'send_webhook';
expectTrue(
    validateWorkflowDraft(webhook).some((issue) => issue.field === 'webhook_url'),
    'webhook URL is required',
);

const noValue = emptyWorkflowDraft();
noValue.name = 'Need value';
noValue.condition_field = 'contact.city';
noValue.condition_operator = 'eq';
noValue.condition_value = '';
expectTrue(
    validateWorkflowDraft(noValue).some((issue) => issue.field === 'condition_value'),
    'eq condition requires a value',
);

const isSet = emptyWorkflowDraft();
isSet.name = 'Has email';
isSet.condition_field = 'contact.email';
isSet.condition_operator = 'is_set';
expectTrue(
    !validateWorkflowDraft(isSet).some((issue) => issue.field === 'condition_value'),
    'is_set does not require a value',
);

const payload = workflowFormPayload(simple, { includeActive: true, active: false });
expectEqual(payload.active, false, 'create payload can stay draft');
expectEqual(payload.trigger, 'contact.created', 'payload trigger is stored identifier');
expectEqual(payload.action, 'create_task', 'payload action is stored identifier');
expectTrue(!('actions' in payload), 'no multi-action array is serialized');

const row: WorkflowRow = {
    id: 9,
    name: 'Gros deal',
    trigger: 'deal.created',
    trigger_stage: null,
    trigger_stage_id: null,
    trigger_status: null,
    trigger_status_label: null,
    trigger_saved_filter_id: null,
    action: 'create_task',
    action_config: { subject: 'Call today', due_in_days: 0 },
    condition_field: 'deal.amount',
    condition_operator: 'gte',
    condition_value: '500000',
    else_action: 'create_task',
    else_action_config: { subject: 'Light check-in', due_in_days: 1 },
    active: true,
    template_key: null,
    delay_minutes: 0,
    created_at: '2026-09-17T00:00:00.000000Z',
    updated_at: '2026-09-17T00:00:00.000000Z',
};

const hydrated = draftFromWorkflow(row);
const roundTrip = workflowFormPayload(hydrated);
expectEqual(roundTrip.trigger, 'deal.created', 'round-trip trigger');
expectEqual(roundTrip.condition_field, 'deal.amount', 'round-trip condition field');
expectEqual(roundTrip.condition_operator, 'gte', 'round-trip operator');
expectEqual(roundTrip.condition_value, '500000', 'round-trip value');
expectEqual(roundTrip.else_action, 'create_task', 'round-trip else');
expectEqual(roundTrip.else_subject, 'Light check-in', 'round-trip else subject');
expectTrue(draftsEqual(hydrated, draftFromWorkflow(row)), 'hydrate is stable');
expectEqual(workflowStatusLabel(false), 'Draft', 'inactive is Draft');
expectEqual(workflowStatusLabel(true), 'Active', 'active is Active');

const lock = { current: false };
const workflows: string[] = [];
const saveOnce = () => {
    if (!beginExclusiveAction(lock)) {
        return;
    }

    workflows.push('P19 exclusive save');
};
saveOnce();
saveOnce();
expectEqual(workflows, ['P19 exclusive save'], 'two synchronous save attempts create one workflow');
expectTrue(lock.current, 'lock stays held until release so a 422 can retry after release');
releaseExclusiveAction(lock);
expectTrue(!lock.current, '422/failure releaseExclusiveAction unlocks retry');
saveOnce();
expectEqual(workflows, ['P19 exclusive save', 'P19 exclusive save'], 'retry after failure is allowed');
expectTrue(!draftsEqual(emptyWorkflowDraft(), {
    ...emptyWorkflowDraft(),
    name: 'Dirty after 422',
}), 'failed save keeps a dirty draft');

console.log('p19-automation-authoring proofs passed');
