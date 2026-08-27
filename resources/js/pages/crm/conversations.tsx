import { Form, Link, router } from '@inertiajs/react';
import { MessageCircle } from 'lucide-react';
import { DeskShell } from '@/components/crm/desk-shell';
import { Avatar } from '@/components/ui/aurora/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
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
};

function nameOf(contact?: Contact | null) {
    if (!contact) {
        return 'Unknown';
    }

    return `${contact.first_name} ${contact.last_name ?? ''}`.trim();
}

function initialsOf(contact?: Contact | null) {
    const name = nameOf(contact);

    return name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0] ?? '')
        .join('')
        .toUpperCase();
}

export default function ConversationHistory({ threads, selected }: Props) {
    return (
        <DeskShell title="Conversations">
            <div className="h-full overflow-y-auto bg-canvas-soft">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 sm:px-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-page-title">
                                Conversation history
                            </h2>
                            <p className="aurora-text-ui mt-1 max-w-[65ch] text-muted-foreground">
                                CRM context only. Threads synced from the sold
                                Desk. This is not a Chatwoot clone.
                            </p>
                        </div>
                        {threads.length > 0 ? (
                            <Link
                                href="/inbox"
                                className="aurora-text-ui font-medium text-brand"
                            >
                                Open inbox
                            </Link>
                        ) : null}
                    </div>

                    {threads.length === 0 ? (
                        <div className="mx-auto w-full max-w-lg py-8">
                            <EmptyState
                                as="h2"
                                icon={<MessageCircle className="size-6" />}
                                title="No conversation history"
                                description="Threads appear after official Desk traffic."
                                action={
                                    <Button asChild>
                                        <Link href="/inbox">Open inbox</Link>
                                    </Button>
                                }
                            />
                        </div>
                    ) : (
                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
                            <Card
                                elevated={false}
                                className="overflow-hidden p-0"
                            >
                                <ul className="divide-y divide-hairline">
                                    {threads.map((thread) => (
                                        <li key={thread.id}>
                                            <button
                                                type="button"
                                                className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                                                    selected?.id === thread.id
                                                        ? 'bg-brand/8'
                                                        : 'hover:bg-canvas-soft'
                                                }`}
                                                onClick={() =>
                                                    router.get(
                                                        '/conversations',
                                                        { thread: thread.id },
                                                        { preserveState: true },
                                                    )
                                                }
                                            >
                                                <Avatar
                                                    size="md"
                                                    shape="square"
                                                    initials={initialsOf(
                                                        thread.contact,
                                                    )}
                                                    alt={nameOf(thread.contact)}
                                                    className="shrink-0"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="truncate font-medium">
                                                            {nameOf(
                                                                thread.contact,
                                                            )}
                                                        </span>
                                                        {(thread.unread_count ??
                                                            0) > 0 ? (
                                                            <Badge variant="secondary">
                                                                {
                                                                    thread.unread_count
                                                                }
                                                            </Badge>
                                                        ) : null}
                                                    </div>
                                                    <p className="aurora-text-caption text-muted-foreground">
                                                        {thread.contact.company
                                                            ?.name ??
                                                            'No company'}
                                                    </p>
                                                    <p className="aurora-text-ui mt-1 truncate text-muted-foreground">
                                                        {thread.messages?.[0]
                                                            ?.body ??
                                                            thread.subject ??
                                                            'No preview'}
                                                    </p>
                                                </div>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </Card>

                            <Card className="p-0">
                                {selected ? (
                                    <>
                                        <CardHeader>
                                            <CardTitle as="h2">
                                                {nameOf(selected.contact)}
                                            </CardTitle>
                                            <CardDescription>
                                                {selected.contact.company
                                                    ?.name ?? 'No company'}{' '}
                                                ·{' '}
                                                {selected.contact.phone_e164 ??
                                                    'No phone'}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                {(selected.messages ?? []).map(
                                                    (message) => (
                                                        <div
                                                            key={message.id}
                                                            className="rounded-[16px] bg-canvas-soft px-3.5 py-2.5"
                                                        >
                                                            <p className="aurora-text-caption text-muted-foreground">
                                                                {
                                                                    message.direction
                                                                }{' '}
                                                                ·{' '}
                                                                {message.status}
                                                                {message.failure_reason
                                                                    ? ` · ${message.failure_reason}`
                                                                    : ''}
                                                            </p>
                                                            <p className="aurora-text-body mt-1">
                                                                {message.body}
                                                            </p>
                                                        </div>
                                                    ),
                                                )}
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
                                                            placeholder="Log a session reply"
                                                            required
                                                        />
                                                        <Button
                                                            disabled={
                                                                processing
                                                            }
                                                        >
                                                            Send
                                                        </Button>
                                                    </>
                                                )}
                                            </Form>
                                            <div className="aurora-text-ui space-y-1">
                                                <p className="font-medium">
                                                    Open deal
                                                </p>
                                                {(selected.contact.deals ?? [])
                                                    .length === 0 ? (
                                                    <p className="text-muted-foreground">
                                                        No open deal on this
                                                        contact.
                                                    </p>
                                                ) : (
                                                    selected.contact.deals?.map(
                                                        (deal) => (
                                                            <Link
                                                                key={deal.id}
                                                                href={`/crm/deals/${deal.id}`}
                                                                className="block text-brand"
                                                            >
                                                                {deal.title} ·{' '}
                                                                {
                                                                    deal.stage
                                                                        ?.name
                                                                }
                                                            </Link>
                                                        ),
                                                    )
                                                )}
                                                <Link
                                                    href={`/crm/contacts/${selected.contact.id}`}
                                                    className="inline-block font-medium text-brand"
                                                >
                                                    Open CRM record
                                                </Link>
                                            </div>
                                        </CardContent>
                                    </>
                                ) : (
                                    <div className="grid place-items-center px-6 py-10">
                                        <EmptyState
                                            as="h2"
                                            icon={
                                                <MessageCircle className="size-6" />
                                            }
                                            title="Select a conversation"
                                            description="See contact and deal context from the sold Desk."
                                        />
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </DeskShell>
    );
}

ConversationHistory.layout = {
    breadcrumbs: [{ title: 'Conversations', href: '/conversations' }],
};
