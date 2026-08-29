import { Link, router } from '@inertiajs/react';
import { OutboundPage, OutboundShell } from '@/components/crm/outbound-shell';
import { Badge } from '@/components/ui/badge';

type Message = {
    id: number;
    channel: string;
    to_address: string;
    subject?: string | null;
    status: string;
    failure_reason?: string | null;
    defer_reason?: string | null;
    deferred_until?: string | null;
    sent_at?: string | null;
    opened_at?: string | null;
    open_count: number;
    clicked_at?: string | null;
    click_count: number;
    replied_at?: string | null;
    created_at: string;
    contact?: {
        id: number;
        first_name: string;
        last_name?: string | null;
        email?: string | null;
    } | null;
    mailbox?: { id: number; name: string; from_address: string } | null;
    sequence?: { id: number; name: string } | null;
    campaign?: { id: number; name: string } | null;
};

const FILTERS = ['', 'queued', 'deferred', 'sent', 'failed'] as const;

export default function Outbox({
    messages,
    status,
    counts,
}: {
    messages: Message[];
    status: string;
    counts: { queued: number; deferred: number; sent: number; failed: number };
}) {
    return (
        <OutboundShell title="Outbox">
            <OutboundPage
                title="Outbox"
                description="Every dispatch attempt is logged here — queued, deferred by quiet hours or a daily cap, sent, or failed with the reason."
            >

                <div className="flex flex-wrap gap-2">
                    {FILTERS.map((filter) => (
                        <button
                            key={filter || 'all'}
                            type="button"
                            onClick={() =>
                                router.get(
                                    '/outbound/outbox',
                                    filter ? { status: filter } : {},
                                    { preserveState: true },
                                )
                            }
                            className={`rounded-full border border-hairline px-3 py-1 text-xs ${
                                status === filter
                                    ? 'bg-canvas-soft text-ink'
                                    : 'bg-canvas text-mute'
                            }`}
                        >
                            {filter === ''
                                ? `All (${counts.queued + counts.deferred + counts.sent + counts.failed})`
                                : `${filter} (${counts[filter as keyof typeof counts]})`}
                        </button>
                    ))}
                </div>

                <section className="overflow-x-auto border-t border-hairline">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-2">To</th>
                                <th className="px-4 py-2">Subject</th>
                                <th className="px-4 py-2">Mailbox</th>
                                <th className="px-4 py-2">Source</th>
                                <th className="px-4 py-2">Status</th>
                                <th className="px-4 py-2">Opened</th>
                                <th className="px-4 py-2">Clicked</th>
                                <th className="px-4 py-2">Sent</th>
                            </tr>
                        </thead>
                        <tbody>
                            {messages.length === 0 ? (
                                <tr>
                                    <td
                                        className="px-4 py-6 text-muted-foreground"
                                        colSpan={8}
                                    >
                                        Nothing here yet.
                                    </td>
                                </tr>
                            ) : (
                                messages.map((message) => (
                                    <tr
                                        key={message.id}
                                        className="border-t border-hairline"
                                    >
                                        <td className="px-4 py-2">
                                            {message.contact ? (
                                                <Link
                                                    href={`/crm/contacts/${message.contact.id}`}
                                                    className="text-ink hover:underline"
                                                >
                                                    {message.contact.first_name}{' '}
                                                    {message.contact
                                                        .last_name ?? ''}
                                                </Link>
                                            ) : (
                                                message.to_address
                                            )}
                                            <span className="block text-xs text-muted-foreground">
                                                {message.to_address}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2">
                                            {message.subject ?? '—'}
                                            {message.replied_at ? (
                                                <Badge
                                                    variant="default"
                                                    className="ms-2"
                                                >
                                                    replied
                                                </Badge>
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-2">
                                            {message.mailbox?.name ?? '—'}
                                        </td>
                                        <td className="px-4 py-2">
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
                                        <td className="px-4 py-2">
                                            <Badge
                                                variant={
                                                    message.status === 'sent'
                                                        ? 'default'
                                                        : message.status ===
                                                            'failed'
                                                          ? 'outline'
                                                          : 'secondary'
                                                }
                                            >
                                                {message.status}
                                            </Badge>
                                            {message.defer_reason ? (
                                                <span className="block text-xs text-muted-foreground">
                                                    deferred ·{' '}
                                                    {message.defer_reason.replace(
                                                        '_',
                                                        ' ',
                                                    )}{' '}
                                                    until{' '}
                                                    {message.deferred_until ??
                                                        'later'}
                                                </span>
                                            ) : null}
                                            {message.failure_reason ? (
                                                <span
                                                    className="block max-w-64 truncate text-xs text-brand"
                                                    title={
                                                        message.failure_reason
                                                    }
                                                >
                                                    {message.failure_reason}
                                                </span>
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-2 text-xs text-muted-foreground">
                                            {message.opened_at
                                                ? `yes · ${message.open_count}×`
                                                : '—'}
                                        </td>
                                        <td className="px-4 py-2 text-xs text-muted-foreground">
                                            {message.clicked_at
                                                ? `yes · ${message.click_count}×`
                                                : '—'}
                                        </td>
                                        <td className="px-4 py-2 text-xs text-muted-foreground">
                                            {message.sent_at ??
                                                message.created_at}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </section>
            </OutboundPage>
        </OutboundShell>
    );
}

Outbox.layout = {
    breadcrumbs: [{ title: 'Outbox', href: '/outbound/outbox' }],
};
