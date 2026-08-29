import { Form } from '@inertiajs/react';
import { useState } from 'react';
import { CreateDrawer } from '@/components/crm/create-drawer';
import { CrmShell } from '@/components/crm/crm-shell';
import { HairlinePanel } from '@/components/surface/hairline-panel';
import {
    HairlineRow,
    HairlineTable,
    HairlineTd,
    HairlineTh,
} from '@/components/surface/hairline-table';
import { SurfaceHeader } from '@/components/surface/surface-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';

type WorkflowRow = {
    id: number;
    name: string;
    trigger: string;
    trigger_stage: string | null;
    action: string;
    action_config: Record<string, unknown>;
    condition_field: string | null;
    condition_operator: string | null;
    condition_value: string | null;
    else_action: string | null;
    else_action_config: Record<string, unknown>;
    active: boolean;
    template_key: string | null;
    created_at: string | null;
};

type Template = {
    key: string;
    name: string;
    description: string;
    trigger: string;
    action: string;
};

type Stage = {
    id: number;
    name: string;
    slug: string;
};

type Sequence = {
    id: number;
    name: string;
    channel: string;
};

type ConditionField = {
    value: string;
    label: string;
};

const triggerLabel: Record<string, string> = {
    'contact.created': 'Contact created',
    'deal.stage_changed': 'Deal stage changed',
    'deal.created': 'Deal created',
    'enrollment.finished': 'Sequence finished',
    'segment.entered': 'Segment entered',
    'segment.exited': 'Segment exited',
    'enrollment.replied': 'Sequence reply received',
    'lead.scored': 'Lead scored',
    'lead.qualified': 'Lead qualified',
};

const actionLabel: Record<string, string> = {
    create_task: 'Create task',
    enroll_sequence: 'Enroll in sequence',
    send_webhook: 'Send webhook',
    set_property: 'Set property',
    assign_owner: 'Assign owner',
    create_deal: 'Create deal',
    send_email: 'Send email',
    notify_user: 'Notify user',
};

const operatorLabel: Record<string, string> = {
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

function FieldLabel({ children }: { children: string }) {
    return <Label className="mb-1 block">{children}</Label>;
}

function ActionFields({
    action,
    prefix,
    sequences,
}: {
    action: string;
    prefix: '' | 'else_';
    sequences: Sequence[];
}) {
    if (action === 'enroll_sequence') {
        return (
            <div>
                <FieldLabel>{prefix ? 'Else sequence' : 'Sequence'}</FieldLabel>
                <NativeSelect name={`${prefix}sequence_id`} defaultValue="">
                    <option value="">First sequence in the workspace</option>
                    {sequences.map((sequence) => (
                        <option key={sequence.id} value={sequence.id}>
                            {sequence.name}
                        </option>
                    ))}
                </NativeSelect>
            </div>
        );
    }

    if (action === 'send_webhook') {
        return (
            <div className="md:col-span-2">
                <FieldLabel>{prefix ? 'Else webhook URL' : 'Webhook URL'}</FieldLabel>
                <Input
                    name={`${prefix}webhook_url`}
                    type="url"
                    required
                    placeholder="https://hooks.evotechly.dz/deals"
                />
            </div>
        );
    }

    if (action === 'set_property') {
        return (
            <>
                <div>
                    <FieldLabel>{prefix ? 'Else entity' : 'Entity'}</FieldLabel>
                    <NativeSelect
                        name={`${prefix}property_entity`}
                        defaultValue="contact"
                    >
                        <option value="contact">Contact</option>
                        <option value="deal">Deal</option>
                    </NativeSelect>
                </div>
                <div>
                    <FieldLabel>
                        {prefix ? 'Else property field' : 'Property field'}
                    </FieldLabel>
                    <Input
                        name={`${prefix}property_field`}
                        placeholder="wilaya"
                        required
                    />
                </div>
                <div className="md:col-span-2">
                    <FieldLabel>
                        {prefix ? 'Else property value' : 'Property value'}
                    </FieldLabel>
                    <Input
                        name={`${prefix}property_value`}
                        placeholder="Alger"
                        required
                    />
                </div>
            </>
        );
    }

    if (action === 'assign_owner') {
        return (
            <>
                <div>
                    <FieldLabel>{prefix ? 'Else record' : 'Record'}</FieldLabel>
                    <NativeSelect
                        name={`${prefix}assign_entity`}
                        defaultValue="contact"
                    >
                        <option value="contact">Contact</option>
                        <option value="deal">Deal</option>
                    </NativeSelect>
                </div>
                <div>
                    <FieldLabel>
                        {prefix ? 'Else owner user id' : 'Owner user id'}
                    </FieldLabel>
                    <Input
                        name={`${prefix}assign_owner_id`}
                        type="number"
                        min={1}
                        required
                    />
                </div>
            </>
        );
    }

    if (action === 'create_deal') {
        return (
            <>
                <div>
                    <FieldLabel>
                        {prefix ? 'Else deal title' : 'Deal title'}
                    </FieldLabel>
                    <Input
                        name={`${prefix}subject`}
                        placeholder="New opportunity"
                        required
                    />
                </div>
                <div>
                    <FieldLabel>
                        {prefix ? 'Else amount (DZD)' : 'Amount (DZD)'}
                    </FieldLabel>
                    <Input
                        name={`${prefix}property_value`}
                        type="number"
                        min={0}
                        placeholder="500000"
                    />
                </div>
            </>
        );
    }

    if (action === 'send_email' || action === 'notify_user') {
        return (
            <>
                <div>
                    <FieldLabel>{prefix ? 'Else subject' : 'Subject'}</FieldLabel>
                    <Input
                        name={`${prefix}subject`}
                        placeholder="Follow up from EvoSales"
                        required
                    />
                </div>
                <div className="md:col-span-2">
                    <FieldLabel>{prefix ? 'Else body' : 'Body'}</FieldLabel>
                    <Input
                        name={`${prefix}body`}
                        placeholder="Message body"
                        required
                    />
                </div>
            </>
        );
    }

    if (action === 'create_task') {
        return (
            <>
                <div>
                    <FieldLabel>
                        {prefix ? 'Else task subject' : 'Task subject'}
                    </FieldLabel>
                    <Input
                        name={`${prefix}subject`}
                        placeholder="Introduce Evotechly to {{contact}}"
                    />
                </div>
                <div>
                    <FieldLabel>
                        {prefix ? 'Else due in days' : 'Due in days'}
                    </FieldLabel>
                    <Input
                        name={`${prefix}due_in_days`}
                        type="number"
                        min={0}
                        max={90}
                        defaultValue={1}
                    />
                </div>
            </>
        );
    }

    return null;
}

export default function WorkflowsIndex({
    workflows,
    templates,
    stages,
    sequences,
    segments = [],
    condition_fields = [],
}: {
    workflows: WorkflowRow[];
    templates: Template[];
    stages: Stage[];
    sequences: Sequence[];
    segments?: Array<{ id: number; name: string }>;
    condition_fields?: ConditionField[];
}) {
    const [createOpen, setCreateOpen] = useState(false);
    const [trigger, setTrigger] = useState('contact.created');
    const [action, setAction] = useState('create_task');
    const [branched, setBranched] = useState(false);
    const [conditionField, setConditionField] = useState('deal.amount');
    const [conditionOperator, setConditionOperator] = useState('gte');
    const [elseAction, setElseAction] = useState('');

    const needsConditionValue =
        conditionOperator !== 'is_set' && conditionOperator !== 'is_empty';

    return (
        <CrmShell title="Automation">
            <div className="h-full overflow-y-auto">
                <div className="flex-1 space-y-5 p-6">
                    <SurfaceHeader
                        title="Automation"
                        description="Triggers on contacts, deals, sequences, and segments. Actions include tasks, sequences, property updates, email, webhooks, and delayed runs."
                    >
                        <Button size="sm" onClick={() => setCreateOpen(true)}>
                            Create workflow
                        </Button>
                    </SurfaceHeader>

                    <HairlinePanel>
                        <div className="border-b border-hairline px-4 py-3">
                            <h2 className="aurora-text-ui font-medium text-ink">
                                Evo templates
                            </h2>
                            <p className="aurora-text-caption mt-1 text-mute">
                                Evotechly starters for Algerian sales work. They write
                                into your workspace.
                            </p>
                        </div>
                        <ul className="divide-y divide-hairline">
                            {templates.map((template) => (
                                <li
                                    key={template.key}
                                    className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"
                                >
                                    <div>
                                        <p className="aurora-text-body-sm font-medium text-ink">
                                            {template.name}
                                        </p>
                                        <p className="aurora-text-caption mt-0.5 text-mute">
                                            {template.description}
                                        </p>
                                    </div>
                                    <Form
                                        action="/crm/workflows/templates"
                                        method="post"
                                    >
                                        <input
                                            type="hidden"
                                            name="template_key"
                                            value={template.key}
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="shrink-0"
                                        >
                                            Use template
                                        </Button>
                                    </Form>
                                </li>
                            ))}
                        </ul>
                    </HairlinePanel>

                    <HairlinePanel>
                        <HairlineTable minWidth="40rem">
                            <thead>
                                <tr className="border-b border-hairline">
                                    <HairlineTh>Name</HairlineTh>
                                    <HairlineTh>Trigger</HairlineTh>
                                    <HairlineTh>Action</HairlineTh>
                                    <HairlineTh>Status</HairlineTh>
                                    <HairlineTh align="right" />
                                </tr>
                            </thead>
                            <tbody>
                                {workflows.map((workflow) => (
                                    <HairlineRow key={workflow.id}>
                                        <HairlineTd className="font-medium">
                                            {workflow.name}
                                        </HairlineTd>
                                        <HairlineTd>
                                            {triggerLabel[workflow.trigger] ??
                                                workflow.trigger}
                                            {workflow.trigger_stage
                                                ? ` → ${workflow.trigger_stage}`
                                                : ''}
                                        </HairlineTd>
                                        <HairlineTd>
                                            <div>
                                                {actionLabel[workflow.action] ??
                                                    workflow.action}
                                            </div>
                                            {workflow.condition_field ? (
                                                <div className="aurora-text-caption mt-1 text-mute">
                                                    If {workflow.condition_field}{' '}
                                                    {operatorLabel[
                                                        workflow.condition_operator ??
                                                            ''
                                                    ] ??
                                                        workflow.condition_operator}{' '}
                                                    {workflow.condition_operator ===
                                                        'is_set' ||
                                                    workflow.condition_operator ===
                                                        'is_empty'
                                                        ? ''
                                                        : (workflow.condition_value ??
                                                          '')}
                                                    {workflow.else_action
                                                        ? ` · else ${actionLabel[workflow.else_action] ?? workflow.else_action}`
                                                        : ''}
                                                </div>
                                            ) : null}
                                        </HairlineTd>
                                        <HairlineTd>
                                            {workflow.active ? 'On' : 'Off'}
                                        </HairlineTd>
                                        <HairlineTd>
                                            <div className="flex justify-end gap-2">
                                                <Form
                                                    action={`/crm/workflows/${workflow.id}/toggle`}
                                                    method="post"
                                                >
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        {workflow.active
                                                            ? 'Turn off'
                                                            : 'Turn on'}
                                                    </Button>
                                                </Form>
                                                <Form
                                                    action={`/crm/workflows/${workflow.id}`}
                                                    method="delete"
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-brand"
                                                    >
                                                        Delete
                                                    </Button>
                                                </Form>
                                            </div>
                                        </HairlineTd>
                                    </HairlineRow>
                                ))}
                                {workflows.length === 0 ? (
                                    <HairlineRow>
                                        <HairlineTd
                                            colSpan={5}
                                            className="py-6 text-mute"
                                        >
                                            No workflows yet. Use an Evo template
                                            or create one.
                                        </HairlineTd>
                                    </HairlineRow>
                                ) : null}
                            </tbody>
                        </HairlineTable>
                    </HairlinePanel>
                </div>
            </div>

            <CreateDrawer
                open={createOpen}
                onOpenChange={setCreateOpen}
                title="Create workflow"
                description="Name a trigger, optional delay, then an action. Add an if/then branch for deal amount, stage, or a contact property."
                showFormLink={false}
                className="sm:max-w-lg"
            >
                <Form
                    action="/crm/workflows"
                    method="post"
                    className="grid gap-3 md:grid-cols-2"
                    resetOnSuccess
                    onSuccess={() => {
                        setCreateOpen(false);
                        setBranched(false);
                        setTrigger('contact.created');
                        setAction('create_task');
                        setElseAction('');
                    }}
                >
                    {({ processing }) => (
                        <>
                            <div className="md:col-span-2">
                                <FieldLabel>Name</FieldLabel>
                                <Input
                                    name="name"
                                    required
                                    placeholder="New Evotechly contact - first task"
                                />
                            </div>
                            <div>
                                <FieldLabel>Trigger</FieldLabel>
                                <NativeSelect
                                    name="trigger"
                                    value={trigger}
                                    onChange={(event) =>
                                        setTrigger(event.target.value)
                                    }
                                >
                                    <option value="contact.created">
                                        Contact created
                                    </option>
                                    <option value="deal.created">Deal created</option>
                                    <option value="deal.stage_changed">
                                        Deal stage changed
                                    </option>
                                    <option value="enrollment.finished">
                                        Sequence finished
                                    </option>
                                    <option value="segment.entered">
                                        Segment entered
                                    </option>
                                    <option value="segment.exited">
                                        Segment exited
                                    </option>
                                    <option value="enrollment.replied">
                                        Sequence reply received
                                    </option>
                                    <option value="lead.scored">
                                        Lead scored
                                    </option>
                                    <option value="lead.qualified">
                                        Lead qualified
                                    </option>
                                </NativeSelect>
                            </div>
                            {trigger === 'deal.stage_changed' ? (
                                <div>
                                    <FieldLabel>To stage</FieldLabel>
                                    <NativeSelect name="trigger_stage_id" required>
                                        {stages.map((stage) => (
                                            <option key={stage.id} value={stage.id}>
                                                {stage.name}
                                            </option>
                                        ))}
                                    </NativeSelect>
                                </div>
                            ) : trigger === 'segment.entered' ||
                              trigger === 'segment.exited' ? (
                                <div>
                                    <FieldLabel>Segment</FieldLabel>
                                    <NativeSelect
                                        name="trigger_saved_filter_id"
                                        required
                                    >
                                        <option value="">
                                            Pick a contact segment…
                                        </option>
                                        {segments.map((segment) => (
                                            <option
                                                key={segment.id}
                                                value={segment.id}
                                            >
                                                {segment.name}
                                            </option>
                                        ))}
                                    </NativeSelect>
                                </div>
                            ) : (
                                <div />
                            )}
                            <div>
                                <FieldLabel>Delay (minutes, optional)</FieldLabel>
                                <Input
                                    name="delay_minutes"
                                    type="number"
                                    min={0}
                                    defaultValue={0}
                                />
                            </div>
                            <div>
                                <FieldLabel>Then action</FieldLabel>
                                <NativeSelect
                                    name="action"
                                    value={action}
                                    onChange={(event) =>
                                        setAction(event.target.value)
                                    }
                                >
                                    <option value="create_task">
                                        Create task on the record
                                    </option>
                                    <option value="enroll_sequence">
                                        Enroll contact in a sequence
                                    </option>
                                    <option value="set_property">Set property</option>
                                    <option value="assign_owner">
                                        Assign owner
                                    </option>
                                    <option value="create_deal">Create deal</option>
                                    <option value="send_email">Send email</option>
                                    <option value="notify_user">Notify user</option>
                                    <option value="send_webhook">
                                        Send webhook URL
                                    </option>
                                </NativeSelect>
                            </div>
                            <ActionFields
                                action={action}
                                prefix=""
                                sequences={sequences}
                            />

                            <div className="md:col-span-2 flex items-center gap-2 pt-1">
                                <input
                                    id="workflow-branch"
                                    type="checkbox"
                                    checked={branched}
                                    onChange={(event) =>
                                        setBranched(event.target.checked)
                                    }
                                    className="size-4 accent-brand"
                                />
                                <Label htmlFor="workflow-branch">
                                    If / then branch (deal amount, stage, or contact
                                    property)
                                </Label>
                            </div>

                            {branched ? (
                                <>
                                    <div>
                                        <FieldLabel>If field</FieldLabel>
                                        <NativeSelect
                                            name="condition_field"
                                            value={conditionField}
                                            onChange={(event) =>
                                                setConditionField(event.target.value)
                                            }
                                        >
                                            {condition_fields.map((field) => (
                                                <option
                                                    key={field.value}
                                                    value={field.value}
                                                >
                                                    {field.label}
                                                </option>
                                            ))}
                                        </NativeSelect>
                                    </div>
                                    <div>
                                        <FieldLabel>Operator</FieldLabel>
                                        <NativeSelect
                                            name="condition_operator"
                                            value={conditionOperator}
                                            onChange={(event) =>
                                                setConditionOperator(
                                                    event.target.value,
                                                )
                                            }
                                        >
                                            <option value="eq">equals</option>
                                            <option value="neq">does not equal</option>
                                            <option value="gt">greater than</option>
                                            <option value="gte">
                                                greater or equal
                                            </option>
                                            <option value="lt">less than</option>
                                            <option value="lte">less or equal</option>
                                            <option value="contains">contains</option>
                                            <option value="is_set">is set</option>
                                            <option value="is_empty">is empty</option>
                                        </NativeSelect>
                                    </div>
                                    {needsConditionValue ? (
                                        conditionField === 'deal.stage' ? (
                                            <div>
                                                <FieldLabel>Stage value</FieldLabel>
                                                <NativeSelect
                                                    name="condition_value"
                                                    required
                                                >
                                                    {stages.map((stage) => (
                                                        <option
                                                            key={stage.id}
                                                            value={stage.slug}
                                                        >
                                                            {stage.name}
                                                        </option>
                                                    ))}
                                                </NativeSelect>
                                            </div>
                                        ) : (
                                            <div>
                                                <FieldLabel>
                                                    {conditionField === 'deal.amount'
                                                        ? 'Amount (DZD)'
                                                        : 'Value'}
                                                </FieldLabel>
                                                <Input
                                                    name="condition_value"
                                                    required
                                                    placeholder={
                                                        conditionField ===
                                                        'deal.amount'
                                                            ? '500000'
                                                            : 'Alger'
                                                    }
                                                />
                                            </div>
                                        )
                                    ) : null}
                                    <div>
                                        <FieldLabel>Else action</FieldLabel>
                                        <NativeSelect
                                            name="else_action"
                                            value={elseAction}
                                            onChange={(event) =>
                                                setElseAction(event.target.value)
                                            }
                                        >
                                            <option value="">Do nothing</option>
                                            <option value="create_task">
                                                Create task on the record
                                            </option>
                                            <option value="enroll_sequence">
                                                Enroll contact in a sequence
                                            </option>
                                            <option value="set_property">
                                                Set property
                                            </option>
                                            <option value="assign_owner">
                                                Assign owner
                                            </option>
                                            <option value="create_deal">
                                                Create deal
                                            </option>
                                            <option value="send_email">
                                                Send email
                                            </option>
                                            <option value="notify_user">
                                                Notify user
                                            </option>
                                            <option value="send_webhook">
                                                Send webhook URL
                                            </option>
                                        </NativeSelect>
                                    </div>
                                    <ActionFields
                                        action={elseAction}
                                        prefix="else_"
                                        sequences={sequences}
                                    />
                                </>
                            ) : null}

                            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setCreateOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button disabled={processing}>
                                    Create workflow
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </CreateDrawer>
        </CrmShell>
    );
}

WorkflowsIndex.layout = {
    breadcrumbs: [{ title: 'Automation', href: '/crm/workflows' }],
};
