import { Form, router } from '@inertiajs/react';
import { OutboundShell } from '@/components/crm/outbound-shell';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type MailboxRow = {
    id: number;
    source: string;
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

type MailStack = {
    configured: boolean;
    roundcube_url: string;
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

export default function MailboxesIndex({
    mailboxes,
    mail_stack,
}: {
    mailboxes: MailboxRow[];
    mail_stack: MailStack;
}) {
    return (
        <OutboundShell title="Mailboxes">
            <div className="flex-1 space-y-6 p-6">
                <PageHeader
                    title="SMTP mailboxes"
                    description="Passwords are encrypted at rest. New mailboxes start disabled — enable one, warm it up, then sequences send through it. Without an enabled mailbox, outbound email uses the Disabled provider and fails honestly in the outbox."
                />

                {mail_stack.configured ? (
                    <Card className="flex flex-wrap items-center gap-3 p-4 text-sm">
                        <div>
                            <h2 className="font-medium">Mail stack sync</h2>
                            <p className="text-muted-foreground">
                                Every mailbox on the live mail stack lands here
                                automatically — the sync runs every 15 minutes.
                                Webmail is Roundcube on the same host; campaigns
                                and sequences stay in the CRM.
                            </p>
                        </div>
                        <Button
                            className="ms-auto"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                router.post('/outbound/mailboxes/sync')
                            }
                        >
                            Sync now
                        </Button>
                    </Card>
                ) : (
                    <Card className="p-4 text-sm">
                        <h2 className="font-medium">Connect the mail stack</h2>
                        <p className="mt-1 text-muted-foreground">
                            Set{' '}
                            <code className="text-foreground">
                                EVOSALES_MAIL_API_TOKEN
                            </code>{' '}
                            (and optionally{' '}
                            <code className="text-foreground">
                                EVOSALES_MAIL_API_URL
                            </code>
                            ) in the environment and every mailbox on the live
                            mail stack appears here automatically — SMTP send,
                            IMAP replies, and Roundcube webmail. Until then, add
                            a mailbox manually below.
                        </p>
                    </Card>
                )}

                <Card className="p-4">
                    <h2 className="mb-3 font-medium">Add mailbox</h2>
                    <Form
                        action="/outbound/mailboxes"
                        method="post"
                        className="grid gap-3 md:grid-cols-4"
                        resetOnSuccess
                    >
                        {({ processing }) => (
                            <>
                                <div>
                                    <Label>Name</Label>
                                    <Input
                                        name="name"
                                        required
                                        placeholder="Sales — Amine"
                                    />
                                </div>
                                <div>
                                    <Label>From name</Label>
                                    <Input
                                        name="from_name"
                                        required
                                        placeholder="Amine · Evotechly"
                                    />
                                </div>
                                <div>
                                    <Label>From address</Label>
                                    <Input
                                        name="from_address"
                                        type="email"
                                        required
                                        placeholder="amine@evotechly.com"
                                    />
                                </div>
                                <div>
                                    <Label>Daily limit</Label>
                                    <Input
                                        name="daily_limit"
                                        type="number"
                                        min={0}
                                        defaultValue={50}
                                    />
                                </div>
                                <div>
                                    <Label>SMTP host</Label>
                                    <Input
                                        name="host"
                                        required
                                        placeholder="smtp.evotechly.com"
                                    />
                                </div>
                                <div>
                                    <Label>SMTP port</Label>
                                    <Input
                                        name="port"
                                        type="number"
                                        defaultValue={587}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>SMTP encryption</Label>
                                    <select
                                        name="encryption"
                                        className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                        defaultValue="tls"
                                    >
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
                                    <Input
                                        name="password"
                                        type="password"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>IMAP host (replies)</Label>
                                    <Input
                                        name="imap_host"
                                        placeholder="imap.evotechly.com"
                                    />
                                </div>
                                <div>
                                    <Label>IMAP port</Label>
                                    <Input
                                        name="imap_port"
                                        type="number"
                                        defaultValue={993}
                                    />
                                </div>
                                <div>
                                    <Label>IMAP encryption</Label>
                                    <select
                                        name="imap_encryption"
                                        className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                        defaultValue="ssl"
                                    >
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
                                    <Input
                                        name="imap_password"
                                        type="password"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <Button disabled={processing}>
                                        Save mailbox
                                    </Button>
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
                                <Badge
                                    variant={statusVariant(
                                        box.effective_status,
                                    )}
                                >
                                    {box.effective_status}
                                </Badge>
                                {box.is_default ? (
                                    <Badge variant="secondary">default</Badge>
                                ) : null}
                                {box.source === 'mail_stack' ? (
                                    <Badge variant="secondary">
                                        Mail stack
                                    </Badge>
                                ) : null}
                                {box.imap_configured ? (
                                    <Badge variant="secondary">
                                        IMAP replies on
                                    </Badge>
                                ) : null}
                                <span className="ms-auto text-xs text-muted-foreground">
                                    {box.sent_today}/{box.daily_limit} sent
                                    today
                                    {box.last_tested_at
                                        ? ` · tested ${box.last_tested_at}`
                                        : ''}
                                </span>
                            </div>
                            <p className="text-muted-foreground">
                                {box.from_name} &lt;{box.from_address}&gt; ·
                                SMTP {box.host}:{box.port} ({box.encryption}) ·
                                password{' '}
                                {box.password_set ? 'encrypted' : 'missing'}
                                {box.imap_host
                                    ? ` · IMAP ${box.imap_host}:${box.imap_port ?? 993} (${box.imap_encryption ?? 'ssl'})`
                                    : ' · IMAP not set — replies off'}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        router.post(
                                            `/outbound/mailboxes/${box.id}/toggle`,
                                        )
                                    }
                                >
                                    {box.enabled ? 'Disable' : 'Enable'}
                                </Button>
                                {!box.is_default ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            router.post(
                                                `/outbound/mailboxes/${box.id}/default`,
                                            )
                                        }
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
                                            <Input
                                                name="to"
                                                type="email"
                                                placeholder="test@you.dz"
                                                required
                                                className="h-8 w-48"
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    processing || !box.enabled
                                                }
                                            >
                                                Send test
                                            </Button>
                                        </>
                                    )}
                                </Form>
                                <Button variant="outline" size="sm" asChild>
                                    <a
                                        href={mail_stack.roundcube_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Open Roundcube
                                    </a>
                                </Button>
                                {box.source === 'mail_stack' ? (
                                    <span className="text-xs text-muted-foreground">
                                        Synced from the mail stack — remove it
                                        there, not here.
                                    </span>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-brand"
                                        onClick={() => {
                                            if (
                                                window.confirm(
                                                    `Delete mailbox ${box.name}?`,
                                                )
                                            ) {
                                                router.delete(
                                                    `/outbound/mailboxes/${box.id}`,
                                                );
                                            }
                                        }}
                                    >
                                        Delete
                                    </Button>
                                )}
                            </div>

                            <details className="rounded-md border border-hairline px-3 py-2">
                                <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                                    Edit mailbox
                                </summary>
                                <Form
                                    action={`/outbound/mailboxes/${box.id}`}
                                    method="put"
                                    className="mt-3 grid gap-3 md:grid-cols-4"
                                >
                                    {({ processing }) => (
                                        <>
                                            <div>
                                                <Label>Name</Label>
                                                <Input
                                                    name="name"
                                                    required
                                                    defaultValue={box.name}
                                                />
                                            </div>
                                            <div>
                                                <Label>From name</Label>
                                                <Input
                                                    name="from_name"
                                                    required
                                                    defaultValue={box.from_name}
                                                />
                                            </div>
                                            <div>
                                                <Label>From address</Label>
                                                <Input
                                                    name="from_address"
                                                    type="email"
                                                    required
                                                    defaultValue={
                                                        box.from_address
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label>Daily limit</Label>
                                                <Input
                                                    name="daily_limit"
                                                    type="number"
                                                    min={0}
                                                    defaultValue={
                                                        box.daily_limit
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label>SMTP host</Label>
                                                <Input
                                                    name="host"
                                                    required
                                                    defaultValue={box.host}
                                                />
                                            </div>
                                            <div>
                                                <Label>SMTP port</Label>
                                                <Input
                                                    name="port"
                                                    type="number"
                                                    required
                                                    defaultValue={box.port}
                                                />
                                            </div>
                                            <div>
                                                <Label>SMTP encryption</Label>
                                                <select
                                                    name="encryption"
                                                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                                    defaultValue={
                                                        box.encryption
                                                    }
                                                >
                                                    <option value="tls">
                                                        tls
                                                    </option>
                                                    <option value="ssl">
                                                        ssl
                                                    </option>
                                                    <option value="none">
                                                        none
                                                    </option>
                                                </select>
                                            </div>
                                            <div>
                                                <Label>SMTP username</Label>
                                                <Input
                                                    name="username"
                                                    required
                                                    defaultValue={box.username}
                                                />
                                            </div>
                                            <div>
                                                <Label>
                                                    SMTP password (blank = keep)
                                                </Label>
                                                <Input
                                                    name="password"
                                                    type="password"
                                                    placeholder={
                                                        box.password_set
                                                            ? '••••••••'
                                                            : ''
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label>
                                                    IMAP host (replies)
                                                </Label>
                                                <Input
                                                    name="imap_host"
                                                    defaultValue={
                                                        box.imap_host ?? ''
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label>IMAP port</Label>
                                                <Input
                                                    name="imap_port"
                                                    type="number"
                                                    defaultValue={
                                                        box.imap_port ?? 993
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label>IMAP encryption</Label>
                                                <select
                                                    name="imap_encryption"
                                                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                                    defaultValue={
                                                        box.imap_encryption ??
                                                        'ssl'
                                                    }
                                                >
                                                    <option value="ssl">
                                                        ssl
                                                    </option>
                                                    <option value="tls">
                                                        tls
                                                    </option>
                                                    <option value="none">
                                                        none
                                                    </option>
                                                </select>
                                            </div>
                                            <div>
                                                <Label>IMAP username</Label>
                                                <Input
                                                    name="imap_username"
                                                    defaultValue={
                                                        box.imap_username ?? ''
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label>
                                                    IMAP password (blank = keep)
                                                </Label>
                                                <Input
                                                    name="imap_password"
                                                    type="password"
                                                    placeholder={
                                                        box.imap_password_set
                                                            ? '••••••••'
                                                            : ''
                                                    }
                                                />
                                            </div>
                                            {box.enabled ? (
                                                <div>
                                                    <Label>Warmup status</Label>
                                                    <select
                                                        name="status"
                                                        className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                                        defaultValue={
                                                            box.effective_status ===
                                                            'active'
                                                                ? 'active'
                                                                : 'warming'
                                                        }
                                                    >
                                                        <option value="warming">
                                                            warming
                                                        </option>
                                                        <option value="active">
                                                            active
                                                        </option>
                                                    </select>
                                                </div>
                                            ) : null}
                                            <div className="flex items-end">
                                                <Button
                                                    size="sm"
                                                    disabled={processing}
                                                >
                                                    Save changes
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </Form>
                            </details>
                        </Card>
                    ))}
                </div>
            </div>
        </OutboundShell>
    );
}

MailboxesIndex.layout = {
    breadcrumbs: [{ title: 'Mailboxes', href: '/outbound/mailboxes' }],
};
