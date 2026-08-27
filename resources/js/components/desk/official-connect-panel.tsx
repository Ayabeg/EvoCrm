import { Form, Link } from '@inertiajs/react';
import { Facebook, Instagram, MessageCircle } from 'lucide-react';
import { connectorStatusLabel } from '@/components/desk/connector-status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { OfficialDeskConnector } from '@/types';

export function ChannelMark({
    provider,
}: {
    provider: OfficialDeskConnector['provider'];
}) {
    if (provider === 'instagram') {
        return <Instagram className="size-4 text-brand" />;
    }

    if (provider === 'facebook_messenger') {
        return <Facebook className="size-4 text-brand" />;
    }

    return <MessageCircle className="size-4 text-brand" />;
}

function ConnectAction({
    connector,
    primary,
}: {
    connector: OfficialDeskConnector;
    primary: boolean;
}) {
    if (connector.status === 'connected') {
        return null;
    }

    return (
        <Form action="/desk/connectors" method="post" className="mt-3">
            {({ processing }) => (
                <>
                    <input
                        type="hidden"
                        name="provider"
                        value={connector.provider}
                    />
                    <Button
                        size="sm"
                        variant={primary ? 'default' : 'ghost'}
                        disabled={processing}
                    >
                        Connect {connector.name}
                    </Button>
                </>
            )}
        </Form>
    );
}

export function OfficialConnectPanel({
    connectors,
    compact = false,
    hidePrimaryCta = false,
}: {
    connectors: OfficialDeskConnector[];
    compact?: boolean;
    hidePrimaryCta?: boolean;
}) {
    return (
        <Card
            elevated={false}
            className={compact ? 'm-3 p-3' : 'm-4 p-4 sm:m-6 sm:p-5'}
        >
            <div className="space-y-1">
                <h2 className="aurora-text-section font-semibold">
                    Connect official channels
                </h2>
                <p className="aurora-text-body-sm text-muted-foreground">
                    {compact
                        ? 'WhatsApp Cloud, Instagram, and Messenger. Official Meta paths only.'
                        : 'EvoDesk talks on official Meta Cloud paths only: WhatsApp Cloud through Evolution, Instagram, and Messenger. No QR. No Baileys. No linked devices.'}
                </p>
            </div>
            <div
                className={
                    compact
                        ? 'mt-3 grid gap-2'
                        : 'mt-4 grid gap-3 md:grid-cols-3'
                }
            >
                {connectors.map((connector) => {
                    const primary =
                        connector.provider === 'whatsapp_cloud' &&
                        !hidePrimaryCta;

                    return (
                        <div
                            key={connector.provider}
                            className="rounded-[var(--aurora-radius-1)] border border-hairline bg-canvas p-3"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="grid size-8 place-content-center rounded-[10px] border border-hairline bg-canvas-soft">
                                        <ChannelMark
                                            provider={connector.provider}
                                        />
                                    </span>
                                    <p className="aurora-text-ui font-medium">
                                        {connector.name}
                                    </p>
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
                            <p className="aurora-text-caption mt-2 text-muted-foreground">
                                {connector.tagline}
                            </p>
                            {hidePrimaryCta &&
                            connector.provider === 'whatsapp_cloud' ? null : (
                                <ConnectAction
                                    connector={connector}
                                    primary={primary}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
            <p className="aurora-text-caption mt-3 text-muted-foreground">
                Gmail and Calendar live in{' '}
                <Link
                    href="/settings/connectors"
                    className="font-medium text-brand"
                >
                    Settings, Connectors
                </Link>
                . Same Google sign-in, no second login.
            </p>
        </Card>
    );
}
