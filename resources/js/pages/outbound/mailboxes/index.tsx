import { Form, Head } from '@inertiajs/react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function MailboxesIndex({ mailboxes }: { mailboxes: any[] }) {
    return (
        <>
            <Head title="Mailboxes" />
            <div className="flex-1 space-y-6 p-6">
                <PageHeader
                    title="SMTP mailboxes"
                    description="Passwords are encrypted at rest. Without a mailbox, outbound email uses the Disabled provider."
                />
                <Card className="p-4">
                    <Form action="/outbound/mailboxes" method="post" className="grid gap-3 md:grid-cols-3" resetOnSuccess>
                        {({ processing }) => (
                            <>
                                <div>
                                    <Label>Name</Label>
                                    <Input name="name" required />
                                </div>
                                <div>
                                    <Label>From name</Label>
                                    <Input name="from_name" required />
                                </div>
                                <div>
                                    <Label>From address</Label>
                                    <Input name="from_address" type="email" required />
                                </div>
                                <div>
                                    <Label>Host</Label>
                                    <Input name="host" required />
                                </div>
                                <div>
                                    <Label>Port</Label>
                                    <Input name="port" type="number" defaultValue={587} required />
                                </div>
                                <div>
                                    <Label>Encryption</Label>
                                    <select name="encryption" className="h-9 w-full rounded-md border bg-background px-2 text-sm" defaultValue="tls">
                                        <option value="tls">tls</option>
                                        <option value="ssl">ssl</option>
                                        <option value="none">none</option>
                                    </select>
                                </div>
                                <div>
                                    <Label>Username</Label>
                                    <Input name="username" required />
                                </div>
                                <div>
                                    <Label>Password</Label>
                                    <Input name="password" type="password" required />
                                </div>
                                <div className="flex items-end">
                                    <Button disabled={processing}>Save mailbox</Button>
                                </div>
                            </>
                        )}
                    </Form>
                </Card>
                <Card className="p-4 text-sm">
                    {mailboxes.length === 0 ? <p className="text-muted-foreground">No mailbox — SMTP is disabled.</p> : null}
                    {mailboxes.map((box) => (
                        <p key={box.id}>
                            {box.name} · {box.from_address} · {box.host}:{box.port} ·{' '}
                            {box.enabled ? 'connected' : 'disconnected (demo)'} · password{' '}
                            {box.password_set ? 'encrypted' : 'missing'}
                        </p>
                    ))}
                </Card>
            </div>
        </>
    );
}

MailboxesIndex.layout = {
    breadcrumbs: [{ title: 'Mailboxes', href: '/outbound/mailboxes' }],
};
