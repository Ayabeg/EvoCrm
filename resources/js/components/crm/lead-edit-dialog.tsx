import { Form } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/evo/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/evo/ui/dialog';
import { Input } from '@/evo/ui/input';

export default function LeadEditDialog({
    leadId,
    title,
    source,
    sourceDetail,
    sourceCampaign,
    sourceMedium,
}: {
    leadId: number;
    title: string;
    source?: string | null;
    sourceDetail?: string | null;
    sourceCampaign?: string | null;
    sourceMedium?: string | null;
}) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                    Edit
                </Button>
            </DialogTrigger>
            <DialogContent size="sm">
                <DialogHeader>
                    <DialogTitle>Edit lead</DialogTitle>
                    <DialogDescription>
                        Update the lead title and attribution. Contact fields
                        save inline on the record.
                    </DialogDescription>
                </DialogHeader>
                <Form
                    action={`/crm/leads/${leadId}`}
                    method="put"
                    className="grid gap-3"
                    onSuccess={() => setOpen(false)}
                    options={{ preserveScroll: true }}
                >
                    {({ processing }) => (
                        <>
                            <label className="text-sm font-medium">
                                Title
                                <Input
                                    name="title"
                                    defaultValue={title}
                                    required
                                    className="mt-1 h-9"
                                />
                            </label>
                            <label className="text-sm font-medium">
                                Source
                                <Input
                                    name="source"
                                    defaultValue={source ?? ''}
                                    className="mt-1 h-9"
                                />
                            </label>
                            <label className="text-sm font-medium">
                                Source detail
                                <Input
                                    name="source_detail"
                                    defaultValue={sourceDetail ?? ''}
                                    className="mt-1 h-9"
                                />
                            </label>
                            <label className="text-sm font-medium">
                                Campaign
                                <Input
                                    name="source_campaign"
                                    defaultValue={sourceCampaign ?? ''}
                                    className="mt-1 h-9"
                                />
                            </label>
                            <label className="text-sm font-medium">
                                Source medium
                                <Input
                                    name="source_medium"
                                    defaultValue={sourceMedium ?? ''}
                                    className="mt-1 h-9"
                                />
                            </label>
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button disabled={processing}>Save</Button>
                            </div>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
