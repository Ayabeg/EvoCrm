import { Form, Link } from '@inertiajs/react';
import { OutboundPage, OutboundShell } from '@/components/crm/outbound-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Lead = { id: number; title: string; status: string };
type Reply = {
    id: number;
    subject?: string | null;
    body?: string | null;
    created_at: string;
    contact?: {
        id: number;
        first_name: string;
        last_name?: string | null;
        email?: string | null;
        leads?: Lead[];
    } | null;
    mailbox?: { id: number; name: string } | null;
    parent?: { id: number; subject?: string | null } | null;
};

function primaryLead(contact: NonNullable<Reply['contact']>): Lead | null {
    if (!contact.leads?.length) {
return null;
}

    return contact.leads.find((l) => l.status !== 'qualified') ?? contact.leads[0] ?? null;
}

export default function Replies({ replies, imapNote }: { replies: Reply[]; imapNote: string }) {
    return (
        <OutboundShell title="Replies">
            <OutboundPage title="Replies" description={imapNote}>
                <section className="overflow-x-auto border-t border-hairline">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-2">From</th>
                                <th className="px-4 py-2">Subject</th>
                                <th className="px-4 py-2">Lead</th>
                                <th className="px-4 py-2">Received</th>
                            </tr>
                        </thead>
                        <tbody>
                            {replies.map((reply) => {
                                const lead = reply.contact ? primaryLead(reply.contact) : null;

                                return (
                                    <tr key={reply.id} className="border-t border-hairline align-top">
                                        <td className="px-4 py-2">
                                            {reply.contact ? (
                                                <Link href={`/crm/contacts/${reply.contact.id}`} className="text-ink hover:underline">
                                                    {reply.contact.first_name} {reply.contact.last_name ?? ''}
                                                </Link>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td className="px-4 py-2">{reply.subject ?? '—'}</td>
                                        <td className="px-4 py-2">
                                            {lead ? (
                                                <div className="flex items-center gap-2">
                                                    <Link href={`/crm/leads/${lead.id}`} className="text-ink hover:underline">
                                                        {lead.title}
                                                    </Link>
                                                    {lead.status !== 'qualified' ? (
                                                        <Form
                                                            action={`/crm/leads/${lead.id}/qualify`}
                                                            method="post"
                                                            options={{ preserveScroll: true }}
                                                        >
                                                            <Button type="submit" variant="outline" className="h-6 px-2 text-[11px]">
                                                                Qualify
                                                            </Button>
                                                        </Form>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-[10px]">
                                                            Qualified
                                                        </Badge>
                                                    )}
                                                </div>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-xs text-muted-foreground">{reply.created_at}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </section>
            </OutboundPage>
        </OutboundShell>
    );
}

Replies.layout = { breadcrumbs: [{ title: 'Replies', href: '/outbound/replies' }] };
