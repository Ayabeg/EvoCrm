import { Form } from '@inertiajs/react';
import { Calendar, CheckSquare, Mail, Phone, StickyNote } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ActionType = 'note' | 'email' | 'call' | 'task' | 'meeting';

const actions: { type: ActionType; label: string; icon: typeof StickyNote }[] = [
    { type: 'note', label: 'Note', icon: StickyNote },
    { type: 'email', label: 'Email', icon: Mail },
    { type: 'call', label: 'Call', icon: Phone },
    { type: 'task', label: 'Task', icon: CheckSquare },
    { type: 'meeting', label: 'Meeting', icon: Calendar },
];

export default function RecordActionRow({
    contactId,
    dealId,
    companyId,
    ownerId,
}: {
    contactId?: number | null;
    dealId?: number | null;
    companyId?: number | null;
    ownerId?: number | null;
}) {
    const [type, setType] = useState<ActionType | null>(null);

    return (
        <section className="rounded-md border border-hairline bg-canvas p-3">
            <div
                role="toolbar"
                aria-label="Record actions"
                className="record-action-group"
            >
                {actions.map((action) => (
                    <Button
                        key={action.type}
                        type="button"
                        variant="ghost"
                        aria-pressed={type === action.type}
                        className="h-8 gap-1.5 px-2 text-[12px] font-medium"
                        onClick={() => setType(action.type)}
                    >
                        <action.icon className="size-3.5" />
                        {action.label}
                    </Button>
                ))}
            </div>
            {type ? (
                <Form action="/crm/activities" method="post" className="mt-2 grid gap-1" resetOnSuccess onSuccess={() => setType(null)}>
                    <input type="hidden" name="type" value={type} />
                    {contactId ? <input type="hidden" name="contact_id" value={contactId} /> : null}
                    {dealId ? <input type="hidden" name="deal_id" value={dealId} /> : null}
                    {companyId ? <input type="hidden" name="company_id" value={companyId} /> : null}
                    {ownerId ? <input type="hidden" name="owner_id" value={ownerId} /> : null}
                    <Input name="subject" placeholder={`${type} subject`} className="h-7" />
                    <Input name="body" placeholder="Details" className="h-7" />
                    {type === 'task' || type === 'meeting' ? <Input name="due_at" type="datetime-local" className="h-7" /> : null}
                    <div className="flex gap-1">
                        <Button className="h-7 text-[11px]">Log {type}</Button>
                        <Button type="button" variant="ghost" className="h-7 text-[11px]" onClick={() => setType(null)}>
                            Cancel
                        </Button>
                    </div>
                </Form>
            ) : null}
        </section>
    );
}
