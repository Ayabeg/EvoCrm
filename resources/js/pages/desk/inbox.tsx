import { Form, Link, router, usePage } from '@inertiajs/react';
import { Tray } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { AdaptiveWorkspaceShell } from '@/components/crm/adaptive-workspace-shell';
import { DeskShell } from '@/components/crm/desk-shell';
import {
    InboxCaughtUpMark,
    InboxContactSidebar,
    InboxEmbedSkeleton,
    InboxFolderRail,
    InboxPersonMark,
    InboxStatusBanner,
    formatInboxWhen,
    inboxContactName,
    inboxInitials,
} from '@/components/crm/inbox-chrome';
import type {
    InboxContact,
    InboxEmbedState,
    InboxFolder,
} from '@/components/crm/inbox-chrome';
import { DeskGlass } from '@/components/desk/desk-glass';
import { OfficialConnectPanel } from '@/components/desk/official-connect-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Textarea } from '@/components/ui/textarea';
import { useSimpleMode } from '@/hooks/use-simple-mode';
import type { Auth, OfficialDeskConnector } from '@/types';

type Thread = {
    id: number;
    status: string;
    unread_count?: number;
    last_message_at?: string | null;
    subject?: string | null;
    contact: InboxContact;
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

type ChannelChip = {
    key: string;
    label: string;
    href: string;
    connected: boolean;
};

type Props = {
    embedUrl: string | null;
    embedState: InboxEmbedState;
    embedReason: string | null;
    configuredUrl: string | null;
    threads: Thread[];
    selected: Thread | null;
    channels?: ChannelChip[];
    officialConnectors: OfficialDeskConnector[];
};

function isClosed(status: string): boolean {
    return status === 'resolved' || status === 'closed';
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
    embedState: InboxEmbedState;
    embedReason: string | null;
    configuredUrl: string | null;
    officialConnectors: OfficialDeskConnector[];
}) {
    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-canvas-soft">
            <InboxStatusBanner
                embedState={embedState}
                embedReason={embedReason}
                configuredUrl={configuredUrl}
            />
            <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-10">
                <InboxCaughtUpMark />
                <EmptyState
                    as="h2"
                    icon={<Tray className="size-6" weight="regular" />}
                    title="No conversations"
                    description="You're all caught up. Connect official WhatsApp Cloud to start. No Baileys."
                    action={
                        <ConnectWhatsAppCta connectors={officialConnectors} />
                    }
                    className="border-0"
                />
            </div>
            <OfficialConnectPanel
                connectors={officialConnectors}
                hidePrimaryCta
            />
        </div>
    );
}

function DeskEmbedWorkspace({
    embedUrl,
    officialConnectors,
    configuredUrl,
    onUseNative,
}: {
    embedUrl: string;
    officialConnectors: OfficialDeskConnector[];
    configuredUrl: string | null;
    onUseNative: () => void;
}) {
    const [frameState, setFrameState] = useState<'loading' | 'ready' | 'failed'>(
        'loading',
    );
    const host = (() => {
        try {
            return new URL(configuredUrl ?? embedUrl).host;
        } catch {
            return 'Desk';
        }
    })();

    return (
        <div
            className="flex h-full min-h-0 flex-col bg-canvas-soft text-[13px] text-ink"
            data-crm="inbox-workspace"
            data-inbox="embed"
        >
            <header className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline bg-white px-4 py-2">
                <div className="min-w-0">
                    <p className="text-[13px] font-medium text-ink">Inbox</p>
                    <p className="text-[11px] text-mute">
                        Desk framed on this host · {host}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        href="/conversations"
                        className="text-[12px] text-mute underline-offset-2 hover:text-ink hover:underline"
                    >
                        Conversation history
                    </Link>
                    {officialConnectors.some(
                        (connector) => connector.status !== 'connected',
                    ) ? (
                        <Link
                            href="/settings/channels"
                            className="text-[12px] text-mute underline-offset-2 hover:text-ink hover:underline"
                        >
                            Channels
                        </Link>
                    ) : null}
                </div>
            </header>
            <div className="relative min-h-0 flex-1 bg-white">
                {frameState === 'loading' ? <InboxEmbedSkeleton /> : null}
                {frameState === 'failed' ? (
                    <div
                        role="alert"
                        className="absolute inset-0 z-10 grid place-items-center bg-white px-6"
                    >
                        <div className="max-w-sm text-center">
                            <p className="text-[13px] font-medium text-ink">
                                Desk could not be framed
                            </p>
                            <p className="mt-1 text-[12px] leading-5 text-mute">
                                The embed stayed on this host. Continue in the
                                CRM inbox, or ask ops to allow this origin on
                                the desk frame-ancestors list.
                            </p>
                            <Button
                                type="button"
                                size="sm"
                                className="mt-3"
                                onClick={onUseNative}
                            >
                                Continue in CRM inbox
                            </Button>
                        </div>
                    </div>
                ) : null}
                <iframe
                    title="EvoDesk inbox"
                    src={embedUrl}
                    className="min-h-0 h-full w-full flex-1 border-0 bg-white"
                    allow="clipboard-write; microphone; camera"
                    onLoad={() => setFrameState('ready')}
                    onError={() => setFrameState('failed')}
                />
            </div>
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
    channels = [],
    officialConnectors = [],
}: Props) {
    const [useNative, setUseNative] = useState(false);

    if (embedUrl && !useNative) {
        return (
            <DeskShell title="Inbox">
                <DeskEmbedWorkspace
                    embedUrl={embedUrl}
                    officialConnectors={officialConnectors}
                    configuredUrl={configuredUrl}
                    onUseNative={() => setUseNative(true)}
                />
            </DeskShell>
        );
    }

    const empty = threads.length === 0;

    return (
        <DeskShell title="Inbox">
            <div
                className="flex h-full min-h-0 flex-col bg-canvas-soft text-[13px] text-ink"
                data-crm="inbox-workspace"
                data-inbox="native"
            >
                {empty ? (
                    <InboxEmpty
                        embedState={embedState}
                        embedReason={embedReason}
                        configuredUrl={configuredUrl}
                        officialConnectors={officialConnectors}
                    />
                ) : (
                    <>
                        <InboxStatusBanner
                            embedState={embedState}
                            embedReason={embedReason}
                            configuredUrl={configuredUrl}
                        />
                        <FrontDesk
                            threads={threads}
                            selected={selected}
                            channels={channels}
                        />
                    </>
                )}
            </div>
        </DeskShell>
    );
}

function FrontDesk({
    threads,
    selected,
    channels,
}: {
    threads: Thread[];
    selected: Thread | null;
    channels: ChannelChip[];
}) {
    const [folder, setFolder] = useState('all');
    const [mode, setMode] = useState<'reply' | 'note'>('reply');
    const { features } = useSimpleMode();
    const { auth } = usePage<{ auth: Auth }>().props;
    const userId = auth.user.id;

    const folders = useMemo<InboxFolder[]>(() => {
        const channelFolders = channels.map((channel) => ({
            key: channel.key,
            label: channel.label,
            count: threads.filter((thread) => thread.channel?.type === channel.key)
                .length,
        }));

        return [
            { key: 'all', label: 'All', count: threads.length },
            {
                key: 'unassigned',
                label: 'Unassigned',
                count: threads.filter((thread) => !thread.contact.owner).length,
            },
            {
                key: 'mine',
                label: 'Assigned to me',
                count: threads.filter(
                    (thread) => thread.contact.owner?.id === userId,
                ).length,
            },
            {
                key: 'open',
                label: 'All open',
                count: threads.filter((thread) => !isClosed(thread.status)).length,
            },
            ...channelFolders,
            {
                key: 'closed',
                label: 'All closed',
                count: threads.filter((thread) => isClosed(thread.status)).length,
            },
        ];
    }, [channels, threads, userId]);

    const filtered = useMemo(() => {
        if (folder === 'unassigned') {
            return threads.filter((thread) => !thread.contact.owner);
        }

        if (folder === 'mine') {
            return threads.filter(
                (thread) => thread.contact.owner?.id === userId,
            );
        }

        if (folder === 'open') {
            return threads.filter((thread) => !isClosed(thread.status));
        }

        if (folder === 'closed') {
            return threads.filter((thread) => isClosed(thread.status));
        }

        if (folder === 'whatsapp') {
            return threads.filter(
                (thread) =>
                    thread.channel?.type === 'whatsapp' ||
                    thread.channel?.type === 'whatsapp_cloud',
            );
        }

        if (channels.some((channel) => channel.key === folder)) {
            return threads.filter(
                (thread) => thread.channel?.type === folder,
            );
        }

        return threads;
    }, [channels, folder, threads, userId]);

    return (
        <AdaptiveWorkspaceShell
            leftLabel="Folders"
            centerLabel="Inbox"
            rightLabel="Conversation"
            defaultPanel="center"
            left={
                <InboxFolderRail
                    folders={folders}
                    folder={folder}
                    onSelect={setFolder}
                />
            }
            center={
                <div className="flex min-h-0 flex-1 flex-col">
                    <div className="flex items-center justify-between border-b border-hairline px-3 py-1.5">
                        <p className="text-[12px] font-medium text-ink">
                            Inbox
                        </p>
                        <p className="font-mono text-[11px] tabular-nums text-mute">
                            {filtered.length}
                        </p>
                    </div>
                    {filtered.length === 0 ? (
                        <div className="grid flex-1 place-items-center px-4 py-10">
                            <div className="max-w-xs text-center">
                                <p className="text-[13px] font-medium text-ink">
                                    No open conversations here
                                </p>
                                <p className="mt-1 text-[12px] text-mute">
                                    You&apos;re all caught up.
                                </p>
                            </div>
                        </div>
                    ) : (
                        filtered.map((thread) => (
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
                                className={`flex w-full items-start gap-2.5 border-b border-hairline px-3 py-2 text-left transition-colors duration-150 ${
                                    selected?.id === thread.id
                                        ? 'bg-canvas-soft'
                                        : 'hover:bg-canvas-soft'
                                }`}
                            >
                                <InboxPersonMark
                                    name={inboxContactName(thread.contact)}
                                    initials={inboxInitials(thread.contact)}
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-baseline justify-between gap-2">
                                        <span className="truncate text-[13px] font-medium text-ink">
                                            {inboxContactName(thread.contact)}
                                        </span>
                                        <span className="shrink-0 font-mono text-[10px] tabular-nums text-mute">
                                            {formatInboxWhen(
                                                thread.last_message_at,
                                            )}
                                        </span>
                                    </div>
                                    <p className="mt-0.5 truncate text-[12px] text-mute">
                                        {thread.messages?.[0]?.body ??
                                            thread.subject ??
                                            'No preview'}
                                    </p>
                                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-mute">
                                        <span className="truncate">
                                            {thread.channel?.name ??
                                                'WhatsApp Cloud'}
                                        </span>
                                        {(thread.unread_count ?? 0) > 0 ? (
                                            <Badge
                                                variant="default"
                                                className="h-4 min-w-4 rounded-none px-1 font-mono text-[10px]"
                                            >
                                                {thread.unread_count}
                                            </Badge>
                                        ) : null}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            }
            right={
                selected ? (
                    <div className="flex min-h-0 flex-1 bg-white">
                        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                            <DeskGlass
                                as="header"
                                className="flex flex-wrap items-center justify-between gap-2 border-b bg-white px-3 py-2"
                            >
                                <div className="flex min-w-0 items-center gap-2.5">
                                    <InboxPersonMark
                                        name={inboxContactName(selected.contact)}
                                        initials={inboxInitials(selected.contact)}
                                        size="md"
                                    />
                                    <div className="min-w-0">
                                        <h2 className="truncate text-[13px] font-semibold text-ink">
                                            {inboxContactName(selected.contact)}
                                        </h2>
                                        <p className="truncate text-[11px] text-mute">
                                            {selected.contact.owner?.name ??
                                                'Unassigned'}{' '}
                                            · Official WhatsApp
                                        </p>
                                    </div>
                                </div>
                                <div className="flex shrink-0 flex-wrap items-center gap-2">
                                    {features.tickets && selected.ticket ? (
                                        <Link
                                            href={`/crm/tickets/${selected.ticket.id}`}
                                            data-testid="desk-ticket-link"
                                            className="text-[12px] font-medium text-ink underline-offset-2 hover:underline"
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
                                                    className="h-7"
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
                            <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto bg-canvas-soft p-3">
                                {(selected.messages ?? []).map((message) => (
                                    <div
                                        key={message.id}
                                        className={`max-w-[78%] px-3 py-2 text-[13px] leading-5 ${
                                            message.type === 'note'
                                                ? 'bg-white text-ink'
                                                : message.direction ===
                                                    'outbound'
                                                  ? 'ml-auto border border-hairline bg-white text-ink'
                                                  : 'bg-white text-ink'
                                        }`}
                                    >
                                        {message.type === 'note' ? (
                                            <p className="mb-1 text-[10px] font-medium tracking-[0.04em] text-mute uppercase">
                                                Private note, only visible to
                                                agents
                                            </p>
                                        ) : null}
                                        <p>{message.body}</p>
                                    </div>
                                ))}
                            </div>
                            <Form
                                action={`/desk/threads/${selected.id}/reply`}
                                method="post"
                                resetOnSuccess={['body']}
                            >
                                {({ processing }) => (
                                    <DeskGlass
                                        as="footer"
                                        className="border-t bg-white p-3"
                                    >
                                        <div className="mb-2 flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setMode('reply')}
                                                className={
                                                    mode === 'reply'
                                                        ? 'border-b-2 border-brand pb-0.5 text-[12px] font-medium text-ink'
                                                        : 'text-[12px] text-mute'
                                                }
                                            >
                                                Reply
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setMode('note')}
                                                className={
                                                    mode === 'note'
                                                        ? 'border-b-2 border-brand pb-0.5 text-[12px] font-medium text-ink'
                                                        : 'text-[12px] text-mute'
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
                                            className="min-h-16 rounded-none"
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
                        <InboxContactSidebar contact={selected.contact} />
                    </div>
                ) : (
                    <div className="grid flex-1 place-items-center bg-white px-5 py-8">
                        <div className="max-w-xs text-center">
                            <p className="text-[13px] font-medium text-ink">
                                Select a conversation
                            </p>
                            <p className="mt-1 text-[12px] text-mute">
                                You&apos;re all caught up.
                            </p>
                        </div>
                    </div>
                )
            }
            leftClassName="bg-white p-0"
            centerClassName="bg-white p-0"
            rightClassName="bg-white p-0"
            scrollPanels={{ left: true, center: true, right: false }}
            tabletGridClassName="grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]"
            desktopGridClassName="lg:grid-cols-[minmax(11rem,13rem)_minmax(18rem,22rem)_minmax(0,1fr)]"
        />
    );
}

DeskInbox.layout = {
    breadcrumbs: [{ title: 'Inbox', href: '/inbox' }],
};
