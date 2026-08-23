import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Contact = {
    id: number;
    first_name: string;
    last_name?: string | null;
    email?: string | null;
    phone_e164?: string | null;
    company?: { id: number; name: string } | null;
    deals?: { id: number; title: string; stage?: { name: string } }[];
};

type Thread = {
    id: number;
    status: string;
    unread_count?: number;
    last_message_at?: string | null;
    subject?: string | null;
    contact: Contact;
    channel?: { name: string; type: string };
    messages?: {
        id: number;
        direction: string;
        body: string;
        status: string;
        failure_reason?: string | null;
        created_at: string;
    }[];
};

type Props = {
    threads: Thread[];
    selected: Thread | null;
    deskUrl: string;
};

function nameOf(contact?: Contact | null) {
    if (!contact) {
        return 'Unknown';
    }

    return `${contact.first_name} ${contact.last_name ?? ''}`.trim();
}

export default function ConversationHistory({ threads, selected, deskUrl }: Props) {
    const sharedDesk = usePage<{ deskUrl?: string }>().props.deskUrl || deskUrl;

    return (
        <>
            <Head title="Conversation history" />
            <div className="flex-1 space-y-6 p-6">
                <PageHeader
                    title="Conversation history"
                    description="CRM context only — threads synced from the sold Desk (EvoDesk / Chatwoot Community). This is not the Chatwoot clone."
                >
                    <Button asChild>
                        <a href={sharedDesk}>Open Desk</a>
                    </Button>
                </PageHeader>

                <Card className="border-hairline bg-canvas p-4 text-sm">
                    <p>
                        The product inbox lives at{' '}
                        <a href={sharedDesk} className="font-medium text-brand underline">
                            {sharedDesk}
                        </a>
                        . Use this list to see which Contact and Deal a conversation belongs to.
                    </p>
                </Card>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                    <Card className="overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-left">
                                <tr>
                                    <th className="px-4 py-2">Contact</th>
                                    <th className="px-4 py-2">Company</th>
                                    <th className="px-4 py-2">Last</th>
                                </tr>
                            </thead>
                            <tbody>
                                {threads.length === 0 ? (
                                    <tr>
                                        <td className="px-4 py-6 text-muted-foreground" colSpan={3}>
                                            No synced history yet.
                                        </td>
                                    </tr>
                                ) : (
                                    threads.map((thread) => (
                                        <tr
                                            key={thread.id}
                                            className={`cursor-pointer border-t hover:bg-muted/40 ${
                                                selected?.id === thread.id ? 'bg-muted/60' : ''
                                            }`}
                                            onClick={() =>
                                                router.get(
                                                    '/conversations',
                                                    { thread: thread.id },
                                                    { preserveState: true },
                                                )
                                            }
                                        >
                                            <td className="px-4 py-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{nameOf(thread.contact)}</span>
                                                    {(thread.unread_count ?? 0) > 0 ? (
                                                        <Badge variant="secondary">{thread.unread_count}</Badge>
                                                    ) : null}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {thread.contact.phone_e164 ?? 'No phone'}
                                                </p>
                                            </td>
                                            <td className="px-4 py-2">
                                                {thread.contact.company?.name ?? '—'}
                                            </td>
                                            <td className="px-4 py-2 text-xs text-muted-foreground">
                                                {thread.messages?.[0]?.body ?? thread.subject ?? '—'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </Card>

                    <Card className="space-y-4 p-4">
                        {selected ? (
                            <>
                                <div>
                                    <h2 className="font-medium">{nameOf(selected.contact)}</h2>
                                    <p className="text-sm text-muted-foreground">
                                        {selected.contact.company?.name ?? 'No company'} ·{' '}
                                        {selected.contact.phone_e164 ?? 'No phone'}
                                    </p>
                                </div>
                                <div className="space-y-2 text-sm">
                                    {(selected.messages ?? []).map((message) => (
                                        <div key={message.id} className="rounded-md border px-3 py-2">
                                            <p className="text-xs text-muted-foreground">
                                                {message.direction} · {message.status}
                                                {message.failure_reason ? ` · ${message.failure_reason}` : ''}
                                            </p>
                                            <p>{message.body}</p>
                                        </div>
                                    ))}
                                </div>
                                <Form
                                    action={`/desk/threads/${selected.id}/reply`}
                                    method="post"
                                    className="flex gap-2"
                                    resetOnSuccess={['body']}
                                >
                                    {({ processing }) => (
                                        <>
                                            <Input
                                                name="body"
                                                placeholder="Log a session reply (Evolution Cloud if connected)"
                                                required
                                            />
                                            <Button disabled={processing}>Send</Button>
                                        </>
                                    )}
                                </Form>
                                <div className="space-y-1 text-sm">
                                    <p className="font-medium">Open deal</p>
                                    {(selected.contact.deals ?? []).length === 0 ? (
                                        <p className="text-muted-foreground">No open deal on this contact.</p>
                                    ) : (
                                        selected.contact.deals?.map((deal) => (
                                            <Link
                                                key={deal.id}
                                                href={`/crm/deals/${deal.id}`}
                                                className="block text-brand"
                                            >
                                                {deal.title} · {deal.stage?.name}
                                            </Link>
                                        ))
                                    )}
                                    <Link
                                        href={`/crm/contacts/${selected.contact.id}`}
                                        className="inline-block text-brand"
                                    >
                                        Open CRM record
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Select a row to see contact ↔ deal context. Reply here only if you need a CRM-side
                                session note — the sold desk is EvoDesk.
                            </p>
                        )}
                    </Card>
                </div>
            </div>
        </>
    );
}

ConversationHistory.layout = {
    breadcrumbs: [{ title: 'Conversations', href: '/conversations' }],
};
