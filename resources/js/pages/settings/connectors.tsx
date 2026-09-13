import { Form, Head, Link } from '@inertiajs/react';
import {
    CalendarBlank,
    EnvelopeSimple,
    ChatCircle,
} from '@phosphor-icons/react';
import { connectorStatusLabel } from '@/components/desk/connector-status';
import { ChannelMark } from '@/components/desk/official-connect-panel';
import {
    SettingsCard,
    SettingsEmptyState,
    SettingsPageHeader,
} from '@/components/settings/chrome';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { GoogleWorkspaceConnector, OfficialDeskConnector } from '@/types';

function GoogleConnectorCard({
    connector,
    googleEnabled,
}: {
    connector: GoogleWorkspaceConnector;
    googleEnabled: boolean;
}) {
    const Icon =
        connector.provider === 'gmail' ? EnvelopeSimple : CalendarBlank;
    const showReconnectEmpty = googleEnabled && !connector.scopes_on_client;

    return (
        <SettingsCard title={connector.name} description={connector.tagline}>
            <div className="flex items-start justify-between gap-3">
                <span className="grid size-9 place-content-center rounded-[4px] border border-hairline bg-[#eaeaea]">
                    <Icon className="size-4 text-[#d9500f]" />
                </span>
                <Badge
                    variant={
                        connector.status === 'connected'
                            ? 'default'
                            : 'secondary'
                    }
                >
                    {connectorStatusLabel(connector.status)}
                </Badge>
            </div>
            <div className="space-y-3">
                {showReconnectEmpty ? (
                    <SettingsEmptyState
                        icon={<Icon className="size-6" />}
                        title="Reconnect Google"
                        description="Add Calendar and Gmail scopes on the existing OAuth client."
                        action={
                            connector.reconnect_url ? (
                                <Button asChild size="sm">
                                    <a href={connector.reconnect_url}>
                                        Reconnect Google
                                    </a>
                                </Button>
                            ) : (
                                <Form
                                    action="/settings/connectors"
                                    method="post"
                                >
                                    {({ processing }) => (
                                        <>
                                            <input
                                                type="hidden"
                                                name="provider"
                                                value={connector.provider}
                                            />
                                            <Button
                                                size="sm"
                                                disabled={processing}
                                            >
                                                Save {connector.name} intent
                                            </Button>
                                        </>
                                    )}
                                </Form>
                            )
                        }
                    />
                ) : null}

                {connector.sync ? (
                    <div className="aurora-text-caption rounded-[var(--radius-1)] border border-hairline bg-canvas-soft p-3 text-muted-foreground">
                        <p className="font-medium text-foreground">
                            Sync {connector.sync.status}
                        </p>
                        <p>
                            {connector.sync.last_synced_at
                                ? `Last sync ${connector.sync.last_synced_at}`
                                : 'No sync run yet.'}
                        </p>
                        {connector.sync.last_error ? (
                            <p className="text-destructive">
                                {connector.sync.last_error}
                            </p>
                        ) : null}
                        <p>
                            {connector.sync.has_token
                                ? 'Workspace token stored.'
                                : 'No workspace token yet. Reconnect Google.'}
                        </p>
                    </div>
                ) : null}

                {!showReconnectEmpty ? (
                    <div className="flex flex-wrap items-center gap-2">
                        <Form action="/settings/connectors" method="post">
                            {({ processing }) => (
                                <>
                                    <input
                                        type="hidden"
                                        name="provider"
                                        value={connector.provider}
                                    />
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={processing}
                                    >
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
                                <Form
                                    action={`/settings/connectors/${connector.provider}/sync`}
                                    method="post"
                                >
                                    {({ processing }) => (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={processing}
                                        >
                                            Start sync
                                        </Button>
                                    )}
                                </Form>
                                <Form
                                    action={`/settings/connectors/${connector.provider}/pause`}
                                    method="post"
                                >
                                    {({ processing }) => (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={processing}
                                        >
                                            Pause sync
                                        </Button>
                                    )}
                                </Form>
                            </>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </SettingsCard>
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
    const gmail = googleConnectors.find(
        (connector) => connector.provider === 'gmail',
    );

    return (
        <>
            <Head title="Connectors" />
            <div className="space-y-4">
                <SettingsPageHeader
                    title="Connectors"
                    description="Official Gmail and Calendar on the existing Google OAuth client. Desk channels stay official Meta Cloud only."
                />

                <section className="space-y-3">
                    <h2 className="aurora-text-section">Google</h2>
                    <p className="aurora-text-caption text-muted-foreground">
                        Authorized JavaScript origin{' '}
                        <code className="font-mono break-all text-brand">
                            {googleOrigin}
                        </code>
                        . Redirect URI stays{' '}
                        <code className="font-mono break-all text-brand">
                            {googleCallback}
                        </code>
                        . EvoSales does not send mail from these connectors.
                    </p>
                    {!googleEnabled ? (
                        <SettingsEmptyState
                            icon={<EnvelopeSimple className="size-6" />}
                            title="Google is not configured"
                            description="Set the existing Google OAuth client. Login stays the same."
                            action={
                                <Form
                                    action="/settings/connectors"
                                    method="post"
                                >
                                    {({ processing }) => (
                                        <>
                                            <input
                                                type="hidden"
                                                name="provider"
                                                value={
                                                    gmail?.provider ?? 'gmail'
                                                }
                                            />
                                            <Button disabled={processing}>
                                                Save Gmail intent
                                            </Button>
                                        </>
                                    )}
                                </Form>
                            }
                        />
                    ) : (
                        googleConnectors.map((connector) => (
                            <GoogleConnectorCard
                                key={connector.provider}
                                connector={connector}
                                googleEnabled={googleEnabled}
                            />
                        ))
                    )}
                </section>

                <section className="space-y-3">
                    <h2 className="aurora-text-section">
                        Official Desk channels
                    </h2>
                    <p className="aurora-text-caption text-muted-foreground">
                        Connect from{' '}
                        <Link href="/inbox" className="font-medium text-brand">
                            My Inbox
                        </Link>
                        . WhatsApp Cloud is Evolution Cloud API only.{' '}
                        No Baileys.
                    </p>
                    <div className="grid gap-3">
                        {deskConnectors.map((connector) => (
                            <SettingsCard key={connector.provider}>
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <span className="grid size-9 place-content-center rounded-[4px] border border-hairline bg-[#eaeaea]">
                                            {connector.provider ===
                                            'whatsapp_cloud' ? (
                                                <ChatCircle className="size-4 text-[#d9500f]" />
                                            ) : (
                                                <ChannelMark
                                                    provider={
                                                        connector.provider
                                                    }
                                                />
                                            )}
                                        </span>
                                        <div>
                                            <p className="aurora-text-ui font-medium">
                                                {connector.name}
                                            </p>
                                            <p className="aurora-text-caption text-muted-foreground">
                                                {connector.tagline}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge
                                        variant={
                                            connector.status === 'connected'
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {connectorStatusLabel(connector.status)}
                                    </Badge>
                                </div>
                            </SettingsCard>
                        ))}
                    </div>
                </section>
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
