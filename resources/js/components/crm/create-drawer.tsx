import { Form } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';

type Member = { id: number; name: string };
type Company = { id: number; name: string };
type Contact = { id: number; first_name: string; last_name?: string | null };
type Stage = { id: number; name: string };

export default function CreateDrawer({
    entity,
    companies = [],
    contacts = [],
    members = [],
    stages = [],
}: {
    entity: 'contact' | 'company' | 'deal';
    companies?: Company[];
    contacts?: Contact[];
    members?: Member[];
    stages?: Stage[];
}) {
    const [open, setOpen] = useState(false);
    const [addAnother, setAddAnother] = useState(false);
    const titles = {
        contact: 'Create contact',
        company: 'Create company',
        deal: 'Create deal',
    };
    const actions = {
        contact: '/crm/contacts',
        company: '/crm/companies',
        deal: '/crm/deals',
    };

    return (
        <>
            <Button type="button" variant="secondary" className="h-7 px-2 text-[11px]" onClick={() => setOpen(true)}>
                Create
            </Button>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent side="right" className="overflow-y-auto bg-canvas text-ink">
                    <SheetHeader>
                        <SheetTitle>{titles[entity]}</SheetTitle>
                        <SheetDescription>Additional create path. Existing hub forms stay in place.</SheetDescription>
                    </SheetHeader>
                    <Form
                        action={actions[entity]}
                        method="post"
                        className="grid gap-3 px-4"
                        resetOnSuccess
                        onSuccess={() => {
                            if (!addAnother) {
                                setOpen(false);
                            }
                            setAddAnother(false);
                        }}
                    >
                        {entity === 'contact' ? (
                            <>
                                <div>
                                    <Label>First name</Label>
                                    <Input name="first_name" required className="h-8" />
                                </div>
                                <div>
                                    <Label>Last name</Label>
                                    <Input name="last_name" className="h-8" />
                                </div>
                                <div>
                                    <Label>Email</Label>
                                    <Input name="email" type="email" className="h-8" />
                                </div>
                                <div>
                                    <Label>Phone</Label>
                                    <Input name="phone" placeholder="0550…" className="h-8" />
                                </div>
                                <div>
                                    <Label>Company</Label>
                                    <select name="company_id" className="h-8 w-full rounded-md border bg-background px-2 text-sm">
                                        <option value="">None</option>
                                        {companies.map((company) => (
                                            <option key={company.id} value={company.id}>
                                                {company.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label>Owner</Label>
                                    <select name="owner_id" className="h-8 w-full rounded-md border bg-background px-2 text-sm">
                                        <option value="">Unassigned</option>
                                        {members.map((user) => (
                                            <option key={user.id} value={user.id}>
                                                {user.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        ) : null}
                        {entity === 'company' ? (
                            <>
                                <div>
                                    <Label>Name</Label>
                                    <Input name="name" required className="h-8" />
                                </div>
                                <div>
                                    <Label>Domain</Label>
                                    <Input name="domain" className="h-8" />
                                </div>
                                <div>
                                    <Label>Phone</Label>
                                    <Input name="phone" className="h-8" />
                                </div>
                                <div>
                                    <Label>Owner</Label>
                                    <select name="owner_id" className="h-8 w-full rounded-md border bg-background px-2 text-sm">
                                        <option value="">Unassigned</option>
                                        {members.map((user) => (
                                            <option key={user.id} value={user.id}>
                                                {user.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        ) : null}
                        {entity === 'deal' ? (
                            <>
                                <div>
                                    <Label>Title</Label>
                                    <Input name="title" required className="h-8" />
                                </div>
                                <div>
                                    <Label>Contact</Label>
                                    <select name="contact_id" required className="h-8 w-full rounded-md border bg-background px-2 text-sm">
                                        <option value="">Select</option>
                                        {contacts.map((contact) => (
                                            <option key={contact.id} value={contact.id}>
                                                {contact.first_name} {contact.last_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label>Amount (DZD)</Label>
                                    <Input name="amount_dzd" type="number" min={0} step="0.01" className="h-8" />
                                </div>
                                <div>
                                    <Label>Stage</Label>
                                    <select name="stage_id" className="h-8 w-full rounded-md border bg-background px-2 text-sm">
                                        <option value="">Default (New)</option>
                                        {stages.map((stage) => (
                                            <option key={stage.id} value={stage.id}>
                                                {stage.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label>Owner</Label>
                                    <select name="owner_id" className="h-8 w-full rounded-md border bg-background px-2 text-sm">
                                        <option value="">Unassigned</option>
                                        {members.map((user) => (
                                            <option key={user.id} value={user.id}>
                                                {user.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        ) : null}
                        <SheetFooter className="px-0">
                            <Button type="submit" onClick={() => setAddAnother(false)}>
                                Create
                            </Button>
                            <Button type="submit" variant="secondary" onClick={() => setAddAnother(true)}>
                                Create and add another
                            </Button>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                        </SheetFooter>
                    </Form>
                </SheetContent>
            </Sheet>
        </>
    );
}
