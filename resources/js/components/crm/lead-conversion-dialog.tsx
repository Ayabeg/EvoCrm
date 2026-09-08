import { Form } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

type PipelineOption = {
    id: number;
    name: string;
    is_default?: boolean;
    stages: { id: number; name: string; slug: string; pipeline_id: number }[];
};

type Member = { id: number; name: string };

type ContactDeal = { id: number; title: string; stage?: string | null };

export default function LeadConversionDialog({
    leadId,
    pipelines,
    members,
    contactDeals,
    open: openProp,
    onOpenChange,
}: {
    leadId: number;
    pipelines: PipelineOption[];
    members: Member[];
    contactDeals: ContactDeal[];
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}) {
    const defaultPipeline = pipelines.find((row) => row.is_default) ?? pipelines[0];
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
    const open = openProp ?? uncontrolledOpen;
    const setOpen = onOpenChange ?? setUncontrolledOpen;
    const [mode, setMode] = useState<'create' | 'link'>('create');
    const [pipelineId, setPipelineId] = useState(String(defaultPipeline?.id ?? ''));
    const stages = useMemo(
        () => pipelines.find((row) => String(row.id) === pipelineId)?.stages ?? defaultPipeline?.stages ?? [],
        [pipelines, pipelineId, defaultPipeline],
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                    Convert
                </Button>
            </DialogTrigger>
            <DialogContent size="lg">
                <DialogHeader>
                    <DialogTitle>Convert lead to deal</DialogTitle>
                    <DialogDescription>
                        Choose a pipeline, stage, owner, and amount, or link an existing deal.
                    </DialogDescription>
                </DialogHeader>
                <Form
                    action={`/crm/leads/${leadId}/qualify`}
                    method="post"
                    className="grid gap-3"
                    onSuccess={() => setOpen(false)}
                >
                    {({ processing }) => (
                        <>
                            <div>
                                <label className="text-sm font-medium">Conversion</label>
                                <select
                                    name="mode"
                                    value={mode}
                                    onChange={(event) => setMode(event.target.value as 'create' | 'link')}
                                    className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm"
                                >
                                    <option value="create">Create a new deal</option>
                                    <option value="link">Link an existing deal</option>
                                </select>
                            </div>
                            {mode === 'link' ? (
                                <div>
                                    <label className="text-sm font-medium">Existing deal</label>
                                    <select
                                        name="deal_id"
                                        required
                                        className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm"
                                    >
                                        <option value="">Select a deal</option>
                                        {contactDeals.map((deal) => (
                                            <option key={deal.id} value={deal.id}>
                                                {deal.title}
                                                {deal.stage ? ` · ${deal.stage}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div>
                                    <label className="text-sm font-medium">Pipeline</label>
                                    <select
                                        name="pipeline_id"
                                        value={pipelineId}
                                        onChange={(event) => setPipelineId(event.target.value)}
                                        className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm"
                                    >
                                        {pipelines.map((pipeline) => (
                                            <option key={pipeline.id} value={pipeline.id}>
                                                {pipeline.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="text-sm font-medium">Stage</label>
                                <select
                                    name="stage_id"
                                    className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm"
                                    defaultValue={stages[0]?.id}
                                >
                                    {stages.map((stage) => (
                                        <option key={stage.id} value={stage.id}>
                                            {stage.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Owner</label>
                                <select
                                    name="owner_id"
                                    className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm"
                                >
                                    {members.map((member) => (
                                        <option key={member.id} value={member.id}>
                                            {member.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Amount (DZD)</label>
                                <input
                                    name="amount_dzd"
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                    Cancel
                                </Button>
                                <Button disabled={processing}>Convert lead</Button>
                            </div>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
