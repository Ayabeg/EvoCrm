import { Form, Link } from '@inertiajs/react';
import {
    ChatCircle,
    FacebookLogo,
    InstagramLogo,
} from '@phosphor-icons/react';
import { connectorStatusLabel } from '@/components/desk/connector-status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { OfficialDeskConnector } from '@/types';

export function ChannelMark({
    provider,
}: {
    provider: OfficialDeskConnector['provider'];
}) {
    if (provider === 'instagram') {
        return <InstagramLogo className="size-4 text-ink" weight="regular" />;
    }

    if (provider === 'facebook_messenger') {
        return <FacebookLogo className="size-4 text-ink" weight="regular" />;
    }

    return <ChatCircle className="size-4 text-ink" weight="regular" />;
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
        <Form action="/desk/connectors" method="post" className="mt-2">
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
                        className="h-7"
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
        <section
            className={
                compact
                    ? 'border-b border-hairline bg-white px-4 py-3'
                    : 'border-t border-hairline bg-white px-4 py-4 sm:px-6'
            }
        >
            <div className="space-y-0.5">
                <h2 className="text-[13px] font-semibold text-ink">
                    Connect official channels
                </h2>
                <p className="text-[12px] leading-5 text-mute">
                    {compact
                        ? 'WhatsApp Cloud, Instagram, and Messenger. Official Meta paths only.'
                        : 'EvoDesk talks on official Meta Cloud paths only: WhatsApp Cloud through Evolution, Instagram, and Messenger. No QR. No Baileys. No linked devices.'}
                </p>
            </div>
            <div
                className={
                    compact
                        ? 'mt-2 grid gap-1.5'
                        : 'mt-3 grid gap-px bg-hairline md:grid-cols-3'
                }
            >
                {connectors.map((connector) => {
                    const primary =
                        connector.provider === 'whatsapp_cloud' &&
                        !hidePrimaryCta;

                    return (
                        <div
                            key={connector.provider}
                            className={
                                compact
                                    ? 'flex items-start justify-between gap-2 border border-hairline bg-white px-2.5 py-2'
                                    : 'bg-white p-3'
                            }
                        >
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="grid size-7 place-content-center bg-canvas-soft">
                                        <ChannelMark
                                            provider={connector.provider}
                                        />
                                    </span>
                                    <p className="text-[12px] font-medium text-ink">
                                        {connector.name}
                                    </p>
                                    <Badge
                                        variant={
                                            connector.status === 'connected'
                                                ? 'default'
                                                : 'secondary'
                                        }
                                        className="rounded-none"
                                    >
                                        {connectorStatusLabel(connector.status)}
                                    </Badge>
                                </div>
                                <p className="mt-1.5 text-[11px] leading-4 text-mute">
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
                        </div>
                    );
                })}
            </div>
            <p className="mt-3 text-[11px] text-mute">
                Gmail and Calendar live in{' '}
                <Link
                    href="/settings/connectors"
                    className="font-medium text-brand underline-offset-2 hover:underline"
                >
                    Settings, Connectors
                </Link>
                . Same Google sign-in, no second login.
            </p>
        </section>
    );
}
