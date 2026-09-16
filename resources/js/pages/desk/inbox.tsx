import { Form, Link, router } from '@inertiajs/react';
import { Tray } from '@phosphor-icons/react';
import { useMemo, useRef, useState } from 'react';
import { AdaptiveWorkspaceShell } from '@/components/crm/adaptive-workspace-shell';
import { DeskShell } from '@/components/crm/desk-shell';
import {
    InboxCaughtUpMark,
    InboxComposer,
    InboxContactSidebar,
    InboxConversationRow,
    InboxEmbedSkeleton,
    InboxFolderRail,
    InboxListHeader,
    InboxMessageThread,
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
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useSimpleMode } from '@/hooks/use-simple-mode';
import { t } from '@/lib/i18n';
import {
    buildInboxFolders,
    inboxChannelLabel,
    inboxSearchParams,
    isStaleInboxVisit,
    normalizeInboxFolder,
} from '@/lib/inbox-workspace';
import type { OfficialDeskConnector } from '@/types';

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
    folder?: string;
    q?: string;
    contextOpen?: boolean;
    folderCounts?: Record<string, number>;
};

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
                    title={t('No conversations')}
                    description={t("You're all caught up. Connect official WhatsApp Cloud to start. No Baileys.")}
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
                                {t('Continue in CRM inbox')}
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
    folder = 'all',
    q = '',
    contextOpen = true,
    folderCounts = {},
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

    const workspaceEmpty =
        !q &&
        normalizeInboxFolder(folder) === 'all' &&
        (folderCounts.all ?? threads.length) === 0;

    return (
        <DeskShell title="Inbox">
            <div
                className="flex h-full min-h-0 flex-col overflow-x-hidden bg-canvas-soft text-[13px] text-ink"
                data-crm="inbox-workspace"
                data-inbox="native"
            >
                {workspaceEmpty ? (
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
                            folder={folder}
                            q={q}
                            contextOpen={contextOpen}
                            folderCounts={folderCounts}
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
    folder: folderProp,
    q: qProp,
    contextOpen,
    folderCounts,
}: {
    threads: Thread[];
    selected: Thread | null;
    channels: ChannelChip[];
    folder: string;
    q: string;
    contextOpen: boolean;
    folderCounts: Record<string, number>;
}) {
    const folder = normalizeInboxFolder(folderProp);
    const [mode, setMode] = useState<'reply' | 'note'>('reply');
    const [draftQuery, setDraftQuery] = useState(qProp);
    const [prevQuery, setPrevQuery] = useState(qProp);
    const [contextOverlay, setContextOverlay] = useState(false);
    const visitGeneration = useRef(0);
    const { features } = useSimpleMode();

    if (qProp !== prevQuery) {
        setPrevQuery(qProp);
        setDraftQuery(qProp);
    }

    const assignedToMe = 'Assigned to me';
    const allOpen = 'All open';

    const folders = useMemo<InboxFolder[]>(() => {
        return buildInboxFolders(folderCounts, channels).map((item) => {
            if (item.key === 'mine') {
                return { ...item, label: assignedToMe };
            }

            if (item.key === 'open') {
                return { ...item, label: allOpen };
            }

            return item;
        });
    }, [channels, folderCounts]);

    const visitInbox = (
        next: {
            thread?: number | null;
            folder?: string;
            q?: string;
            context?: '0' | '1';
        },
        generation?: number,
    ) => {
        const requestId = generation ?? visitGeneration.current;

        router.get(
            '/inbox',
            inboxSearchParams({
                thread: next.thread === undefined ? selected?.id : next.thread,
                folder: next.folder ?? folder,
                q: next.q === undefined ? qProp : next.q,
                context: next.context ?? (contextOpen ? '1' : '0'),
            }),
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => {
                    if (isStaleInboxVisit(visitGeneration.current, requestId)) {
                        return;
                    }
                },
            },
        );
    };

    const selectThread = (threadId: number) => {
        const requestId = ++visitGeneration.current;
        setMode('reply');
        setContextOverlay(false);
        visitInbox({ thread: threadId }, requestId);
    };

    const searchTimer = useRef<number | undefined>(undefined);

    const onQueryChange = (value: string) => {
        setDraftQuery(value);
        window.clearTimeout(searchTimer.current);
        searchTimer.current = window.setTimeout(() => {
            visitInbox({ q: value });
        }, 250);
    };

    const showContextHost = contextOpen && Boolean(selected);
    const channelName = inboxChannelLabel(selected?.channel);

    return (
        <div
            className="flex min-h-0 flex-1 overflow-x-hidden"
            data-inbox="panes"
        >
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <AdaptiveWorkspaceShell
                    leftLabel="Folders"
                    centerLabel="Inbox"
                    rightLabel="Conversation"
                    defaultPanel="center"
                    left={
                        <InboxFolderRail
                            folders={folders}
                            folder={folder}
                            onSelect={(key) => visitInbox({ folder: key })}
                        />
                    }
                    center={
                        <div
                            className="flex min-h-0 flex-1 flex-col"
                            data-inbox-pane="list"
                            data-inbox="conversation-list"
                        >
                            <InboxListHeader
                                query={draftQuery}
                                count={threads.length}
                                onQueryChange={onQueryChange}
                            />
                            {threads.length === 0 ? (
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
                                <div className="min-h-0 flex-1 overflow-y-auto">
                                    {threads.map((thread) => (
                                        <InboxConversationRow
                                            key={thread.id}
                                            name={inboxContactName(
                                                thread.contact,
                                            )}
                                            initials={inboxInitials(
                                                thread.contact,
                                            )}
                                            when={formatInboxWhen(
                                                thread.last_message_at,
                                            )}
                                            preview={
                                                thread.messages?.[0]?.body ??
                                                thread.subject ??
                                                'No preview'
                                            }
                                            channel={inboxChannelLabel(
                                                thread.channel,
                                            )}
                                            unread={thread.unread_count ?? 0}
                                            selected={
                                                selected?.id === thread.id
                                            }
                                            onSelect={() =>
                                                selectThread(thread.id)
                                            }
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    }
                    right={
                        selected ? (
                            <div
                                className="relative flex min-h-0 flex-1 bg-white"
                                data-inbox-pane="conversation"
                            >
                                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                                    <DeskGlass
                                        as="header"
                                        className="flex flex-wrap items-center justify-between gap-2 border-b bg-white px-3 py-2"
                                    >
                                        <div className="flex min-w-0 items-center gap-2.5">
                                            <InboxPersonMark
                                                name={inboxContactName(
                                                    selected.contact,
                                                )}
                                                initials={inboxInitials(
                                                    selected.contact,
                                                )}
                                                size="md"
                                            />
                                            <div className="min-w-0">
                                                <h2 className="truncate text-[13px] font-semibold text-ink">
                                                    {inboxContactName(
                                                        selected.contact,
                                                    )}
                                                </h2>
                                                <p className="truncate text-[11px] text-mute">
                                                    {selected.contact.owner
                                                        ?.name ??
                                                        t('Unassigned')}{' '}
                                                    · {channelName}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (showContextHost) {
                                                        visitInbox({
                                                            context: '0',
                                                        });
                                                        setContextOverlay(
                                                            false,
                                                        );
                                                    } else {
                                                        visitInbox({
                                                            context: '1',
                                                        });
                                                        setContextOverlay(
                                                            true,
                                                        );
                                                    }
                                                }}
                                                className="text-[12px] text-mute hover:text-ink"
                                            >
                                                {showContextHost
                                                    ? t('Hide context')
                                                    : t('Context')}
                                            </button>
                                            {features.tickets &&
                                            selected.ticket ? (
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
                                                            disabled={
                                                                processing
                                                            }
                                                            data-testid="desk-open-ticket"
                                                        >
                                                            {t('Open ticket')}
                                                        </Button>
                                                    )}
                                                </Form>
                                            ) : null}
                                        </div>
                                    </DeskGlass>
                                    <InboxMessageThread
                                        threadId={selected.id}
                                        messages={selected.messages ?? []}
                                    />
                                    <InboxComposer
                                        threadId={selected.id}
                                        mode={mode}
                                        onModeChange={setMode}
                                    />
                                </div>
                                {contextOverlay ? (
                                    <div className="absolute inset-y-0 right-0 z-20 w-[18.5rem] border-l border-hairline bg-white xl:hidden">
                                        <InboxContactSidebar
                                            contact={selected.contact}
                                            onCollapse={() =>
                                                setContextOverlay(false)
                                            }
                                        />
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            <div className="grid flex-1 place-items-center bg-white px-5 py-8">
                                <div className="max-w-xs text-center">
                                    <p className="text-[13px] font-medium text-ink">
                                        {t('Select a conversation')}
                                    </p>
                                    <p className="mt-1 text-[12px] text-mute">
                                        {t("You're all caught up.")}
                                    </p>
                                </div>
                            </div>
                        )
                    }
                    leftClassName="bg-white p-0"
                    centerClassName="bg-white p-0"
                    rightClassName="bg-white p-0"
                    scrollPanels={{ left: true, center: false, right: false }}
                    tabletGridClassName="grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]"
                    desktopGridClassName="lg:grid-cols-[minmax(11.25rem,13.75rem)_minmax(17.5rem,21.25rem)_minmax(0,1fr)]"
                />
            </div>
            {showContextHost && selected ? (
                <InboxContactSidebar
                    contact={selected.contact}
                    className="hidden xl:flex"
                    onCollapse={() => visitInbox({ context: '0' })}
                />
            ) : null}
        </div>
    );
}

DeskInbox.layout = {
    breadcrumbs: [{ title: 'Inbox', href: '/inbox' }],
};
