import { Link } from '@inertiajs/react';
import { CrmKpiStrip } from '@/components/crm/crm-kpi-strip';
import type { KpiTile } from '@/components/crm/crm-kpi-strip';
import { OutboundShell } from '@/components/crm/outbound-shell';
import { Badge } from '@/components/ui/badge';

type Stats = {
    mailboxes: number;
    mailboxes_enabled: number;
    sequences_active: number;
    enrolled_active: number;
    sent_30d: number;
    deferred: number;
    replies_30d: number;
    suppressed: number;
    failed_30d: number;
    campaigns_sending: number;
    campaigns_sent: number;
    domains: number;
    domains_verified: number;
};

type MailboxHealth = {
    id: number;
    name: string;
    from_address: string;
    effective_status: string;
    imap_configured: boolean;
    sent_today: number;
    daily_limit: number;
    last_tested_at?: string | null;
};

type MailStack = {
    configured: boolean;
    smtp_host: string;
    smtp_port: number;
    imap_host: string;
    imap_port: number;
    roundcube_url: string;
};

type Message = {
    id: number;
    direction: string;
    channel: string;
    to_address: string;
    subject?: string | null;
    status: string;
    defer_reason?: string | null;
    sent_at?: string | null;
    created_at: string;
    contact?: {
        id: number;
        first_name: string;
        last_name?: string | null;
    } | null;
    sequence?: { id: number; name: string } | null;
    campaign?: { id: number; name: string } | null;
};

function healthVariant(status: string): 'default' | 'secondary' | 'outline' {
    if (status === 'active') {
        return 'default';
    }

    if (status === 'warming') {
        return 'secondary';
    }

    return 'outline';
}

function outboundKpis(stats: Stats): KpiTile[] {
    return [
        { key: 'sent', label: 'Sent · 30d', value: stats.sent_30d, href: '/outbound/outbox' },
        { key: 'deferred', label: 'Deferred', value: stats.deferred, href: '/outbound/outbox?status=deferred' },
        { key: 'replies', label: 'Replies · 30d', value: stats.replies_30d, href: '/outbound/replies' },
        { key: 'suppressed', label: 'Suppressed', value: stats.suppressed, href: '/outbound/suppressions' },
        { key: 'failed', label: 'Failed · 30d', value: stats.failed_30d, href: '/outbound/outbox?status=failed' },
        {
            key: 'campaigns',
            label: 'Campaigns',
            value: `${stats.campaigns_sending} live · ${stats.campaigns_sent} sent`,
            href: '/outbound/campaigns',
        },
        {
            key: 'sequences',
            label: 'Sequences',
            value: `${stats.sequences_active} active · ${stats.enrolled_active} enrolled`,
            href: '/outbound/sequences',
        },
        {
            key: 'domains',
            label: 'Domains',
            value: `${stats.domains_verified}/${stats.domains} verified`,
            href: '/outbound/domains',
        },
    ];
}

export default function OutboundIndex({
    stats,
    mailboxHealth,
    recent,
    mail_stack,
}: {
    stats: Stats;
    mailboxHealth: MailboxHealth[];
    recent: Message[];
    mail_stack: MailStack;
}) {
    return (
        <OutboundShell title="Outbound">
            <div className="space-y-4 px-4 py-3 md:px-5 md:py-4">
                <p className="text-ui text-muted-foreground">
                    Mailboxes, sending domains, templates, sequences, broadcast campaigns,
                    suppression, and quiet hours. WhatsApp stays official Cloud templates only.
                </p>

                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-hairline pb-3">
                    <div>
                        <h2 className="text-[13px] font-medium text-ink">Live mail stack</h2>
                        <p className="mt-1 max-w-3xl text-[11px] text-muted-foreground">
                            SMTP {mail_stack.smtp_host}:{mail_stack.smtp_port} · IMAP{' '}
                            {mail_stack.imap_host}:{mail_stack.imap_port} · webmail is Roundcube
                            on the same host.{' '}
                            {mail_stack.configured
                                ? 'Mailboxes sync from the stack automatically.'
                                : 'Set EVOSALES_MAIL_API_TOKEN to sync mailboxes automatically.'}{' '}
                            Campaigns and sequences live here in the CRM.
                        </p>
                    </div>
                    <a
                        className="shrink-0 text-[13px] text-ink underline-offset-2 hover:underline"
                        href={mail_stack.roundcube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Open Roundcube
                    </a>
                </div>

                <CrmKpiStrip kpis={outboundKpis(stats)} columns={4} />

                <section className="overflow-x-auto border-t border-hairline">
                    <h2 className="py-2 text-[13px] font-medium text-ink">
                        Mailbox health{' '}
                        <span className="font-normal text-muted-foreground">
                            — {stats.mailboxes_enabled}/{stats.mailboxes} enabled
                        </span>
                    </h2>
                    <table className="w-full text-ui">
                        <thead className="text-left text-[11px] text-muted-foreground">
                            <tr>
                                <th className="py-1.5 font-medium">Mailbox</th>
                                <th className="py-1.5 font-medium">Status</th>
                                <th className="py-1.5 font-medium">IMAP replies</th>
                                <th className="py-1.5 font-medium">Sent today</th>
                                <th className="py-1.5 font-medium">Last test</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mailboxHealth.length === 0 ? (
                                <tr>
                                    <td className="py-4 text-muted-foreground" colSpan={5}>
                                        No mailbox yet — add one under Mailboxes, enable it, and
                                        send a test.
                                    </td>
                                </tr>
                            ) : (
                                mailboxHealth.map((box) => (
                                    <tr key={box.id} className="border-t border-hairline">
                                        <td className="py-1.5">
                                            <Link
                                                href="/outbound/mailboxes"
                                                className="font-medium text-ink hover:underline"
                                            >
                                                {box.name}
                                            </Link>
                                            <span className="block text-[11px] text-muted-foreground">
                                                {box.from_address}
                                            </span>
                                        </td>
                                        <td className="py-1.5">
                                            <Badge variant={healthVariant(box.effective_status)}>
                                                {box.effective_status}
                                            </Badge>
                                        </td>
                                        <td className="py-1.5 text-muted-foreground">
                                            {box.imap_configured ? 'on' : 'off'}
                                        </td>
                                        <td className="py-1.5 text-muted-foreground">
                                            {box.sent_today}/{box.daily_limit}
                                        </td>
                                        <td className="py-1.5 text-muted-foreground">
                                            {box.last_tested_at ?? 'never'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </section>

                <section className="overflow-x-auto border-t border-hairline">
                    <h2 className="py-2 text-[13px] font-medium text-ink">Recent activity</h2>
                    <table className="w-full text-ui">
                        <thead className="text-left text-[11px] text-muted-foreground">
                            <tr>
                                <th className="py-1.5 font-medium">Direction</th>
                                <th className="py-1.5 font-medium">Contact</th>
                                <th className="py-1.5 font-medium">Subject</th>
                                <th className="py-1.5 font-medium">Source</th>
                                <th className="py-1.5 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recent.length === 0 ? (
                                <tr>
                                    <td className="py-4 text-muted-foreground" colSpan={5}>
                                        Nothing sent yet. Create a mailbox, then enroll contacts
                                        in a sequence or send a campaign.
                                    </td>
                                </tr>
                            ) : (
                                recent.map((message) => (
                                    <tr key={message.id} className="border-t border-hairline">
                                        <td className="py-1.5">
                                            <Badge
                                                variant={
                                                    message.direction === 'in'
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {message.direction === 'in'
                                                    ? 'reply'
                                                    : message.channel}
                                            </Badge>
                                        </td>
                                        <td className="py-1.5">
                                            {message.contact ? (
                                                <Link
                                                    href={`/crm/contacts/${message.contact.id}`}
                                                    className="text-ink hover:underline"
                                                >
                                                    {message.contact.first_name}{' '}
                                                    {message.contact.last_name ?? ''}
                                                </Link>
                                            ) : (
                                                message.to_address
                                            )}
                                        </td>
                                        <td className="py-1.5">{message.subject ?? '—'}</td>
                                        <td className="py-1.5">
                                            {message.sequence ? (
                                                <Link
                                                    href={`/outbound/sequences/${message.sequence.id}`}
                                                    className="text-ink hover:underline"
                                                >
                                                    {message.sequence.name}
                                                </Link>
                                            ) : message.campaign ? (
                                                <Link
                                                    href={`/outbound/campaigns/${message.campaign.id}`}
                                                    className="text-ink hover:underline"
                                                >
                                                    {message.campaign.name}
                                                </Link>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td className="py-1.5">
                                            {message.status}
                                            {message.defer_reason ? (
                                                <span className="block text-[11px] text-muted-foreground">
                                                    deferred ·{' '}
                                                    {message.defer_reason.replace('_', ' ')}
                                                </span>
                                            ) : null}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </section>
            </div>
        </OutboundShell>
    );
}

OutboundIndex.layout = {
    breadcrumbs: [{ title: 'Outbound', href: '/outbound' }],
};
