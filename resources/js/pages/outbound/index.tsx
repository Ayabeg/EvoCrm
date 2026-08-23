import { Head, Link } from '@inertiajs/react';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

type Stats = {
    mailboxes: number;
    mailboxes_enabled: number;
    sequences_active: number;
    enrolled_active: number;
    sent_30d: number;
    replies_30d: number;
    failed_30d: number;
};

type Message = {
    id: number;
    direction: string;
    channel: string;
    to_address: string;
    subject?: string | null;
    status: string;
    sent_at?: string | null;
    created_at: string;
    contact?: { id: number; first_name: string; last_name?: string | null } | null;
    sequence?: { id: number; name: string } | null;
};

export default function OutboundIndex({ stats, recent }: { stats: Stats; recent: Message[] }) {
    return (
        <>
            <Head title="Outbound" />
            <div className="flex-1 space-y-6 p-6">
                <PageHeader
                    title="Email outbound"
                    description="SMTP mailboxes, sequences, templates, suppression, and quiet hours. WhatsApp stays official Cloud templates only."
                />

                <div className="grid gap-3 md:grid-cols-4">
                    {[
                        ['Mailboxes', `${stats.mailboxes_enabled}/${stats.mailboxes} enabled`, '/outbound/mailboxes'],
                        ['Active sequences', String(stats.sequences_active), '/outbound/sequences'],
                        ['Enrolled (active)', String(stats.enrolled_active), '/outbound/sequences'],
                        ['Sent · 30d', String(stats.sent_30d), '/outbound/outbox'],
                        ['Replies · 30d', String(stats.replies_30d), '/outbound/replies'],
                        ['Failed · 30d', String(stats.failed_30d), '/outbound/outbox?status=failed'],
                        ['Reports', 'sent / opened / replied', '/outbound/reports'],
                    ].map(([label, value, href]) => (
                        <Link key={label} href={href}>
                            <Card className="p-3">
                                <p className="text-[11px] uppercase text-muted-foreground">{label}</p>
                                <p className="mt-1 text-lg font-semibold">{value}</p>
                            </Card>
                        </Link>
                    ))}
                </div>

                <Card className="overflow-hidden">
                    <h2 className="border-b border-hairline px-4 py-2 text-sm font-medium">Recent activity</h2>
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-2">Direction</th>
                                <th className="px-4 py-2">Contact</th>
                                <th className="px-4 py-2">Subject</th>
                                <th className="px-4 py-2">Sequence</th>
                                <th className="px-4 py-2">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recent.length === 0 ? (
                                <tr>
                                    <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                                        Nothing sent yet. Create a mailbox, then enroll contacts in a sequence.
                                    </td>
                                </tr>
                            ) : (
                                recent.map((message) => (
                                    <tr key={message.id} className="border-t border-hairline">
                                        <td className="px-4 py-2">
                                            <Badge variant={message.direction === 'in' ? 'default' : 'secondary'}>
                                                {message.direction === 'in' ? 'reply' : message.channel}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-2">
                                            {message.contact ? (
                                                <Link href={`/crm/contacts/${message.contact.id}`} className="text-brand">
                                                    {message.contact.first_name} {message.contact.last_name ?? ''}
                                                </Link>
                                            ) : (
                                                message.to_address
                                            )}
                                        </td>
                                        <td className="px-4 py-2">{message.subject ?? '—'}</td>
                                        <td className="px-4 py-2">
                                            {message.sequence ? (
                                                <Link
                                                    href={`/outbound/sequences/${message.sequence.id}`}
                                                    className="text-brand"
                                                >
                                                    {message.sequence.name}
                                                </Link>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td className="px-4 py-2">{message.status}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </Card>
            </div>
        </>
    );
}

OutboundIndex.layout = {
    breadcrumbs: [{ title: 'Outbound', href: '/outbound' }],
};
