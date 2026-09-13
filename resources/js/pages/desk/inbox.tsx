import { Form, Link, router } from '@inertiajs/react';
import { MessageCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AdaptiveWorkspaceShell } from '@/components/crm/adaptive-workspace-shell';
import { DeskShell } from '@/components/crm/desk-shell';
import { DeskGlass } from '@/components/desk/desk-glass';
import { OfficialConnectPanel } from '@/components/desk/official-connect-panel';
import { Avatar } from '@/components/ui/aurora/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Textarea } from '@/components/ui/textarea';
import { useSimpleMode } from '@/hooks/use-simple-mode';
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
    ticket?: {
        id: number;
        number: string;
        status: string;
        subject: string;
    } | null;
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

function initialsOf(contact?: Contact | null) {
    const name = nameOf(contact);

    return name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0] ?? '')
        .join('')
        .toUpperCase();
}

function ConnectWhatsAppCta({
    connectors,
}: {
    connectors: OfficialDeskConnector[];
}) {
    const whatsapp = connectors.find(
        (connector) => connector.provider === 'whatsapp_cloud',
    );

    return (
        <Form action="/desk/connectors" method="post">
            {({ processing }) => (
                <>
                    <input
                        type="hidden"
                        name="provider"
                        value={whatsapp?.provider ?? 'whatsapp_cloud'}
                    />
                    <Button disabled={processing}>
                        Connect WhatsApp Cloud
                    </Button>
                </>
            )}
        </Form>
    );
}

function InboxEmpty({
    embedState,
    embedReason,
    configuredUrl,
    officialConnectors,
}: {
    embedState: Props['embedState'];
    embedReason: string | null;
    configuredUrl: string | null;
    officialConnectors: OfficialDeskConnector[];
}) {
    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-canvas-soft">
            {embedState !== 'no-url' ? (
                <p className="aurora-text-caption border-b border-hairline bg-canvas px-4 py-3 text-muted-foreground">
                    <span className="font-medium text-ink">
                        EvoDesk at {configuredUrl} is not framed here.
                    </span>{' '}
                    {embedReason}
                </p>
            ) : null}
            <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-10">
                <EmptyState
                    as="h2"
                    icon={<MessageCircle className="size-6" />}
                    title="No conversations"
                    description="Connect official WhatsApp Cloud to start. No Baileys."
                    action={
                        <ConnectWhatsAppCta connectors={officialConnectors} />
                    }
                />
            </div>
            <OfficialConnectPanel
                connectors={officialConnectors}
                hidePrimaryCta
            />
        </div>
    );
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
                <div className="flex h-full min-h-0 flex-col bg-canvas-soft text-ui text-ink">
                    <OfficialConnectPanel
                        connectors={officialConnectors}
                        compact
                    />
                    <iframe
                        title="EvoDesk - EvoSales inbox"
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
            <div className="flex h-full min-h-0 flex-col bg-canvas-soft text-ui text-ink">
                {empty ? (
                    <InboxEmpty
                        embedState={embedState}
                        embedReason={embedReason}
                        configuredUrl={configuredUrl}
                        officialConnectors={officialConnectors}
                    />
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
    const { features } = useSimpleMode();

    const filtered = useMemo(() => {
        if (folder === 'unassigned') {
            return threads.filter((thread) => !thread.contact.owner);
        }

        if (folder === 'whatsapp') {
            return threads.filter(
                (thread) =>
                    thread.channel?.type === 'whatsapp' ||
                    thread.channel?.type === 'whatsapp_cloud',
            );
        }

        return threads;
    }, [folder, threads]);

    const folders = [
        { key: 'all', label: 'All', count: threads.length },
        {
            key: 'unassigned',
            label: 'Unassigned',
            count: threads.filter((thread) => !thread.contact.owner).length,
        },
        { key: 'whatsapp', label: 'WhatsApp Cloud', count: null },    ];

    return (
        <AdaptiveWorkspaceShell
            leftLabel="Folders"
            centerLabel="Inbox"
            rightLabel="Conversation"
            defaultPanel="center"
            left={
                <div className="space-y-3">
                    <div>
                        <p className="aurora-text-label mb-2 text-muted-foreground">
                            Shared inbox
                        </p>
                        <div className="grid gap-1">
                            {folders.map((item) => (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => setFolder(item.key)}
                                    className={`flex w-full items-center justify-between rounded-[var(--radius-1)] px-3 py-1.5 text-left transition-colors duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                                        folder === item.key
                                            ? 'bg-canvas-soft font-medium text-ink'
                                            : 'text-muted-foreground hover:bg-canvas-soft hover:text-ink'
                                    }`}
                                >
                                    <span>{item.label}</span>
                                    {item.count !== null ? (
                                        <span className="aurora-text-caption tabular-nums">
                                            {item.count}
                                        </span>
                                    ) : null}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="aurora-text-label mb-2 text-muted-foreground">
                            Channels
                        </p>
                        <p className="aurora-text-ui px-3 text-ink">
                            WhatsApp Cloud
                        </p>
                    </div>
                </div>            }
            center={
                <>
                    {filtered.map((thread) => (
                        <button
                            key={thread.id}
                            type="button"
                            onClick={() =>
                                router.get(
                                    '/inbox',
                                    { thread: thread.id },
                                    { preserveState: true },
                                )
                            }
                            className={`flex w-full items-start gap-3 border-b border-hairline px-4 py-2.5 text-left transition-colors duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                                selected?.id === thread.id
                                    ? 'bg-canvas-soft'
                                    : 'hover:bg-canvas-soft'
                            }`}
                        >
                            <Avatar
                                size="md"
                                shape="square"
                                initials={initialsOf(thread.contact)}
                                alt={nameOf(thread.contact)}
                                className="shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="truncate font-medium">
                                        {nameOf(thread.contact)}
                                    </span>
                                    {(thread.unread_count ?? 0) > 0 ? (
                                        <Badge variant="default">
                                            {thread.unread_count}
                                        </Badge>
                                    ) : null}
                                </div>
                                <p className="aurora-text-ui mt-0.5 truncate text-muted-foreground">
                                    {thread.messages?.[0]?.body ??
                                        thread.subject ??
                                        'No preview'}
                                </p>
                                <p className="aurora-text-caption mt-1 text-muted-foreground">
                                    {thread.contact.owner?.name ?? 'Unassigned'}
                                </p>
                            </div>
                        </button>
                    ))}
                </>
            }
            right={
                selected ? (
                    <div className="flex min-h-0 flex-1 flex-col bg-canvas">
                        <DeskGlass
                            as="header"
                            className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3"
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                <Avatar
                                    size="md"
                                    shape="square"
                                    initials={initialsOf(selected.contact)}
                                    alt={nameOf(selected.contact)}
                                />
                                <div className="min-w-0">
                                    <h2 className="truncate font-semibold">
                                        {nameOf(selected.contact)}
                                    </h2>
                                    <p className="aurora-text-caption text-muted-foreground">
                                        {selected.contact.owner?.name ??
                                            'Unassigned'}{' '}
                                        · Official WhatsApp
                                    </p>
                                </div>
                            </div>
                            <div className="flex shrink-0 flex-wrap items-center gap-2">
                                <Link
                                    href={`/crm/contacts/${selected.contact.id}`}
                                    className="aurora-text-ui font-medium text-ink hover:underline"
                                >
                                    Open contact
                                </Link>
                                {features.tickets && selected.ticket ? (
                                    <Link
                                        href={`/crm/tickets/${selected.ticket.id}`}
                                        data-testid="desk-ticket-link"
                                        className="aurora-text-ui font-medium text-ink hover:underline"
                                    >
                                        {selected.ticket.number}
                                    </Link>
                                ) : null}
                                {features.tickets ? (
                                    <Form
                                        action={`/desk/threads/${selected.id}/ticket`}
                                        method="post"
                                    >
                                        {({ processing }) => (
                                            <Button
                                                type="submit"
                                                size="sm"
                                                className="h-8"
                                                disabled={processing}
                                                data-testid="desk-open-ticket"
                                            >
                                                Open ticket
                                            </Button>
                                        )}
                                    </Form>
                                ) : null}
                            </div>
                        </DeskGlass>
                        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-canvas-soft p-4">
                            {(selected.messages ?? []).map((message) => (
                                <div
                                    key={message.id}
                                    className={`max-w-[80%] rounded-[18px] px-3.5 py-2.5 ${
                                        message.type === 'note'
                                            ? 'bg-muted text-ink'
                                            : message.direction === 'outbound'
                                              ? 'ml-auto border border-hairline bg-canvas text-ink'
                                              : 'bg-canvas text-ink shadow-[var(--aurora-shadow-medium)]'
                                    }`}
                                >
                                    {message.type === 'note' ? (
                                        <p className="aurora-text-caption mb-1 font-medium text-mute">
                                            Private note, only visible to agents
                                        </p>
                                    ) : null}
                                    <p className="aurora-text-body">
                                        {message.body}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <Form
                            action={`/desk/threads/${selected.id}/reply`}
                            method="post"
                            resetOnSuccess={['body']}
                        >
                            {({ processing }) => (
                                <DeskGlass as="footer" className="border-t p-3">
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
                                        <input
                                            type="hidden"
                                            name="as_note"
                                            value="1"
                                        />
                                    ) : null}
                                    <Textarea
                                        name="body"
                                        required
                                        placeholder={
                                            mode === 'note'
                                                ? 'Private note'
                                                : 'Type your message'
                                        }
                                        className="min-h-20"
                                    />
                                    <div className="mt-2 flex justify-end">
                                        {mode === 'reply' ? (
                                            <Button
                                                name="resolve"
                                                value="1"
                                                disabled={processing}
                                            >
                                                Send as resolved
                                            </Button>
                                        ) : (
                                            <Button disabled={processing}>
                                                Add note
                                            </Button>
                                        )}
                                    </div>
                                </DeskGlass>
                            )}
                        </Form>
                    </div>
                ) : (
                    <div className="flex flex-1 items-start bg-canvas px-5 py-6">
                        <p className="text-[13px] text-mute">
                            Select a conversation
                        </p>
                    </div>
                )
            }
            leftClassName="p-4"
            centerClassName="p-0"
            rightClassName="p-0"
            scrollPanels={{ left: true, center: true, right: false }}
        />
    );
}

DeskInbox.layout = {
    breadcrumbs: [{ title: 'Desk', href: '/inbox' }],
};
