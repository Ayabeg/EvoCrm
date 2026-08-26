import { Form, Head, Link } from '@inertiajs/react';
import { CalendarDays, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { GoogleWorkspaceConnector, OfficialDeskConnector } from '@/types';

function statusLabel(status: GoogleWorkspaceConnector['status']): string {
    if (status === 'connected') {
        return 'Connected';
    }

    if (status === 'needs_token') {
        return 'Needs official token';
    }

    if (status === 'needs_reconnect') {
        return 'Reconnect Google';
    }

    return 'Not connected';
}

function GoogleConnectorCard({
    connector,
    googleEnabled,
}: {
    connector: GoogleWorkspaceConnector;
    googleEnabled: boolean;
}) {
    const Icon = connector.provider === 'gmail' ? Mail : CalendarDays;
    const showReconnectEmpty = googleEnabled && !connector.scopes_on_client;

    return (
        <Card className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className="grid size-9 place-content-center rounded-lg border border-hairline bg-canvas">
                        <Icon className="size-4 text-brand" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold">{connector.name}</h2>
                        <p className="text-xs text-muted-foreground">{connector.tagline}</p>
                    </div>
                </div>
                <Badge variant={connector.status === 'connected' ? 'default' : 'secondary'}>
                    {statusLabel(connector.status)}
                </Badge>
            </div>

            {showReconnectEmpty ? (
                <div className="space-y-2 rounded-lg border border-dashed border-hairline p-3 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">
                        Reconnect Google with Calendar/Gmail
                    </p>
                    <p>
                        This workspace already uses the existing Google OAuth client for
                        sign-in. Gmail and Calendar scopes are not on that client yet —
                        add them in Google Cloud Console, set{' '}
                        <code className="font-mono">GOOGLE_GMAIL_SCOPE</code> /{' '}
                        <code className="font-mono">GOOGLE_CALENDAR_SCOPE</code>, then
                        reconnect. Login is unchanged.
                    </p>
                </div>
            ) : null}

            {!googleEnabled ? (
                <p className="text-xs text-muted-foreground">
                    Google sign-in is not configured. Set{' '}
                    <code className="font-mono">GOOGLE_CLIENT_ID</code> and{' '}
                    <code className="font-mono">GOOGLE_CLIENT_SECRET</code> — the same
                    client used on the login screen. No second Google login is added.
                </p>
            ) : null}

            {connector.sync ? (
                <div className="rounded-lg border border-hairline bg-canvas-soft p-3 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">
                        Sync {connector.sync.status}
                    </p>
                    <p>
                        {connector.sync.last_synced_at
                            ? `Last sync ${connector.sync.last_synced_at}`
                            : 'No sync run yet.'}
                    </p>
                    {connector.sync.last_error ? (
                        <p className="text-destructive">{connector.sync.last_error}</p>
                    ) : null}
                    <p>
                        {connector.sync.has_token
                            ? 'Workspace token stored.'
                            : 'No workspace token yet — reconnect Google.'}
                    </p>
                </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
                <Form action="/settings/connectors" method="post">
                    {({ processing }) => (
                        <>
                            <input type="hidden" name="provider" value={connector.provider} />
                            <Button size="sm" variant="outline" disabled={processing}>
                                Save {connector.name} intent
                            </Button>
                        </>
                    )}
                </Form>
                {connector.reconnect_url ? (
                    <Button size="sm" asChild>
                        <a href={connector.reconnect_url}>
                            Reconnect Google for {connector.name}
                        </a>
                    </Button>
                ) : null}
                {connector.status === 'connected' ? (
                    <>
                        <Form action={`/settings/connectors/${connector.provider}/sync`} method="post">
                            {({ processing }) => (
                                <Button size="sm" variant="outline" disabled={processing}>
                                    Start sync
                                </Button>
                            )}
                        </Form>
                        <Form action={`/settings/connectors/${connector.provider}/pause`} method="post">
                            {({ processing }) => (
                                <Button size="sm" variant="outline" disabled={processing}>
                                    Pause sync
                                </Button>
                            )}
                        </Form>
                    </>
                ) : null}
            </div>
        </Card>
    );
}

export default function ConnectorsSettings({
    googleEnabled,
    googleCallback,
    googleOrigin,
    deskConnectors,
    googleConnectors,
}: {
    googleEnabled: boolean;
    googleCallback: string;
    googleOrigin: string;
    deskConnectors: OfficialDeskConnector[];
    googleConnectors: GoogleWorkspaceConnector[];
}) {
    return (
        <>
            <Head title="Connectors" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-semibold">Connectors</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Official Gmail and Calendar on the existing Google OAuth
                        client. Desk channels stay official Meta Cloud only.
                    </p>
                </div>

                <div className="space-y-3">
                    <h2 className="text-sm font-medium">Google</h2>
                    <p className="text-xs text-muted-foreground">
                        Authorized JavaScript origin{' '}
                        <code className="font-mono break-all text-brand">{googleOrigin}</code>
                        . Authorized redirect URI stays{' '}
                        <code className="font-mono break-all text-brand">{googleCallback}</code>
                        — Google Error 400 redirect_uri_mismatch means that URI
                        is missing on the OAuth client. EvoSales does not send
                        mail from these connectors.
                    </p>
                    {googleConnectors.map((connector) => (
                        <GoogleConnectorCard
                            key={connector.provider}
                            connector={connector}
                            googleEnabled={googleEnabled}
                        />
                    ))}
                </div>

                <div className="space-y-3">
                    <h2 className="text-sm font-medium">Official Desk channels</h2>
                    <p className="text-xs text-muted-foreground">
                        Connect from{' '}
                        <Link href="/inbox" className="font-medium text-brand">
                            My Inbox
                        </Link>
                        . WhatsApp Cloud is Evolution Cloud API only.
                    </p>
                    {deskConnectors.map((connector) => (
                        <Card
                            key={connector.provider}
                            className="flex items-center justify-between gap-3 p-4 text-sm"
                        >
                            <div>
                                <p className="font-medium">{connector.name}</p>
                                <p className="text-xs text-muted-foreground">{connector.tagline}</p>
                            </div>
                            <Badge
                                variant={
                                    connector.status === 'connected' ? 'default' : 'secondary'
                                }
                            >
                                {statusLabel(connector.status)}
                            </Badge>
                        </Card>
                    ))}
                </div>
            </div>
        </>
    );
}

ConnectorsSettings.layout = {
    breadcrumbs: [
        { title: 'Apps', href: '/settings/apps' },
        { title: 'Connectors', href: '/settings/connectors' },
    ],
};
