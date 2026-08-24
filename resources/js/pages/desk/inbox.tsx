import { Form, Head, Link, router } from '@inertiajs/react';
import { MessageCircle } from 'lucide-react';
import { OfficialConnectPanel } from '@/components/desk/official-connect-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { OfficialDeskConnector } from '@/types';

type Contact = {
    id: number;
    first_name: string;
    last_name?: string | null;
    email?: string | null;
    phone_e164?: string | null;
    company?: { id: number; name: string } | null;
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
    /** EvoDesk (Chatwoot) embed source — same-window iframe, never a new tab. */
    embedUrl: string | null;
    /** ok = frame it; blocked/unreachable/no-url = native CRM desk instead. */
    embedState: 'ok' | 'blocked' | 'unreachable' | 'no-url';
    embedReason: string | null;
    /** The configured desk URL even when framing is refused (for the banner). */
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

/**
 * My Inbox — the sold EvoDesk (Chatwoot Community) lives inside the CRM
 * chrome here. When the desk URL is not configured (or the desk deployment
 * refuses framing), the native CRM conversation desk below keeps the
 * operator on this hostname instead of ejecting to desk.evotechly.com.
 */
export default function DeskInbox({
    embedUrl,
    embedState,
    embedReason,
    configuredUrl,
    threads,
    selected,
    officialConnectors = [],
}: Props) {
    return (
        <>
            <Head title="My Inbox" />
            <div className="flex h-[calc(100dvh-52px)] flex-col">
                <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-hairline bg-canvas px-4 py-2">
                    <h1 className="text-sm font-semibold">My Inbox</h1>
                    <Badge variant={embedUrl ? 'default' : 'secondary'}>
                        {embedUrl ? 'EvoDesk · embedded' : 'Native CRM desk'}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                        The desk never leaves EvoSales.
                    </p>
                    <div className="ms-auto flex items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                            <Link href="/conversations">Conversation history</Link>
                        </Button>
                    </div>
                </div>

                {embedUrl ? (
                    <>
                        <OfficialConnectPanel connectors={officialConnectors} compact />
                        <iframe
                            title="EvoDesk — EvoSales inbox"
                            src={embedUrl}
                            className="min-h-0 w-full flex-1 border-0 bg-canvas"
                            allow="clipboard-write; microphone; camera"
                        />
                    </>
                ) : (
                    <NativeDesk
                        threads={threads}
                        selected={selected}
                        embedState={embedState}
                        embedReason={embedReason}
                        configuredUrl={configuredUrl}
                        officialConnectors={officialConnectors}
                    />
                )}
            </div>
        </>
    );
}

DeskInbox.layout = {
    breadcrumbs: [{ title: 'My Inbox', href: '/inbox' }],
};

function NativeDesk({
    threads,
    selected,
    embedState,
    embedReason,
    configuredUrl,
    officialConnectors,
}: {
    threads: Thread[];
    selected: Thread | null;
    embedState: Props['embedState'];
    embedReason: string | null;
    configuredUrl: string | null;
    officialConnectors: OfficialDeskConnector[];
}) {
    return (
        <div className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <div className="min-h-0 overflow-y-auto border-r border-hairline">
                <Card className="m-3 border-hairline bg-canvas-soft p-3 text-xs text-muted-foreground">
                    {embedState === 'no-url' ? (
                        <p>
                            <span className="font-medium text-foreground">Native CRM desk.</span> Set{' '}
                            <code>EVOSALES_INBOX_URL</code> (and optionally <code>EVOSALES_INBOX_EMBED_PATH</code>)
                            to embed the live EvoDesk UI here instead.
                        </p>
                    ) : (
                        <p>
                            <span className="font-medium text-foreground">
                                EvoDesk at {configuredUrl} is not framed here.
                            </span>{' '}
                            {embedReason} You keep working — this is the full CRM desk, not a link out.
                        </p>
                    )}
                </Card>
                <OfficialConnectPanel
                    connectors={officialConnectors}
                    compact={threads.length > 0}
                />
                <table className="w-full text-sm">
                    <tbody>
                        {threads.length === 0 ? (
                            <tr>
                                <td className="px-4 py-6 text-muted-foreground">
                                    No conversations yet. Connect an official channel above to start.
                                </td>
                            </tr>
                        ) : (
                            threads.map((thread) => (
                                <tr
                                    key={thread.id}
                                    className={`cursor-pointer border-t border-hairline hover:bg-muted/40 ${
                                        selected?.id === thread.id ? 'bg-muted/60' : ''
                                    }`}
                                    onClick={() =>
                                        router.get('/inbox', { thread: thread.id }, { preserveState: true })
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
                                            {thread.messages?.[0]?.body ?? thread.subject ?? '—'}
                                        </p>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="min-h-0 space-y-4 overflow-y-auto p-4">
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
                                <div key={message.id} className="rounded-md border border-hairline px-3 py-2">
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
                        <Link href={`/crm/contacts/${selected.contact.id}`} className="inline-block text-sm text-brand">
                            Open CRM record
                        </Link>
                    </>
                ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                        <MessageCircle className="size-6" />
                        <p>Select a conversation.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
