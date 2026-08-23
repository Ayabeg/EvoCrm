import { Head, Link } from '@inertiajs/react';
import PageHeader from '@/components/page-header';
import { Card } from '@/components/ui/card';

type Reply = {
    id: number;
    subject?: string | null;
    body?: string | null;
    created_at: string;
    contact?: { id: number; first_name: string; last_name?: string | null; email?: string | null } | null;
    mailbox?: { id: number; name: string } | null;
    parent?: { id: number; subject?: string | null; sent_at?: string | null } | null;
};

export default function Replies({ replies, imapNote }: { replies: Reply[]; imapNote: string }) {
    return (
        <>
            <Head title="Replies" />
            <div className="flex-1 space-y-6 p-6">
                <PageHeader title="Replies" description={imapNote} />

                <Card className="overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-2">From</th>
                                <th className="px-4 py-2">Subject</th>
                                <th className="px-4 py-2">In reply to</th>
                                <th className="px-4 py-2">Mailbox</th>
                                <th className="px-4 py-2">Received</th>
                            </tr>
                        </thead>
                        <tbody>
                            {replies.length === 0 ? (
                                <tr>
                                    <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                                        No replies yet. Once a mailbox has IMAP settings, the poller records inbound
                                        mail from known contacts here.
                                    </td>
                                </tr>
                            ) : (
                                replies.map((reply) => (
                                    <tr key={reply.id} className="border-t border-hairline align-top">
                                        <td className="px-4 py-2">
                                            {reply.contact ? (
                                                <Link href={`/crm/contacts/${reply.contact.id}`} className="text-brand">
                                                    {reply.contact.first_name} {reply.contact.last_name ?? ''}
                                                </Link>
                                            ) : (
                                                '—'
                                            )}
                                            <span className="block text-xs text-muted-foreground">
                                                {reply.contact?.email ?? ''}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2">
                                            {reply.subject ?? '—'}
                                            {reply.body ? (
                                                <span className="block max-w-md truncate text-xs text-muted-foreground" title={reply.body}>
                                                    {reply.body}
                                                </span>
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-2 text-xs text-muted-foreground">
                                            {reply.parent?.subject ?? '—'}
                                        </td>
                                        <td className="px-4 py-2">{reply.mailbox?.name ?? '—'}</td>
                                        <td className="px-4 py-2 text-xs text-muted-foreground">{reply.created_at}</td>
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

Replies.layout = {
    breadcrumbs: [{ title: 'Replies', href: '/outbound/replies' }],
};
