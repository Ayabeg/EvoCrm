import { Form, router } from '@inertiajs/react';
import { OutboundPage, OutboundShell } from '@/components/crm/outbound-shell';
import { MailboxList } from '@/evo/outbound/MailboxList';
import { Field, OutboundSection } from '@/evo/outbound/section';
import type { MailboxRow } from '@/evo/outbound/types';
import { Button } from '@/evo/ui/button';
import { Input } from '@/evo/ui/input';
import { NativeSelect } from '@/evo/ui/native-select';
import { t } from '@/lib/i18n';

type MailboxPageRow = MailboxRow & {
    source: string;
    from_name: string;
    host: string;
    port: number;
    encryption: string;
    username: string;
    imap_configured: boolean;
    is_default: boolean;
    enabled: boolean;
    password_set: boolean;
    imap_password_set: boolean;
};

type MailStack = {
    configured: boolean;
    roundcube_url: string;
};

function MailboxActions({
    box,
    roundcubeUrl,
}: {
    box: MailboxPageRow;
    roundcubeUrl: string;
}) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={() => router.post(`/outbound/mailboxes/${box.id}/toggle`)}
            >
                {box.enabled ? t('Disable') : t('Enable')}
            </Button>
            {!box.is_default ? (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.post(`/outbound/mailboxes/${box.id}/default`)}
                >
                    {t('Make default')}
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
                            aria-label={t('Test recipient')}
                        />
                        <Button variant="outline" size="sm" disabled={processing || !box.enabled}>
                            {t('Send test')}
                        </Button>
                    </>
                )}
            </Form>
            <Button variant="outline" size="sm" asChild>
                <a href={roundcubeUrl} target="_blank" rel="noopener noreferrer">
                    {t('Open Roundcube')}
                </a>
            </Button>
            {box.source === 'mail_stack' ? (
                <span className="text-[11px] text-[var(--evo-ink-muted)]">
                    {t('Synced from the mail stack - remove it there, not here.')}
                </span>
            ) : (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        if (window.confirm(t('Delete mailbox :name?', { name: box.name }))) {
                            router.delete(`/outbound/mailboxes/${box.id}`);
                        }
                    }}
                >
                    {t('Delete')}
                </Button>
            )}
        </div>
    );
}

function MailboxEditForm({ box }: { box: MailboxPageRow }) {
    return (
        <Form
            action={`/outbound/mailboxes/${box.id}`}
            method="put"
            className="mt-3 grid gap-3 md:grid-cols-4"
        >
            {({ processing }) => (
                <>
                    <Field label={t('Name')}>
                        <Input name="name" required defaultValue={box.name} />
                    </Field>
                    <Field label={t('From name')}>
                        <Input name="from_name" required defaultValue={box.from_name} />
                    </Field>
                    <Field label={t('From address')}>
                        <Input name="from_address" type="email" required defaultValue={box.from_address} />
                    </Field>
                    <Field label={t('Daily limit')}>
                        <Input name="daily_limit" type="number" min={0} defaultValue={box.daily_limit} />
                    </Field>
                    <Field label={t('SMTP host')}>
                        <Input name="host" required defaultValue={box.host} />
                    </Field>
                    <Field label={t('SMTP port')}>
                        <Input name="port" type="number" required defaultValue={box.port} />
                    </Field>
                    <Field label={t('SMTP encryption')}>
                        <NativeSelect name="encryption" defaultValue={box.encryption}>
                            <option value="tls">tls</option>
                            <option value="ssl">ssl</option>
                            <option value="none">none</option>
                        </NativeSelect>
                    </Field>
                    <Field label={t('SMTP username')}>
                        <Input name="username" required defaultValue={box.username} />
                    </Field>
                    <Field label={t('SMTP password (blank = keep)')}>
                        <Input
                            name="password"
                            type="password"
                            placeholder={box.password_set ? '••••••••' : ''}
                        />
                    </Field>
                    <Field label={t('IMAP host (replies)')}>
                        <Input name="imap_host" defaultValue={box.imap_host ?? ''} />
                    </Field>
                    <Field label={t('IMAP port')}>
                        <Input name="imap_port" type="number" defaultValue={box.imap_port ?? 993} />
                    </Field>
                    <Field label={t('IMAP encryption')}>
                        <NativeSelect name="imap_encryption" defaultValue={box.imap_encryption ?? 'ssl'}>
                            <option value="ssl">ssl</option>
                            <option value="tls">tls</option>
                            <option value="none">none</option>
                        </NativeSelect>
                    </Field>
                    <Field label={t('IMAP username')}>
                        <Input name="imap_username" defaultValue={box.imap_username ?? ''} />
                    </Field>
                    <Field label={t('IMAP password (blank = keep)')}>
                        <Input
                            name="imap_password"
                            type="password"
                            placeholder={box.imap_password_set ? '••••••••' : ''}
                        />
                    </Field>
                    {box.enabled ? (
                        <Field label={t('Warmup status')}>
                            <NativeSelect
                                name="status"
                                defaultValue={box.effective_status === 'active' ? 'active' : 'warming'}
                            >
                                <option value="warming">{t('warming')}</option>
                                <option value="active">{t('active')}</option>
                            </NativeSelect>
                        </Field>
                    ) : null}
                    <div className="flex items-end">
                        <Button size="sm" disabled={processing}>
                            {t('Save changes')}
                        </Button>
                    </div>
                </>
            )}
        </Form>
    );
}

export default function MailboxesIndex({
    mailboxes,
    mail_stack,
}: {
    mailboxes: MailboxPageRow[];
    mail_stack: MailStack;
}) {
    return (
        <OutboundShell title={t('Mailboxes')}>
            <OutboundPage
                title={t('SMTP mailboxes')}
                description={t(
                    'Passwords are encrypted at rest. New mailboxes start disabled - enable one, warm it up, then sequences send through it. Without an enabled mailbox, outbound email uses the Disabled provider and fails honestly in the outbox.',
                )}
            >
                {mail_stack.configured ? (
                    <OutboundSection
                        title={t('Mail stack sync')}
                        description={t(
                            'Every mailbox on the live mail stack lands here automatically. The sync runs every 15 minutes. Webmail is Roundcube on the same host; campaigns and sequences stay in the CRM.',
                        )}
                        actions={
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.post('/outbound/mailboxes/sync')}
                            >
                                {t('Sync now')}
                            </Button>
                        }
                    >
                        <p className="text-[12px] text-[var(--evo-ink-muted)]">
                            {t(
                                'SMTP send, IMAP replies, and Roundcube stay on the stack. This page is the CRM view of those boxes.',
                            )}
                        </p>
                    </OutboundSection>
                ) : (
                    <OutboundSection title={t('Connect the mail stack')}>
                        <p className="text-[13px] text-[var(--evo-ink-muted)]">
                            {t(
                                'Set EVOSALES_MAIL_API_TOKEN (and optionally EVOSALES_MAIL_API_URL) in the environment and every mailbox on the live mail stack appears here automatically - SMTP send, IMAP replies, and Roundcube webmail. Until then, add a mailbox manually below.',
                            )}
                        </p>
                    </OutboundSection>
                )}

                <OutboundSection title={t('Add mailbox')}>
                    <Form
                        action="/outbound/mailboxes"
                        method="post"
                        className="grid gap-3 md:grid-cols-4"
                        resetOnSuccess
                    >
                        {({ processing }) => (
                            <>
                                <Field label={t('Name')}>
                                    <Input name="name" required placeholder="Sales - Amine" />
                                </Field>
                                <Field label={t('From name')}>
                                    <Input name="from_name" required placeholder="Amine · Evotechly" />
                                </Field>
                                <Field label={t('From address')}>
                                    <Input
                                        name="from_address"
                                        type="email"
                                        required
                                        placeholder="amine@evotechly.com"
                                    />
                                </Field>
                                <Field label={t('Daily limit')}>
                                    <Input name="daily_limit" type="number" min={0} defaultValue={50} />
                                </Field>
                                <Field label={t('SMTP host')}>
                                    <Input name="host" required placeholder="smtp.evotechly.com" />
                                </Field>
                                <Field label={t('SMTP port')}>
                                    <Input name="port" type="number" defaultValue={587} required />
                                </Field>
                                <Field label={t('SMTP encryption')}>
                                    <NativeSelect name="encryption" defaultValue="tls">
                                        <option value="tls">tls</option>
                                        <option value="ssl">ssl</option>
                                        <option value="none">none</option>
                                    </NativeSelect>
                                </Field>
                                <Field label={t('SMTP username')}>
                                    <Input name="username" required />
                                </Field>
                                <Field label={t('SMTP password')}>
                                    <Input name="password" type="password" required />
                                </Field>
                                <Field label={t('IMAP host (replies)')}>
                                    <Input name="imap_host" placeholder="imap.evotechly.com" />
                                </Field>
                                <Field label={t('IMAP port')}>
                                    <Input name="imap_port" type="number" defaultValue={993} />
                                </Field>
                                <Field label={t('IMAP encryption')}>
                                    <NativeSelect name="imap_encryption" defaultValue="ssl">
                                        <option value="ssl">ssl</option>
                                        <option value="tls">tls</option>
                                        <option value="none">none</option>
                                    </NativeSelect>
                                </Field>
                                <Field label={t('IMAP username')}>
                                    <Input name="imap_username" />
                                </Field>
                                <Field label={t('IMAP password')}>
                                    <Input name="imap_password" type="password" />
                                </Field>
                                <div className="flex items-end">
                                    <Button disabled={processing}>{t('Save mailbox')}</Button>
                                </div>
                            </>
                        )}
                    </Form>
                </OutboundSection>

                <MailboxList
                    mailboxes={mailboxes}
                    renderActions={(box) => (
                        <MailboxActions box={box as MailboxPageRow} roundcubeUrl={mail_stack.roundcube_url} />
                    )}
                    renderAfter={(box) => (
                        <details className="mt-2 rounded-[var(--evo-radius-compact)] border border-[var(--evo-hairline)] bg-[var(--evo-canvas)] px-3 py-2">
                            <summary className="cursor-pointer text-[12px] font-medium text-[var(--evo-ink-muted)]">
                                {t('Edit mailbox')}
                            </summary>
                            <MailboxEditForm box={box as MailboxPageRow} />
                        </details>
                    )}
                />
            </OutboundPage>
        </OutboundShell>
    );
}

MailboxesIndex.layout = {
    breadcrumbs: [{ title: t('Mailboxes'), href: '/outbound/mailboxes' }],
};
