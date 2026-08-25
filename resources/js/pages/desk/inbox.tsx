import { Form, Link, router } from '@inertiajs/react';
import { Facebook, Instagram, MessageCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DeskShell } from '@/components/crm/desk-shell';
import { EmptyRoom } from '@/components/crm/empty-room';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Contact = {
    id: number;
    first_name: string;
    last_name?: string | null;
    email?: string | null;
    phone_e164?: string | null;
    company?: { id: number; name: string } | null;
    owner?: { id: number; name: string } | null;
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
        type?: string;
        body: string;
        status: string;
        failure_reason?: string | null;
        created_at: string;
        user?: { name: string } | null;
    }[];
};

type ChannelCard = {
    key: string;
    label: string;
    href: string;
    connected: boolean;
};

type Props = {
    embedUrl: string | null;
    embedState: 'ok' | 'blocked' | 'unreachable' | 'no-url';
    embedReason: string | null;
    configuredUrl: string | null;
    threads: Thread[];
    selected: Thread | null;
    channels?: ChannelCard[];
};

function nameOf(contact?: Contact | null) {
    if (!contact) {
        return 'Unknown';
    }

    return `${contact.first_name} ${contact.last_name ?? ''}`.trim();
}

const CHANNEL_ICONS: Record<string, typeof MessageCircle> = {
    whatsapp_cloud: MessageCircle,
    instagram: Instagram,
    facebook: Facebook,
};

export default function DeskInbox({
    embedUrl,
    embedState,
    threads,
    selected,
    channels = [],
}: Props) {
    const empty = threads.length === 0;

    return (
        <DeskShell title="Desk">
            <div className="flex h-full flex-col bg-canvas text-[13px] text-ink">
                {empty ? (
                    <ConnectChannels channels={channels} />
                ) : (
                    <FrontDesk threads={threads} selected={selected} />
                )}
            </div>
        </DeskShell>
    );
}

function ConnectChannels({ channels }: { channels: ChannelCard[] }) {
    const cards =
        channels.length > 0
            ? channels
            : [
                  { key: 'whatsapp_cloud', label: 'WhatsApp Cloud', href: '/settings/apps', connected: false },
                  { key: 'instagram', label: 'Instagram', href: '/settings/apps', connected: false },
                  { key: 'facebook', label: 'Facebook', href: '/settings/apps', connected: false },
              ];

    return (
        <EmptyRoom
            title="Connect your channels"
            line="Official WhatsApp Cloud, Instagram, and Facebook. No unofficial WhatsApp."
            actionLabel="Open Apps"
            actionHref="/settings/apps"
        >
            <div className="mt-6 grid gap-3 text-left">
                    {cards.map((channel) => {
                        const Icon = CHANNEL_ICONS[channel.key] ?? MessageCircle;

                        return (
                            <Link
                                key={channel.key}
                                href={channel.href}
                                className="flex items-center justify-between rounded-md border border-hairline px-4 py-3 text-left hover:border-brand"
                            >
                                <span className="inline-flex items-center gap-2 font-medium">
                                    <Icon className="size-4 text-brand" />
                                    {channel.label}
                                </span>
                                <span className="text-[12px] text-brand">
                                    {channel.connected ? 'Connected' : 'Connect'}
                                </span>
                            </Link>
                        );
                    })}
                </div>
        </EmptyRoom>
    );
}

function FrontDesk({
    threads,
    selected,
}: {
    threads: Thread[];
    selected: Thread | null;
}) {
    const [folder, setFolder] = useState('all');
    const [mode, setMode] = useState<'reply' | 'note'>('reply');

    const filtered = useMemo(() => {
        if (folder === 'unassigned') {
            return threads.filter((thread) => !thread.contact.owner);
        }

        if (folder === 'whatsapp') {
            return threads.filter((thread) => thread.channel?.type === 'whatsapp_cloud');
        }

        return threads;
    }, [folder, threads]);

    const folders = [
        { key: 'all', label: `All conversations (${threads.length})` },
        {
            key: 'unassigned',
            label: `Unassigned (${threads.filter((thread) => !thread.contact.owner).length})`,
        },
        { key: 'whatsapp', label: 'WhatsApp Cloud' },
    ];

    return (
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[220px_minmax(0,280px)_minmax(0,1fr)]">
            <aside className="min-h-0 overflow-y-auto border-r border-hairline p-3">
                <p className="mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Shared inbox
                </p>
                {folders.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        onClick={() => setFolder(item.key)}
                        className={`mb-1 block w-full rounded-md px-2 py-1.5 text-left ${
                            folder === item.key
                                ? 'bg-[rgba(236,96,37,0.12)] font-medium text-ink'
                                : 'text-muted-foreground'
                        }`}
                    >
                        {item.label}
                    </button>
                ))}
                <p className="mt-4 mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Channels
                </p>
                <p className="px-2 text-[12px]">WhatsApp Cloud</p>
                <Link href="/outbound/replies" className="mt-2 block px-2 text-[12px] text-brand">
                    Email
                </Link>
            </aside>

            <aside className="min-h-0 overflow-y-auto border-r border-hairline">
                {filtered.map((thread) => (
                    <button
                        key={thread.id}
                        type="button"
                        onClick={() =>
                            router.get('/inbox', { thread: thread.id }, { preserveState: true })
                        }
                        className={`block w-full border-b border-hairline px-3 py-3 text-left ${
                            selected?.id === thread.id
                                ? 'bg-[rgba(236,96,37,0.08)]'
                                : 'hover:bg-canvas-soft'
                        }`}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">{nameOf(thread.contact)}</span>
                            {(thread.unread_count ?? 0) > 0 ? (
                                <Badge variant="secondary">{thread.unread_count}</Badge>
                            ) : null}
                        </div>
                        <p className="truncate text-[12px] text-muted-foreground">
                            {thread.messages?.[0]?.body ?? thread.subject ?? '—'}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                            {thread.contact.owner?.name ?? 'Unassigned'}
                        </p>
                    </button>
                ))}
            </aside>

            <section className="flex min-h-0 flex-col">
                {selected ? (
                    <>
                        <header className="flex items-center justify-between border-b border-hairline px-4 py-3">
                            <div>
                                <h2 className="font-semibold">{nameOf(selected.contact)}</h2>
                                <p className="text-[12px] text-muted-foreground">
                                    {selected.contact.owner?.name ?? 'Unassigned'} · Official WhatsApp
                                </p>
                            </div>
                            <Link
                                href={`/crm/contacts/${selected.contact.id}`}
                                className="text-[12px] text-brand"
                            >
                                Open contact
                            </Link>
                        </header>
                        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
                            {(selected.messages ?? []).map((message) => (
                                <div
                                    key={message.id}
                                    className={`max-w-[80%] rounded-md px-3 py-2 ${
                                        message.type === 'note'
                                            ? 'bg-[#FFF4E8] text-ink'
                                            : message.direction === 'outbound'
                                              ? 'ml-auto bg-canvas-soft'
                                              : 'bg-[#EAF7EA]'
                                    }`}
                                >
                                    {message.type === 'note' ? (
                                        <p className="mb-1 text-[11px] font-medium text-brand">
                                            Private note — only visible to agents
                                        </p>
                                    ) : null}
                                    <p>{message.body}</p>
                                </div>
                            ))}
                        </div>
                        <Form
                            action={`/desk/threads/${selected.id}/reply`}
                            method="post"
                            className="border-t border-hairline p-3"
                            resetOnSuccess={['body']}
                        >
                            {({ processing }) => (
                                <>
                                    <div className="mb-2 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setMode('reply')}
                                            className={mode === 'reply' ? 'border-b-2 border-brand pb-1 font-medium' : 'text-muted-foreground'}
                                        >
                                            Reply
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMode('note')}
                                            className={mode === 'note' ? 'border-b-2 border-brand pb-1 font-medium' : 'text-muted-foreground'}
                                        >
                                            Note
                                        </button>
                                    </div>
                                    {mode === 'note' ? (
                                        <input type="hidden" name="as_note" value="1" />
                                    ) : null}
                                    <textarea
                                        name="body"
                                        required
                                        placeholder={
                                            mode === 'note'
                                                ? 'Private note…'
                                                : 'Type your message…'
                                        }
                                        className="min-h-20 w-full rounded-md border border-hairline p-2 text-[13px]"
                                    />
                                    <div className="mt-2 flex justify-end gap-2">
                                        {mode === 'reply' ? (
                                            <Button
                                                name="resolve"
                                                value="1"
                                                disabled={processing}
                                            >
                                                Send as resolved
                                            </Button>
                                        ) : (
                                            <Button disabled={processing}>Add note</Button>
                                        )}
                                    </div>
                                </>
                            )}
                        </Form>
                    </>
                ) : (
                    <div className="grid flex-1 place-items-center text-muted-foreground">
                        Select a conversation.
                    </div>
                )}
            </section>
        </div>
    );
}

DeskInbox.layout = {
    breadcrumbs: [{ title: 'Desk', href: '/inbox' }],
};
