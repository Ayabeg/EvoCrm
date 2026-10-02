import { Head, Link } from '@inertiajs/react';
import {
    CalendarBlank,
    EnvelopeSimple,
    ChatCircle,
} from '@phosphor-icons/react';
import { connectorStatusLabel } from '@/components/desk/connector-status';
import { ChannelMark } from '@/components/desk/official-connect-panel';
import { Badge } from '@/evo/ui/badge';
import { Button } from '@/evo/ui/button';
import {
    SettingsCard,
    SettingsEmptyState,
    SettingsPageHeader,
    SettingsForm,
} from '@/evo/patterns/settings';
import { t } from '@/lib/i18n';
import type { GoogleWorkspaceConnector, OfficialDeskConnector } from '@/types';

function GoogleConnectorCard({
    connector,
    googleEnabled,
    canConfigure,
}: {
    connector: GoogleWorkspaceConnector;
    googleEnabled: boolean;
    canConfigure: boolean;
}) {
    const Icon =
        connector.provider === 'gmail' ? EnvelopeSimple : CalendarBlank;
    const showReconnectEmpty = googleEnabled && !connector.scopes_on_client;

    return (
        <SettingsCard title={connector.name} description={connector.tagline}>
            <div className="flex items-start justify-between gap-3">
                <span className="grid size-9 place-content-center rounded-[4px] border border-hairline bg-canvas">
                    <Icon className="size-4 text-brand" />
                </span>
                <Badge
                    variant={
                        connector.status === 'connected'
                            ? 'default'
                            : 'secondary'
                    }
                >
                    {t(connectorStatusLabel(connector.status))}
                </Badge>
            </div>
            <div className="space-y-3">
                {showReconnectEmpty ? (
                    <SettingsEmptyState
                        icon={<Icon className="size-6" />}
                        title="Reconnect Google"
                        description="Add Calendar and Gmail scopes on the existing OAuth client."
                        action={
                            canConfigure && connector.reconnect_url ? (
                                <Button asChild size="sm">
                                    <a href={connector.reconnect_url}>
                                        {t('Reconnect Google')}
                                    </a>
                                </Button>
                            ) : canConfigure ? (
                                <SettingsForm
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
                                                disabled={
                                                    processing || !canConfigure
                                                }
                                            >
                                                {t('Save :name intent', { name: connector.name })}
                                            </Button>
                                        </>
                                    )}
                                </SettingsForm>
                            ) : undefined
                        }
                    />
                ) : null}

                {connector.sync ? (
                    <div className="rounded-[4px] border border-hairline bg-canvas-soft p-3 text-[12px] text-mute">
                        <p className="font-medium text-ink">
                            {t('Sync :status', { status: connector.sync.status })}
                        </p>
                        {connector.account_label ? (
                            <p className="min-w-0 truncate text-ink">
                                {connector.account_label}
                            </p>
                        ) : null}
                        <p>
                            {connector.sync.last_synced_at
                                ? t('Last sync :when', { when: connector.sync.last_synced_at })
                                : t('No sync run yet.')}
                        </p>
                        {connector.sync.last_error ? (
                            <p className="text-destructive">
                                {connector.sync.last_error}
                            </p>
                        ) : null}
                        <p>
                            {connector.sync.has_token
                                ? t('Workspace token stored.')
                                : t('No workspace token yet. Reconnect Google.')}
                        </p>
                    </div>
                ) : null}

                {!showReconnectEmpty && canConfigure ? (
                    <div className="flex flex-wrap items-center gap-2">
                        <SettingsForm action="/settings/connectors" method="post">
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
                                        {t('Save :name intent', { name: connector.name })}
                                    </Button>
                                </>
                            )}
                        </SettingsForm>
                        {connector.reconnect_url ? (
                            <Button size="sm" asChild>
                                <a href={connector.reconnect_url}>
                                    {t('Reconnect Google for :name', { name: connector.name })}
                                </a>
                            </Button>
                        ) : null}
                        {connector.status === 'connected' ? (
                            <>
                                <SettingsForm
                                    action={`/settings/connectors/${connector.provider}/sync`}
                                    method="post"
                                >
                                    {({ processing }) => (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={processing}
                                        >
                                            {t('Start sync')}
                                        </Button>
                                    )}
                                </SettingsForm>
                                <SettingsForm
                                    action={`/settings/connectors/${connector.provider}/pause`}
                                    method="post"
                                >
                                    {({ processing }) => (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={processing}
                                        >
                                            {t('Pause sync')}
                                        </Button>
                                    )}
                                </SettingsForm>
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
    can_configure = true,
}: {
    googleEnabled: boolean;
    googleCallback: string;
    googleOrigin: string;
    deskConnectors: OfficialDeskConnector[];
    googleConnectors: GoogleWorkspaceConnector[];
    can_configure?: boolean;
}) {
    const gmail = googleConnectors.find(
        (connector) => connector.provider === 'gmail',
    );

    return (
        <>
            <Head title={t('Connectors')} />
            <div className="space-y-4">
                <SettingsPageHeader
                    title="Connectors"
                    description="Configured instances for this workspace. Apps are the products. Connectors are the accounts and sync jobs. Desk channels stay official Meta Cloud only."
                />

                <section className="space-y-3">
                    <h2 className="text-[13px] font-semibold tracking-wide text-ink uppercase">
                        {t('Google')}
                    </h2>
                    <p className="text-[12px] text-mute">
                        {t('Authorized JavaScript origin')}{' '}
                        <code className="font-mono break-all text-brand">
                            {googleOrigin}
                        </code>
                        . {t('Redirect URI stays')}{' '}
                        <code className="font-mono break-all text-brand">
                            {googleCallback}
                        </code>
                        . {t('EvoSales does not send mail from these connectors.')}
                    </p>
                    {!googleEnabled ? (
                        <SettingsEmptyState
                            icon={<EnvelopeSimple className="size-6" />}
                            title="Google is not configured"
                            description="Set the existing Google OAuth client. Login stays the same."
                            action={
                                <SettingsForm
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
                                                {t('Save Gmail intent')}
                                            </Button>
                                        </>
                                    )}
                                </SettingsForm>
                            }
                        />
                    ) : (
                        googleConnectors.map((connector) => (
                            <GoogleConnectorCard
                                key={connector.provider}
                                connector={connector}
                                googleEnabled={googleEnabled}
                                canConfigure={can_configure}
                            />
                        ))
                    )}
                </section>

                <section className="space-y-3">
                    <h2 className="text-[13px] font-semibold tracking-wide text-ink uppercase">
                        {t('Official Desk channels')}
                    </h2>
                    <p className="text-[12px] text-mute">
                        {t('Connect from')}{' '}
                        <Link href="/inbox" className="font-medium text-brand">
                            {t('My Inbox')}
                        </Link>
                        . {t('WhatsApp Cloud is Evolution Cloud API only. No Baileys.')}
                    </p>
                    <div className="grid gap-3">
                        {deskConnectors.map((connector) => (
                            <SettingsCard key={connector.provider}>
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <span className="grid size-9 place-content-center rounded-[4px] border border-hairline bg-canvas">
                                            {connector.provider ===
                                            'whatsapp_cloud' ? (
                                                <ChatCircle className="size-4 text-brand" />
                                            ) : (
                                                <ChannelMark
                                                    provider={
                                                        connector.provider
                                                    }
                                                />
                                            )}
                                        </span>
                                        <div>
                                            <p className="min-w-0 truncate text-[14px] font-medium text-ink">
                                                {connector.name}
                                            </p>
                                            <p className="min-w-0 text-[12px] text-mute">
                                                {t(connector.tagline)}
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
                                        {t(connectorStatusLabel(connector.status))}
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
