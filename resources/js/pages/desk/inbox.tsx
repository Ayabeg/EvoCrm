import { Form, Head, Link, router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    last_message_at?: string | null;
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
};

function nameOf(contact?: Contact | null) {
    if (!contact) {
        return 'Unknown';
    }

    return `${contact.first_name} ${contact.last_name ?? ''}`.trim();
}

export default function DeskInbox({ threads, selected }: Props) {
    return (
        <>
            <Head title="Desk" />
            <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border bg-background">
                <aside className="w-72 shrink-0 border-r">
                    <div className="border-b px-4 py-3">
                        <h1 className="font-semibold">Desk</h1>
                        <p className="text-xs text-muted-foreground">
                            Conversation inbox — Cloud WhatsApp + CRM identity
                        </p>
                    </div>
                    <div className="max-h-[calc(100vh-10rem)] overflow-y-auto">
                        {threads.length === 0 ? (
                            <p className="p-4 text-sm text-muted-foreground">
                                No threads yet. Click-to-WA and Evolution
                                webhooks land here.
                            </p>
                        ) : (
                            threads.map((thread) => (
                                <button
                                    key={thread.id}
                                    type="button"
                                    onClick={() =>
                                        router.get(
                                            '/desk',
                                            { thread: thread.id },
                                            { preserveState: true },
                                        )
                                    }
                                    className={`block w-full border-b px-4 py-3 text-left hover:bg-muted/60 ${
                                        selected?.id === thread.id
                                            ? 'bg-teal-50 dark:bg-teal-950/40'
                                            : ''
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="truncate font-medium">
                                            {nameOf(thread.contact)}
                                        </span>
                                        <Badge variant="secondary">
                                            {thread.status}
                                        </Badge>
                                    </div>
                                    <p className="mt-1 truncate text-xs text-muted-foreground">
                                        {thread.channel?.name ?? 'Channel'} ·{' '}
                                        {thread.contact.phone_e164 ?? 'No phone'}
                                    </p>
                                </button>
                            ))
                        )}
                    </div>
                </aside>

                <section className="flex min-w-0 flex-1 flex-col">
                    {selected ? (
                        <>
                            <header className="border-b px-5 py-3">
                                <h2 className="font-medium">
                                    {nameOf(selected.contact)}
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Session replies use Evolution Cloud sendText.
                                    Templates live in Outbound.
                                </p>
                            </header>
                            <div className="flex-1 space-y-3 overflow-y-auto p-5">
                                {(selected.messages ?? []).map((message) => (
                                    <div
                                        key={message.id}
                                        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                                            message.direction === 'outbound'
                                                ? 'ml-auto bg-teal-600 text-white'
                                                : 'bg-muted'
                                        }`}
                                    >
                                        <p>{message.body}</p>
                                        <p className="mt-1 text-[11px] opacity-70">
                                            {message.status}
                                            {message.failure_reason
                                                ? ` · ${message.failure_reason}`
                                                : ''}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <Form
                                action={`/desk/threads/${selected.id}/reply`}
                                method="post"
                                className="flex gap-2 border-t p-4"
                                resetOnSuccess={['body']}
                            >
                                {({ processing }) => (
                                    <>
                                        <Input
                                            name="body"
                                            placeholder="Reply in the 24h Cloud session window…"
                                            required
                                        />
                                        <Button disabled={processing}>
                                            Send
                                        </Button>
                                    </>
                                )}
                            </Form>
                        </>
                    ) : (
                        <div className="grid flex-1 place-items-center text-sm text-muted-foreground">
                            Select a conversation
                        </div>
                    )}
                </section>

                <aside className="w-72 shrink-0 border-l p-4">
                    {selected ? (
                        <div className="space-y-3 text-sm">
                            <h3 className="font-semibold">Contact</h3>
                            <p>{nameOf(selected.contact)}</p>
                            <p className="text-muted-foreground">
                                {selected.contact.phone_e164 ?? 'No phone'}
                            </p>
                            <p className="text-muted-foreground">
                                {selected.contact.email ?? 'No email'}
                            </p>
                            {selected.contact.company ? (
                                <p>Company: {selected.contact.company.name}</p>
                            ) : null}
                            <div>
                                <p className="mb-1 font-medium">Deals</p>
                                {(selected.contact.deals ?? []).length === 0 ? (
                                    <p className="text-muted-foreground">
                                        No deals yet
                                    </p>
                                ) : (
                                    selected.contact.deals?.map((deal) => (
                                        <Link
                                            key={deal.id}
                                            href={`/crm/deals/${deal.id}`}
                                            className="block text-teal-700 dark:text-teal-300"
                                        >
                                            {deal.title} · {deal.stage?.name}
                                        </Link>
                                    ))
                                )}
                            </div>
                            <Link
                                href={`/crm/contacts/${selected.contact.id}`}
                                className="inline-block text-teal-700 dark:text-teal-300"
                            >
                                Open CRM record
                            </Link>
                        </div>
                    ) : null}
                </aside>
            </div>
        </>
    );
}

DeskInbox.layout = {
    breadcrumbs: [{ title: 'Desk', href: '/desk' }],
};
