import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
};

const actionLabel: Record<string, string> = {
    create_task: 'Create task',
    enroll_sequence: 'Enroll in sequence',
    send_webhook: 'Send webhook',
    set_property: 'Set property',
    assign_owner: 'Assign owner',
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

const selectClass = 'h-9 w-full rounded-md border border-hairline bg-background px-2 text-sm';

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
                <Label>{prefix ? 'Else sequence' : 'Sequence'}</Label>
                <select name={`${prefix}sequence_id`} className={selectClass} defaultValue="">
                    <option value="">First sequence in the workspace</option>
                    {sequences.map((sequence) => (
                        <option key={sequence.id} value={sequence.id}>
                            {sequence.name}
                        </option>
                    ))}
                </select>
            </div>
        );
    }

    if (action === 'send_webhook') {
        return (
            <div className="md:col-span-2">
                <Label>{prefix ? 'Else webhook URL' : 'Webhook URL'}</Label>
                <Input
                    name={`${prefix}webhook_url`}
                    type="url"
                    required
                    placeholder="https://hooks.evotechly.dz/deals"
                />
            </div>
        );
    }

    if (action === 'create_task') {
        return (
            <>
                <div>
                    <Label>{prefix ? 'Else task subject' : 'Task subject'}</Label>
                    <Input name={`${prefix}subject`} placeholder="Introduce Evotechly to {{contact}}" />
                </div>
                <div>
                    <Label>{prefix ? 'Else due in days' : 'Due in days'}</Label>
                    <Input name={`${prefix}due_in_days`} type="number" min={0} max={90} defaultValue={1} />
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
    condition_fields = [],
}: {
    workflows: WorkflowRow[];
    templates: Template[];
    stages: Stage[];
    sequences: Sequence[];
    condition_fields?: ConditionField[];
}) {
    const [trigger, setTrigger] = useState('contact.created');
    const [action, setAction] = useState('create_task');
    const [branched, setBranched] = useState(false);
    const [conditionField, setConditionField] = useState('deal.amount');
    const [conditionOperator, setConditionOperator] = useState('gte');
    const [elseAction, setElseAction] = useState('');

    const needsConditionValue = conditionOperator !== 'is_set' && conditionOperator !== 'is_empty';

    return (
        <>
            <Head title="Automation" />
            <div className="flex-1 space-y-6 p-6">
                <PageHeader
                    title="Automation"
                    description="Evotechly workflows that run in EvoSales when a contact is created, a deal is created, or a deal changes stage. Create a task, enroll the contact in an outbound sequence, or post an optional webhook. Add an if/then branch on deal amount, stage, or a contact property."
                />

                <Card className="border-hairline p-4">
                    <h2 className="text-sm font-semibold">Evo templates</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Evotechly starters for Algerian sales work. They write into your workspace — they are not a product tour.
                    </p>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                        {templates.map((template) => (
                            <div key={template.key} className="rounded-md border border-hairline p-3">
                                <p className="text-sm font-medium">{template.name}</p>
                                <p className="mt-1 text-[12px] text-mute">{template.description}</p>
                                <Form
                                    action="/crm/workflows/templates"
                                    method="post"
                                    className="mt-3"
                                >
                                    <input type="hidden" name="template_key" value={template.key} />
                                    <Button variant="secondary" className="h-8 text-[12px]">
                                        Use template
                                    </Button>
                                </Form>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="border-hairline p-4">
                    <h2 className="mb-3 text-sm font-semibold">Create workflow</h2>
                    <Form action="/crm/workflows" method="post" className="grid gap-3 md:grid-cols-2" resetOnSuccess>
                        {({ processing }) => (
                            <>
                                <div className="md:col-span-2">
                                    <Label>Name</Label>
                                    <Input name="name" required placeholder="New Evotechly contact — first task" />
                                </div>
                                <div>
                                    <Label>Trigger</Label>
                                    <select
                                        name="trigger"
                                        className={selectClass}
                                        value={trigger}
                                        onChange={(event) => setTrigger(event.target.value)}
                                    >
                                        <option value="contact.created">Contact created</option>
                                        <option value="deal.stage_changed">Deal stage changed</option>
                                        <option value="deal.created">Deal created</option>
                                    </select>
                                </div>
                                {trigger === 'deal.stage_changed' ? (
                                    <div>
                                        <Label>To stage</Label>
                                        <select
                                            name="trigger_stage_id"
                                            className={selectClass}
                                            required
                                        >
                                            {stages.map((stage) => (
                                                <option key={stage.id} value={stage.id}>
                                                    {stage.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div />
                                )}
                                <div>
                                    <Label>Then action</Label>
                                    <select
                                        name="action"
                                        className={selectClass}
                                        value={action}
                                        onChange={(event) => setAction(event.target.value)}
                                    >
                                        <option value="create_task">Create task on the record</option>
                                        <option value="enroll_sequence">Enroll contact in a sequence</option>
                                        <option value="send_webhook">Send webhook URL</option>
                                    </select>
                                </div>
                                <ActionFields action={action} prefix="" sequences={sequences} />

                                <div className="md:col-span-2 flex items-center gap-2 pt-1">
                                    <input
                                        id="workflow-branch"
                                        type="checkbox"
                                        checked={branched}
                                        onChange={(event) => setBranched(event.target.checked)}
                                    />
                                    <Label htmlFor="workflow-branch">
                                        If / then branch (deal amount, stage, or contact property)
                                    </Label>
                                </div>

                                {branched ? (
                                    <>
                                        <div>
                                            <Label>If field</Label>
                                            <select
                                                name="condition_field"
                                                className={selectClass}
                                                value={conditionField}
                                                onChange={(event) => setConditionField(event.target.value)}
                                            >
                                                {condition_fields.map((field) => (
                                                    <option key={field.value} value={field.value}>
                                                        {field.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <Label>Operator</Label>
                                            <select
                                                name="condition_operator"
                                                className={selectClass}
                                                value={conditionOperator}
                                                onChange={(event) => setConditionOperator(event.target.value)}
                                            >
                                                <option value="eq">equals</option>
                                                <option value="neq">does not equal</option>
                                                <option value="gt">greater than</option>
                                                <option value="gte">greater or equal</option>
                                                <option value="lt">less than</option>
                                                <option value="lte">less or equal</option>
                                                <option value="contains">contains</option>
                                                <option value="is_set">is set</option>
                                                <option value="is_empty">is empty</option>
                                            </select>
                                        </div>
                                        {needsConditionValue ? (
                                            conditionField === 'deal.stage' ? (
                                                <div>
                                                    <Label>Stage value</Label>
                                                    <select name="condition_value" className={selectClass} required>
                                                        {stages.map((stage) => (
                                                            <option key={stage.id} value={stage.slug}>
                                                                {stage.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ) : (
                                                <div>
                                                    <Label>
                                                        {conditionField === 'deal.amount' ? 'Amount (DZD)' : 'Value'}
                                                    </Label>
                                                    <Input
                                                        name="condition_value"
                                                        required
                                                        placeholder={conditionField === 'deal.amount' ? '500000' : 'Alger'}
                                                    />
                                                </div>
                                            )
                                        ) : null}
                                        <div>
                                            <Label>Else action</Label>
                                            <select
                                                name="else_action"
                                                className={selectClass}
                                                value={elseAction}
                                                onChange={(event) => setElseAction(event.target.value)}
                                            >
                                                <option value="">Do nothing</option>
                                                <option value="create_task">Create task on the record</option>
                                                <option value="enroll_sequence">Enroll contact in a sequence</option>
                                                <option value="send_webhook">Send webhook URL</option>
                                            </select>
                                        </div>
                                        <ActionFields action={elseAction} prefix="else_" sequences={sequences} />
                                    </>
                                ) : null}

                                <div className="flex items-end">
                                    <Button disabled={processing}>Create workflow</Button>
                                </div>
                            </>
                        )}
                    </Form>
                </Card>

                <Card className="overflow-hidden border-hairline">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-2">Name</th>
                                <th className="px-4 py-2">Trigger</th>
                                <th className="px-4 py-2">Action</th>
                                <th className="px-4 py-2">Status</th>
                                <th className="px-4 py-2" />
                            </tr>
                        </thead>
                        <tbody>
                            {workflows.map((workflow) => (
                                <tr key={workflow.id} className="border-t border-hairline">
                                    <td className="px-4 py-2 font-medium">{workflow.name}</td>
                                    <td className="px-4 py-2">
                                        {triggerLabel[workflow.trigger] ?? workflow.trigger}
                                        {workflow.trigger_stage ? ` → ${workflow.trigger_stage}` : ''}
                                    </td>
                                    <td className="px-4 py-2">
                                        <div>{actionLabel[workflow.action] ?? workflow.action}</div>
                                        {workflow.condition_field ? (
                                            <div className="mt-1 text-[12px] text-mute">
                                                If {workflow.condition_field}{' '}
                                                {operatorLabel[workflow.condition_operator ?? ''] ?? workflow.condition_operator}{' '}
                                                {workflow.condition_operator === 'is_set' || workflow.condition_operator === 'is_empty'
                                                    ? ''
                                                    : (workflow.condition_value ?? '')}
                                                {workflow.else_action
                                                    ? ` · else ${actionLabel[workflow.else_action] ?? workflow.else_action}`
                                                    : ''}
                                            </div>
                                        ) : null}
                                    </td>
                                    <td className="px-4 py-2">{workflow.active ? 'On' : 'Off'}</td>
                                    <td className="px-4 py-2 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Form action={`/crm/workflows/${workflow.id}/toggle`} method="post">
                                                <Button variant="secondary" className="h-7 text-[11px]">
                                                    {workflow.active ? 'Turn off' : 'Turn on'}
                                                </Button>
                                            </Form>
                                            <Form action={`/crm/workflows/${workflow.id}`} method="delete">
                                                <Button variant="secondary" className="h-7 text-[11px]">
                                                    Delete
                                                </Button>
                                            </Form>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {workflows.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-6 text-mute">
                                        No workflows yet. Use an Evo template or create one.
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </Card>
            </div>
        </>
    );
}

WorkflowsIndex.layout = {
    breadcrumbs: [{ title: 'Automation', href: '/crm/workflows' }],
};
