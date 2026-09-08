import { Form } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

type Member = { id: number; name: string };

export default function LeadOwnerDialog({
    leadId,
    members,
    ownerId,
}: {
    leadId: number;
    members: Member[];
    ownerId?: number | null;
}) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                    Change Owner
                </Button>
            </DialogTrigger>
            <DialogContent size="sm">
                <DialogHeader>
                    <DialogTitle>Change Owner</DialogTitle>
                    <DialogDescription>
                        Assign this lead to a workspace member. Ownership lives
                        on the linked contact.
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
                                Owner
                                <select
                                    name="owner_id"
                                    defaultValue={ownerId ?? ''}
                                    className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm"
                                >
                                    <option value="">Unassigned</option>
                                    {members.map((member) => (
                                        <option
                                            key={member.id}
                                            value={member.id}
                                        >
                                            {member.name}
                                        </option>
                                    ))}
                                </select>
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
