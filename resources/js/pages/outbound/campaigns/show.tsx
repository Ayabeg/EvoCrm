import { Form, Link, router } from '@inertiajs/react';
import { OutboundPage, OutboundShell } from '@/components/crm/outbound-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Counts = {
    queued: number;
    deferred: number;
    sent: number;
    failed: number;
    opened: number;
    clicked: number;
    replied: number;
};

type Campaign = {
    id: number;
    name: string;
    status: string;
    subject?: string | null;
    body: string;
    scheduled_at?: string | null;
    started_at?: string | null;
    sent_at?: string | null;
    audience_count: number;
    suppressed_count: number;
    created_at: string;
    saved_filter?: { id: number; name: string } | null;
    template?: { id: number; name: string } | null;
    mailbox?: { id: number; name: string; from_address: string } | null;
    counts: Counts;
};

type Message = {
    id: number;
    to_address: string;
    subject?: string | null;
    status: string;
    failure_reason?: string | null;
    defer_reason?: string | null;
    deferred_until?: string | null;
    sent_at?: string | null;
    opened_at?: string | null;
    clicked_at?: string | null;
    replied_at?: string | null;
    contact?: {
        id: number;
        first_name: string;
        last_name?: string | null;
        email?: string | null;
    } | null;
};

export default function CampaignShow({
    campaign,
    messages,
}: {
    campaign: Campaign;
    messages: Message[];
}) {
    const editable = ['draft', 'scheduled'].includes(campaign.status);

    return (
        <OutboundShell title={campaign.name}>
            <OutboundPage
                title={campaign.name}
                description={`${campaign.saved_filter ? `List: ${campaign.saved_filter.name}` : 'All contacts with email'} · ${
                    campaign.mailbox
                        ? `Mailbox: ${campaign.mailbox.name}`
                        : 'Default mailbox'
                } · ${campaign.status}`}
                actions={
                    <div className="flex items-center gap-2">
                        {editable ? (
                            <Button
                                onClick={() =>
                                    router.post(
                                        `/outbound/campaigns/${campaign.id}/send-now`,
                                    )
                                }
                            >
                                Send now
                            </Button>
                        ) : null}
                        {['draft', 'scheduled', 'sending'].includes(
                            campaign.status,
                        ) ? (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    if (
                                        window.confirm(
                                            `Cancel campaign ${campaign.name}? Unsent messages are dropped.`,
                                        )
                                    ) {
                                        router.post(
                                            `/outbound/campaigns/${campaign.id}/cancel`,
                                        );
                                    }
                                }}
                            >
                                Cancel
                            </Button>
                        ) : null}
                    </div>
                }
            >

                <div className="grid gap-3 md:grid-cols-4">
                    {(
                        [
                            ['Audience', campaign.audience_count],
                            ['Suppressed (skipped)', campaign.suppressed_count],
                            ['Sent', campaign.counts.sent],
                            [
                                'Pending',
                                campaign.counts.queued +
                                    campaign.counts.deferred,
                            ],
                            ['Failed', campaign.counts.failed],
                            ['Opened', campaign.counts.opened],
                            ['Clicked', campaign.counts.clicked],
                            ['Replied', campaign.counts.replied],
                        ] as [string, number][]
                    ).map(([label, value]) => (
                        <div key={label} className="border-t border-hairline py-2">
                            <p className="text-[11px] text-muted-foreground uppercase">
                                {label}
                            </p>
                            <p className="mt-1 text-lg font-semibold">
                                {value}
                            </p>
                        </div>
                    ))}
                </div>

                {campaign.status === 'draft' ||
                campaign.status === 'scheduled' ? (
                    <section className="border-t border-hairline pt-3">
                        <h2 className="mb-3 text-[13px] font-medium">Schedule</h2>
                        <Form
                            action={`/outbound/campaigns/${campaign.id}/schedule`}
                            method="post"
                            className="flex items-end gap-3"
                        >
                            {({ processing }) => (
                                <>
                                    <div>
                                        <Label>Send at</Label>
                                        <Input
                                            name="scheduled_at"
                                            type="datetime-local"
                                            required
                                        />
                                    </div>
                                    <Button
                                        disabled={processing}
                                        variant="outline"
                                    >
                                        Schedule
                                    </Button>
                                </>
                            )}
                        </Form>
                        <p className="mt-2 text-xs text-muted-foreground">
                            The runner expands the audience when the schedule is
                            due, then sends within quiet hours and the mailbox
                            daily cap.
                        </p>
                    </section>
                ) : null}

                <section className="border-t border-hairline pt-3">
                    <h2 className="mb-2 text-[13px] font-medium">Content</h2>
                    <p className="text-sm text-muted-foreground">
                        Subject: {campaign.subject ?? '—'}
                    </p>
                    <p className="mt-2 rounded-md bg-canvas-soft p-3 text-sm whitespace-pre-wrap text-muted-foreground">
                        {campaign.body}
                    </p>
                </section>

                <section className="overflow-x-auto border-t border-hairline">
                    <h2 className="py-2 text-[13px] font-medium">
                        Messages
                    </h2>
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-2">To</th>
                                <th className="px-4 py-2">Status</th>
                                <th className="px-4 py-2">Opened</th>
                                <th className="px-4 py-2">Clicked</th>
                                <th className="px-4 py-2">Replied</th>
                                <th className="px-4 py-2">Sent</th>
                            </tr>
                        </thead>
                        <tbody>
                            {messages.length === 0 ? (
                                <tr>
                                    <td
                                        className="px-4 py-6 text-muted-foreground"
                                        colSpan={6}
                                    >
                                        No messages yet — send now or wait for
                                        the schedule.
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
                                                    )}
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
                                            {message.opened_at ? 'yes' : '—'}
                                        </td>
                                        <td className="px-4 py-2 text-xs text-muted-foreground">
                                            {message.clicked_at ? 'yes' : '—'}
                                        </td>
                                        <td className="px-4 py-2 text-xs text-muted-foreground">
                                            {message.replied_at ? 'yes' : '—'}
                                        </td>
                                        <td className="px-4 py-2 text-xs text-muted-foreground">
                                            {message.sent_at ?? '—'}
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

CampaignShow.layout = {
    breadcrumbs: [
        { title: 'Campaigns', href: '/outbound/campaigns' },
        { title: 'Campaign', href: '#' },
    ],
};
