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

const triggerLabel: Record<string, string> = {
    'contact.created': 'Contact created',
    'deal.stage_changed': 'Deal stage changed',
};

const actionLabel: Record<string, string> = {
    create_task: 'Create task',
    enroll_sequence: 'Enroll in sequence',
};

export default function WorkflowsIndex({
    workflows,
    templates,
    stages,
    sequences,
}: {
    workflows: WorkflowRow[];
    templates: Template[];
    stages: Stage[];
    sequences: Sequence[];
}) {
    const [trigger, setTrigger] = useState('contact.created');
    const [action, setAction] = useState('create_task');

    return (
        <>
            <Head title="Automation" />
            <div className="flex-1 space-y-6 p-6">
                <PageHeader
                    title="Automation"
                    description="Evotechly workflows that run in EvoSales when a contact is created or a deal changes stage. Create a task on the record, or enroll the contact in an existing outbound sequence."
                />

                <Card className="p-4">
                    <h2 className="text-sm font-semibold">Evo templates</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Three Evotechly starters. They write into your workspace — they are not a product tour.
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

                <Card className="p-4">
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
                                        className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                        value={trigger}
                                        onChange={(event) => setTrigger(event.target.value)}
                                    >
                                        <option value="contact.created">Contact created</option>
                                        <option value="deal.stage_changed">Deal stage changed</option>
                                    </select>
                                </div>
                                {trigger === 'deal.stage_changed' ? (
                                    <div>
                                        <Label>To stage</Label>
                                        <select
                                            name="trigger_stage_id"
                                            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
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
                                    <Label>Action</Label>
                                    <select
                                        name="action"
                                        className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                        value={action}
                                        onChange={(event) => setAction(event.target.value)}
                                    >
                                        <option value="create_task">Create task on the record</option>
                                        <option value="enroll_sequence">Enroll contact in a sequence</option>
                                    </select>
                                </div>
                                {action === 'create_task' ? (
                                    <div>
                                        <Label>Task subject</Label>
                                        <Input name="subject" placeholder="Introduce Evotechly to {{contact}}" />
                                    </div>
                                ) : (
                                    <div>
                                        <Label>Sequence</Label>
                                        <select
                                            name="sequence_id"
                                            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                            defaultValue=""
                                        >
                                            <option value="">First sequence in the workspace</option>
                                            {sequences.map((sequence) => (
                                                <option key={sequence.id} value={sequence.id}>
                                                    {sequence.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div className="flex items-end">
                                    <Button disabled={processing}>Create workflow</Button>
                                </div>
                            </>
                        )}
                    </Form>
                </Card>

                <Card className="overflow-hidden">
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
                                <tr key={workflow.id} className="border-t">
                                    <td className="px-4 py-2 font-medium">{workflow.name}</td>
                                    <td className="px-4 py-2">
                                        {triggerLabel[workflow.trigger] ?? workflow.trigger}
                                        {workflow.trigger_stage ? ` → ${workflow.trigger_stage}` : ''}
                                    </td>
                                    <td className="px-4 py-2">
                                        {actionLabel[workflow.action] ?? workflow.action}
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
