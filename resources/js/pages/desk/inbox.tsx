import { Form, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { AdaptiveWorkspaceShell } from '@/components/crm/adaptive-workspace-shell';
import { DeskShell } from '@/components/crm/desk-shell';
import { OfficialConnectPanel } from '@/components/desk/official-connect-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { OfficialDeskConnector } from '@/types';

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

type Props = {
    embedUrl: string | null;
    embedState: 'ok' | 'blocked' | 'unreachable' | 'no-url';
    embedReason: string | null;
    configuredUrl: string | null;
    threads: Thread[];
    selected: Thread | null;
    officialConnectors: OfficialDeskConnector[];
};

function nameOf(contact?: Contact | null) {
    if (!contact) {
        return 'Unknown';
    }

    return `${contact.first_name} ${contact.last_name ?? ''}`.trim();
}

export default function DeskInbox({
    embedUrl,
    embedState,
    embedReason,
    configuredUrl,
    threads,
    selected,
    officialConnectors = [],
}: Props) {
    if (embedUrl) {
        return (
            <DeskShell title="Desk">
                <div className="flex h-full min-h-0 flex-col bg-canvas text-ui text-ink">
                    <OfficialConnectPanel connectors={officialConnectors} compact />
                    <iframe
                        title="EvoDesk — EvoSales inbox"
                        src={embedUrl}
                        className="min-h-0 w-full flex-1 border-0 bg-canvas"
                        allow="clipboard-write; microphone; camera"
                    />
                </div>
            </DeskShell>
        );
    }

    const empty = threads.length === 0;

    return (
        <DeskShell title="Desk">
            <div className="flex h-full min-h-0 flex-col bg-canvas text-ui text-ink">
                {empty ? (
                    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                        {embedState !== 'no-url' ? (
                            <p className="border-b border-hairline px-4 py-3 text-xs text-muted-foreground">
                                <span className="font-medium text-ink">
                                    EvoDesk at {configuredUrl} is not framed here.
                                </span>{' '}
                                {embedReason}
                            </p>
                        ) : null}
                        <OfficialConnectPanel connectors={officialConnectors} />
                    </div>
                ) : (
                    <FrontDesk threads={threads} selected={selected} />
                )}
            </div>
        </DeskShell>
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
        <AdaptiveWorkspaceShell
            leftLabel="Folders"
            centerLabel="Inbox"
            rightLabel="Conversation"
            defaultPanel="center"
            left={
                <>
                    <p className="text-section-label mb-2 text-muted-foreground">
                        Shared inbox
                    </p>
                    {folders.map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => setFolder(item.key)}
                            className={`mb-1 block w-full rounded-md px-2 py-1.5 text-left ${
                                folder === item.key
                                    ? 'bg-brand/12 font-medium text-ink'
                                    : 'text-muted-foreground'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                    <p className="text-section-label mt-4 mb-2 text-muted-foreground">
                        Channels
                    </p>
                    <p className="px-2 text-ui text-muted-foreground">WhatsApp Cloud</p>
                    <Link href="/outbound/replies" className="mt-2 block px-2 text-ui text-brand">
                        Email
                    </Link>
                </>
            }
            center={
                <>
                    {filtered.map((thread) => (
                        <button
                            key={thread.id}
                            type="button"
                            onClick={() =>
                                router.get('/inbox', { thread: thread.id }, { preserveState: true })
                            }
                            className={`block w-full border-b border-hairline px-3 py-3 text-left ${
                                selected?.id === thread.id
                                    ? 'bg-brand/8'
                                    : 'hover:bg-canvas-soft'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-medium">{nameOf(thread.contact)}</span>
                                {(thread.unread_count ?? 0) > 0 ? (
                                    <Badge variant="secondary">{thread.unread_count}</Badge>
                                ) : null}
                            </div>
                            <p className="truncate text-ui text-muted-foreground">
                                {thread.messages?.[0]?.body ?? thread.subject ?? '—'}
                            </p>
                            <p className="mt-1 text-section-label text-muted-foreground normal-case tracking-normal">
                                {thread.contact.owner?.name ?? 'Unassigned'}
                            </p>
                        </button>
                    ))}
                </>
            }
            right={
                selected ? (
                    <div className="flex min-h-0 flex-1 flex-col">
                        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline px-4 py-3">
                            <div className="min-w-0">
                                <h2 className="font-semibold">{nameOf(selected.contact)}</h2>
                                <p className="text-ui text-muted-foreground">
                                    {selected.contact.owner?.name ?? 'Unassigned'} · Official WhatsApp
                                </p>
                            </div>
                            <Link
                                href={`/crm/contacts/${selected.contact.id}`}
                                className="shrink-0 text-ui text-brand"
                            >
                                Open contact
                            </Link>
                        </header>
                        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
                            {(selected.messages ?? []).map((message) => (
                                <div
                                    key={message.id}
                                    className={`max-w-[80%] rounded-md border border-hairline px-3 py-2 ${
                                        message.type === 'note'
                                            ? 'bg-muted text-ink'
                                            : message.direction === 'outbound'
                                              ? 'ml-auto border-transparent bg-canvas-soft'
                                              : 'border-transparent bg-muted'
                                    }`}
                                >
                                    {message.type === 'note' ? (
                                        <p className="text-section-label mb-1 font-medium text-brand normal-case tracking-normal">
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
                                            className={
                                                mode === 'reply'
                                                    ? 'border-b-2 border-brand pb-1 font-medium'
                                                    : 'text-muted-foreground'
                                            }
                                        >
                                            Reply
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMode('note')}
                                            className={
                                                mode === 'note'
                                                    ? 'border-b-2 border-brand pb-1 font-medium'
                                                    : 'text-muted-foreground'
                                            }
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
                                        className="min-h-20 w-full rounded-md border border-hairline p-2 text-ui"
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
                    </div>
                ) : (
                    <div className="grid flex-1 place-items-center p-6 text-center text-muted-foreground">
                        Select a conversation.
                    </div>
                )
            }
            leftClassName="p-3"
            centerClassName="p-0"
            rightClassName="p-0"
            scrollPanels={{ left: true, center: true, right: false }}
        />
    );
}

DeskInbox.layout = {
    breadcrumbs: [{ title: 'Desk', href: '/inbox' }],
};
