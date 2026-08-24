import { Form, Link } from '@inertiajs/react';
import { Facebook, Instagram, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { OfficialDeskConnector } from '@/types';

function ChannelMark({ provider }: { provider: OfficialDeskConnector['provider'] }) {
    if (provider === 'instagram') {
        return <Instagram className="size-4 text-brand" />;
    }

    if (provider === 'facebook_messenger') {
        return <Facebook className="size-4 text-brand" />;
    }

    return <MessageCircle className="size-4 text-brand" />;
}

function statusLabel(status: OfficialDeskConnector['status']): string {
    if (status === 'connected') {
        return 'Connected';
    }

    if (status === 'needs_token') {
        return 'Needs official token';
    }

    if (status === 'needs_reconnect') {
        return 'Reconnect';
    }

    return 'Not connected';
}

export function OfficialConnectPanel({
    connectors,
    compact = false,
}: {
    connectors: OfficialDeskConnector[];
    compact?: boolean;
}) {
    return (
        <Card className="m-3 space-y-3 border-hairline bg-canvas-soft p-4">
            <div className="space-y-1">
                <h2 className="text-sm font-semibold">Connect official channels</h2>
                <p className="text-xs text-muted-foreground">
                    {compact
                        ? 'WhatsApp Cloud, Instagram, and Messenger — official Meta paths only.'
                        : 'EvoDesk talks on official Meta Cloud paths only: WhatsApp Cloud through Evolution, Instagram, and Messenger. No QR. No Baileys. No linked devices.'}
                </p>
            </div>
            <div className={compact ? 'grid gap-2' : 'grid gap-2 md:grid-cols-3'}>
                {connectors.map((connector) => (
                    <div
                        key={connector.provider}
                        className="rounded-lg border border-hairline bg-canvas p-3"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <ChannelMark provider={connector.provider} />
                                <p className="text-sm font-medium">{connector.name}</p>
                            </div>
                            <Badge
                                variant={
                                    connector.status === 'connected' ? 'default' : 'secondary'
                                }
                            >
                                {statusLabel(connector.status)}
                            </Badge>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">{connector.tagline}</p>
                        {connector.status !== 'connected' ? (
                            <Form
                                action="/desk/connectors"
                                method="post"
                                className="mt-3"
                            >
                                {({ processing }) => (
                                    <>
                                        <input
                                            type="hidden"
                                            name="provider"
                                            value={connector.provider}
                                        />
                                        <Button size="sm" disabled={processing}>
                                            Connect {connector.name}
                                        </Button>
                                    </>
                                )}
                            </Form>
                        ) : null}
                    </div>
                ))}
            </div>
            <p className="text-xs text-muted-foreground">
                Gmail and Calendar live in{' '}
                <Link href="/settings/connectors" className="font-medium text-brand">
                    Settings → Connectors
                </Link>
                . Same Google sign-in — no second login.
            </p>
        </Card>
    );
}
