import { Form, router } from '@inertiajs/react';
import { HairlinePanel, HairlineTable } from '@/components/crm/hairline-table';
import { OutboundPage, OutboundShell } from '@/components/crm/outbound-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';

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

function MailboxActions({
    box,
    roundcubeUrl,
}: {
    box: MailboxRow;
    roundcubeUrl: string;
}) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={() =>
                    router.post(`/outbound/mailboxes/${box.id}/toggle`)
                }
            >
                {box.enabled ? 'Disable' : 'Enable'}
            </Button>
            {!box.is_default ? (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        router.post(`/outbound/mailboxes/${box.id}/default`)
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
                            aria-label="Test recipient"
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={processing || !box.enabled}
                        >
                            Send test
                        </Button>
                    </>
                )}
            </Form>
            <Button variant="outline" size="sm" asChild>
                <a
                    href={roundcubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Open Roundcube
                </a>
            </Button>
            {box.source === 'mail_stack' ? (
                <span className="aurora-text-caption text-mute">
                    Synced from the mail stack - remove it there, not here.
                </span>
            ) : (
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
            )}
        </div>
    );
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
            <OutboundPage
                title="SMTP mailboxes"
                description="Passwords are encrypted at rest. New mailboxes start disabled - enable one, warm it up, then sequences send through it. Without an enabled mailbox, outbound email uses the Disabled provider and fails honestly in the outbox."
            >
                {mail_stack.configured ? (
                    <HairlinePanel
                        title="Mail stack sync"
                        description="Every mailbox on the live mail stack lands here automatically. The sync runs every 15 minutes. Webmail is Roundcube on the same host; campaigns and sequences stay in the CRM."
                        action={
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    router.post('/outbound/mailboxes/sync')
                                }
                            >
                                Sync now
                            </Button>
                        }
                    >
                        <p className="aurora-text-caption text-mute">
                            SMTP send, IMAP replies, and Roundcube stay on the
                            stack. This page is the CRM view of those boxes.
                        </p>
                    </HairlinePanel>
                ) : (
                    <HairlinePanel title="Connect the mail stack">
                        <p className="aurora-text-body-sm text-mute">
                            Set{' '}
                            <code className="text-ink">
                                EVOSALES_MAIL_API_TOKEN
                            </code>{' '}
                            (and optionally{' '}
                            <code className="text-ink">
                                EVOSALES_MAIL_API_URL
                            </code>
                            ) in the environment and every mailbox on the live
                            mail stack appears here automatically - SMTP send,
                            IMAP replies, and Roundcube webmail. Until then, add
                            a mailbox manually below.
                        </p>
                    </HairlinePanel>
                )}

                <HairlinePanel title="Add mailbox">
                    <Form
                        action="/outbound/mailboxes"
                        method="post"
                        className="grid gap-3 md:grid-cols-4"
                        resetOnSuccess
                    >
                        {({ processing }) => (
                            <>
                                <div className="space-y-1.5">
                                    <Label>Name</Label>
                                    <Input
                                        name="name"
                                        required
                                        placeholder="Sales - Amine"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>From name</Label>
                                    <Input
                                        name="from_name"
                                        required
                                        placeholder="Amine · Evotechly"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>From address</Label>
                                    <Input
                                        name="from_address"
                                        type="email"
                                        required
                                        placeholder="amine@evotechly.com"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Daily limit</Label>
                                    <Input
                                        name="daily_limit"
                                        type="number"
                                        min={0}
                                        defaultValue={50}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>SMTP host</Label>
                                    <Input
                                        name="host"
                                        required
                                        placeholder="smtp.evotechly.com"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>SMTP port</Label>
                                    <Input
                                        name="port"
                                        type="number"
                                        defaultValue={587}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>SMTP encryption</Label>
                                    <NativeSelect
                                        name="encryption"
                                        defaultValue="tls"
                                    >
                                        <option value="tls">tls</option>
                                        <option value="ssl">ssl</option>
                                        <option value="none">none</option>
                                    </NativeSelect>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>SMTP username</Label>
                                    <Input name="username" required />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>SMTP password</Label>
                                    <Input
                                        name="password"
                                        type="password"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>IMAP host (replies)</Label>
                                    <Input
                                        name="imap_host"
                                        placeholder="imap.evotechly.com"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>IMAP port</Label>
                                    <Input
                                        name="imap_port"
                                        type="number"
                                        defaultValue={993}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>IMAP encryption</Label>
                                    <NativeSelect
                                        name="imap_encryption"
                                        defaultValue="ssl"
                                    >
                                        <option value="ssl">ssl</option>
                                        <option value="tls">tls</option>
                                        <option value="none">none</option>
                                    </NativeSelect>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>IMAP username</Label>
                                    <Input name="imap_username" />
                                </div>
                                <div className="space-y-1.5">
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
                </HairlinePanel>

                <HairlineTable
                    minWidth={880}
                    empty="No mailbox - SMTP is disabled."
                    columns={[
                        { key: 'mailbox', header: 'Mailbox' },
                        { key: 'status', header: 'Status' },
                        { key: 'smtp', header: 'SMTP' },
                        { key: 'imap', header: 'IMAP' },
                        { key: 'sent', header: 'Sent today' },
                        { key: 'actions', header: '', align: 'right' },
                    ]}
                    rows={mailboxes.map((box) => ({
                        id: box.id,
                        mobileTitle: (
                            <span className="flex flex-wrap items-center gap-2">
                                {box.name}
                                <Badge
                                    variant={statusVariant(
                                        box.effective_status,
                                    )}
                                >
                                    {box.effective_status}
                                </Badge>
                            </span>
                        ),
                        mobileMeta: [
                            {
                                label: 'From',
                                value: `${box.from_name} <${box.from_address}>`,
                            },
                            {
                                label: 'SMTP',
                                value: `${box.host}:${box.port} (${box.encryption})`,
                            },
                            {
                                label: 'IMAP',
                                value: box.imap_configured
                                    ? 'replies on'
                                    : 'off',
                            },
                            {
                                label: 'Sent today',
                                value: `${box.sent_today}/${box.daily_limit}${
                                    box.last_tested_at
                                        ? ` · tested ${box.last_tested_at}`
                                        : ''
                                }`,
                            },
                        ],
                        mobileFooter: (
                            <div className="mt-3">
                                <MailboxActions
                                    box={box}
                                    roundcubeUrl={mail_stack.roundcube_url}
                                />
                            </div>
                        ),
                        after: (
                            <details className="rounded-xl border border-hairline bg-canvas px-3 py-2">
                                <summary className="aurora-text-caption cursor-pointer font-medium text-mute">
                                    Edit mailbox
                                </summary>
                                <MailboxEditForm box={box} />
                            </details>
                        ),
                        cells: {
                            mailbox: (
                                <div>
                                    <p className="flex flex-wrap items-center gap-2 font-medium text-ink">
                                        {box.name}
                                        {box.is_default ? (
                                            <Badge variant="secondary">
                                                default
                                            </Badge>
                                        ) : null}
                                        {box.source === 'mail_stack' ? (
                                            <Badge variant="secondary">
                                                Mail stack
                                            </Badge>
                                        ) : null}
                                    </p>
                                    <p className="aurora-text-caption mt-0.5 text-mute">
                                        {box.from_name} &lt;{box.from_address}
                                        &gt;
                                    </p>
                                </div>
                            ),
                            status: (
                                <Badge
                                    variant={statusVariant(
                                        box.effective_status,
                                    )}
                                >
                                    {box.effective_status}
                                </Badge>
                            ),
                            smtp: (
                                <span className="aurora-text-caption text-mute">
                                    {box.host}:{box.port} ({box.encryption})
                                </span>
                            ),
                            imap: (
                                <span className="aurora-text-caption text-mute">
                                    {box.imap_configured ? 'replies on' : 'off'}
                                </span>
                            ),
                            sent: (
                                <div>
                                    <span className="money tabular-nums">
                                        {box.sent_today}/{box.daily_limit}
                                    </span>
                                    {box.last_tested_at ? (
                                        <span className="aurora-text-caption block text-mute">
                                            tested {box.last_tested_at}
                                        </span>
                                    ) : null}
                                </div>
                            ),
                            actions: (
                                <MailboxActions
                                    box={box}
                                    roundcubeUrl={mail_stack.roundcube_url}
                                />
                            ),
                        },
                    }))}
                />
            </OutboundPage>
        </OutboundShell>
    );
}

function MailboxEditForm({ box }: { box: MailboxRow }) {
    return (
        <Form
            action={`/outbound/mailboxes/${box.id}`}
            method="put"
            className="mt-3 grid gap-3 md:grid-cols-4"
        >
            {({ processing }) => (
                <>
                    <div className="space-y-1.5">
                        <Label>Name</Label>
                        <Input name="name" required defaultValue={box.name} />
                    </div>
                    <div className="space-y-1.5">
                        <Label>From name</Label>
                        <Input
                            name="from_name"
                            required
                            defaultValue={box.from_name}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>From address</Label>
                        <Input
                            name="from_address"
                            type="email"
                            required
                            defaultValue={box.from_address}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Daily limit</Label>
                        <Input
                            name="daily_limit"
                            type="number"
                            min={0}
                            defaultValue={box.daily_limit}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>SMTP host</Label>
                        <Input name="host" required defaultValue={box.host} />
                    </div>
                    <div className="space-y-1.5">
                        <Label>SMTP port</Label>
                        <Input
                            name="port"
                            type="number"
                            required
                            defaultValue={box.port}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>SMTP encryption</Label>
                        <NativeSelect
                            name="encryption"
                            defaultValue={box.encryption}
                        >
                            <option value="tls">tls</option>
                            <option value="ssl">ssl</option>
                            <option value="none">none</option>
                        </NativeSelect>
                    </div>
                    <div className="space-y-1.5">
                        <Label>SMTP username</Label>
                        <Input
                            name="username"
                            required
                            defaultValue={box.username}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>SMTP password (blank = keep)</Label>
                        <Input
                            name="password"
                            type="password"
                            placeholder={box.password_set ? '••••••••' : ''}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>IMAP host (replies)</Label>
                        <Input
                            name="imap_host"
                            defaultValue={box.imap_host ?? ''}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>IMAP port</Label>
                        <Input
                            name="imap_port"
                            type="number"
                            defaultValue={box.imap_port ?? 993}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>IMAP encryption</Label>
                        <NativeSelect
                            name="imap_encryption"
                            defaultValue={box.imap_encryption ?? 'ssl'}
                        >
                            <option value="ssl">ssl</option>
                            <option value="tls">tls</option>
                            <option value="none">none</option>
                        </NativeSelect>
                    </div>
                    <div className="space-y-1.5">
                        <Label>IMAP username</Label>
                        <Input
                            name="imap_username"
                            defaultValue={box.imap_username ?? ''}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>IMAP password (blank = keep)</Label>
                        <Input
                            name="imap_password"
                            type="password"
                            placeholder={
                                box.imap_password_set ? '••••••••' : ''
                            }
                        />
                    </div>
                    {box.enabled ? (
                        <div className="space-y-1.5">
                            <Label>Warmup status</Label>
                            <NativeSelect
                                name="status"
                                defaultValue={
                                    box.effective_status === 'active'
                                        ? 'active'
                                        : 'warming'
                                }
                            >
                                <option value="warming">warming</option>
                                <option value="active">active</option>
                            </NativeSelect>
                        </div>
                    ) : null}
                    <div className="flex items-end">
                        <Button size="sm" disabled={processing}>
                            Save changes
                        </Button>
                    </div>
                </>
            )}
        </Form>
    );
}

MailboxesIndex.layout = {
    breadcrumbs: [{ title: 'Mailboxes', href: '/outbound/mailboxes' }],
};
