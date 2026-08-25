import { Form, Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Playbook = {
    id: number;
    entity: 'contact' | 'deal';
    name: string;
    body: string;
};

export default function PlaybookSettings({ playbooks }: { playbooks: Playbook[] }) {
    return (
        <>
            <Head title="Playbooks" />
            <div className="space-y-6">
                <Heading
                    title="Playbooks"
                    description="Short call and email scripts shown on contact and deal records."
                />
                <Card className="space-y-3 border-hairline p-4">
                    <Form action="/settings/playbooks" method="post" className="grid gap-3">
                        <div>
                            <Label htmlFor="playbook-name">Name</Label>
                            <Input id="playbook-name" name="name" required className="mt-1" placeholder="First Alger call" />
                        </div>
                        <div>
                            <Label htmlFor="playbook-entity">Record</Label>
                            <select
                                id="playbook-entity"
                                name="entity"
                                className="mt-1 h-9 w-full rounded-md border border-hairline bg-canvas px-2 text-sm"
                                defaultValue="contact"
                            >
                                <option value="contact">Contact</option>
                                <option value="deal">Deal</option>
                            </select>
                        </div>
                        <div>
                            <Label htmlFor="playbook-body">Script</Label>
                            <textarea
                                id="playbook-body"
                                name="body"
                                required
                                rows={4}
                                className="mt-1 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm"
                                placeholder="Confirm wilaya, then book a site visit."
                            />
                        </div>
                        <Button type="submit">Save playbook</Button>
                    </Form>
                </Card>
                <div className="space-y-3">
                    {playbooks.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No playbooks yet.</p>
                    ) : (
                        playbooks.map((playbook) => (
                            <Card key={playbook.id} className="space-y-3 border-hairline p-4">
                                <Form action={`/settings/playbooks/${playbook.id}`} method="put" className="grid gap-3">
                                    <Input name="name" defaultValue={playbook.name} required />
                                    <input type="hidden" name="entity" value={playbook.entity} />
                                    <textarea
                                        name="body"
                                        defaultValue={playbook.body}
                                        required
                                        rows={3}
                                        className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm"
                                    />
                                    <div className="flex gap-2">
                                        <Button type="submit" size="sm">Update</Button>
                                    </div>
                                </Form>
                                <Form action={`/settings/playbooks/${playbook.id}`} method="delete">
                                    <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">
                                        Delete
                                    </Button>
                                </Form>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
