import { Form, Head, router } from '@inertiajs/react';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type MailboxRow = {
    id: number;
    name: string;
    from_name: string;
    from_address: string;
    host: string;
    port: number;
    encryption: string;
    username: string;
    imap_host?: string | null;
    imap_port?: number | null;
    imap_encryption?: string | null;
    imap_username?: string | null;
    imap_configured: boolean;
    is_default: boolean;
    enabled: boolean;
    status: string;
    effective_status: string;
    daily_limit: number;
    sent_today: number;
    last_tested_at?: string | null;
    password_set: boolean;
    imap_password_set: boolean;
};

function statusVariant(status: string): 'default' | 'secondary' | 'outline' {
    if (status === 'active') {
        return 'default';
    }

    if (status === 'warming') {
        return 'secondary';
    }

    return 'outline';
}

export default function MailboxesIndex({ mailboxes }: { mailboxes: MailboxRow[] }) {
    return (
        <>
            <Head title="Mailboxes" />
            <div className="flex-1 space-y-6 p-6">
                <PageHeader
                    title="SMTP mailboxes"
                    description="Passwords are encrypted at rest. New mailboxes start disabled — enable one, warm it up, then sequences send through it. Without an enabled mailbox, outbound email uses the Disabled provider and fails honestly in the outbox."
                />

                <Card className="p-4">
                    <h2 className="mb-3 font-medium">Add mailbox</h2>
                    <Form action="/outbound/mailboxes" method="post" className="grid gap-3 md:grid-cols-4" resetOnSuccess>
                        {({ processing }) => (
                            <>
                                <div>
                                    <Label>Name</Label>
                                    <Input name="name" required placeholder="Sales — Amine" />
                                </div>
                                <div>
                                    <Label>From name</Label>
                                    <Input name="from_name" required placeholder="Amine · Evotechly" />
                                </div>
                                <div>
                                    <Label>From address</Label>
                                    <Input name="from_address" type="email" required placeholder="amine@evotechly.com" />
                                </div>
                                <div>
                                    <Label>Daily limit</Label>
                                    <Input name="daily_limit" type="number" min={0} defaultValue={50} />
                                </div>
                                <div>
                                    <Label>SMTP host</Label>
                                    <Input name="host" required placeholder="smtp.evotechly.com" />
                                </div>
                                <div>
                                    <Label>SMTP port</Label>
                                    <Input name="port" type="number" defaultValue={587} required />
                                </div>
                                <div>
                                    <Label>SMTP encryption</Label>
                                    <select name="encryption" className="h-9 w-full rounded-md border bg-background px-2 text-sm" defaultValue="tls">
                                        <option value="tls">tls</option>
                                        <option value="ssl">ssl</option>
                                        <option value="none">none</option>
                                    </select>
                                </div>
                                <div>
                                    <Label>SMTP username</Label>
                                    <Input name="username" required />
                                </div>
                                <div>
                                    <Label>SMTP password</Label>
                                    <Input name="password" type="password" required />
                                </div>
                                <div>
                                    <Label>IMAP host (replies)</Label>
                                    <Input name="imap_host" placeholder="imap.evotechly.com" />
                                </div>
                                <div>
                                    <Label>IMAP port</Label>
                                    <Input name="imap_port" type="number" defaultValue={993} />
                                </div>
                                <div>
                                    <Label>IMAP encryption</Label>
                                    <select name="imap_encryption" className="h-9 w-full rounded-md border bg-background px-2 text-sm" defaultValue="ssl">
                                        <option value="ssl">ssl</option>
                                        <option value="tls">tls</option>
                                        <option value="none">none</option>
                                    </select>
                                </div>
                                <div>
                                    <Label>IMAP username</Label>
                                    <Input name="imap_username" />
                                </div>
                                <div>
                                    <Label>IMAP password</Label>
                                    <Input name="imap_password" type="password" />
                                </div>
                                <div className="flex items-end">
                                    <Button disabled={processing}>Save mailbox</Button>
                                </div>
                            </>
                        )}
                    </Form>
                </Card>

                <div className="space-y-3">
                    {mailboxes.length === 0 ? (
                        <Card className="p-6 text-sm text-muted-foreground">
                            No mailbox — SMTP is disabled.
                        </Card>
                    ) : null}
                    {mailboxes.map((box) => (
                        <Card key={box.id} className="space-y-3 p-4 text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium">{box.name}</span>
                                <Badge variant={statusVariant(box.effective_status)}>{box.effective_status}</Badge>
                                {box.is_default ? <Badge variant="secondary">default</Badge> : null}
                                {box.imap_configured ? <Badge variant="secondary">IMAP replies on</Badge> : null}
                                <span className="ms-auto text-xs text-muted-foreground">
                                    {box.sent_today}/{box.daily_limit} sent today
                                    {box.last_tested_at ? ` · tested ${box.last_tested_at}` : ''}
                                </span>
                            </div>
                            <p className="text-muted-foreground">
                                {box.from_name} &lt;{box.from_address}&gt; · SMTP {box.host}:{box.port} ({box.encryption}) ·
                                password {box.password_set ? 'encrypted' : 'missing'}
                                {box.imap_host
                                    ? ` · IMAP ${box.imap_host}:${box.imap_port ?? 993} (${box.imap_encryption ?? 'ssl'})`
                                    : ' · IMAP not set — replies off'}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.post(`/outbound/mailboxes/${box.id}/toggle`)}
                                >
                                    {box.enabled ? 'Disable' : 'Enable'}
                                </Button>
                                {!box.is_default ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.post(`/outbound/mailboxes/${box.id}/default`)}
                                    >
                                        Make default
                                    </Button>
                                ) : null}
                                <Form
                                    action={`/outbound/mailboxes/${box.id}/test`}
                                    method="post"
                                    className="flex items-center gap-2"
                                    resetOnSuccess
                                >
                                    {({ processing }) => (
                                        <>
                                            <Input name="to" type="email" placeholder="test@you.dz" required className="h-8 w-48" />
                                            <Button variant="outline" size="sm" disabled={processing || !box.enabled}>
                                                Send test
                                            </Button>
                                        </>
                                    )}
                                </Form>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-brand"
                                    onClick={() => {
                                        if (window.confirm(`Delete mailbox ${box.name}?`)) {
                                            router.delete(`/outbound/mailboxes/${box.id}`);
                                        }
                                    }}
                                >
                                    Delete
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </>
    );
}

MailboxesIndex.layout = {
    breadcrumbs: [{ title: 'Mailboxes', href: '/outbound/mailboxes' }],
};
