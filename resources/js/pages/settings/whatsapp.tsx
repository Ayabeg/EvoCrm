import { Form, Head, router } from '@inertiajs/react';
import { useEffect } from 'react';
import { WhatsAppMark } from '@/components/brand/marks';
import { BrandConnectButtons } from '@/components/connectors/brand-connect';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type Channel = {
    available: boolean;
    connected: boolean;
    state?: string;
    qr?: { base64: string; pairingCode?: string | null } | null;
    display_phone?: string | null;
    message: string;
};

export default function WhatsAppSettings({
    channel,
    facebook_url = '/auth/meta?popup=1',
}: {
    channel: Channel;
    facebook_url?: string;
}) {
    useEffect(() => {
        if (!channel.available || channel.connected || !channel.qr) {
            return;
        }

        const timer = window.setInterval(() => {
            router.reload({ only: ['channel'] });
        }, 4000);

        return () => window.clearInterval(timer);
    }, [channel.available, channel.connected, channel.qr]);

    return (
        <>
            <Head title="WhatsApp" />
            <div className="space-y-6">
                <div className="flex items-start gap-3">
                    <div className="grid size-11 place-content-center rounded-xl border bg-background">
                        <WhatsAppMark className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold">WhatsApp</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Continue with Facebook. Evolution connects WhatsApp
                            automatically — you never type a key.
                        </p>
                    </div>
                </div>

                <Card className="space-y-4 p-4">
                    <div className="flex items-center gap-2">
                        <Badge variant={channel.connected ? 'default' : 'secondary'}>
                            {channel.connected ? 'Connected' : 'Not connected'}
                        </Badge>
                    </div>
                    <p className="text-sm">{channel.message}</p>

                    <div className="flex flex-wrap gap-2">
                        {!channel.connected ? (
                            <BrandConnectButtons facebookUrl={facebook_url} />
                        ) : (
                            <Form action="/settings/whatsapp" method="delete">
                                {({ processing }) => (
                                    <Button variant="outline" disabled={processing}>
                                        Disconnect
                                    </Button>
                                )}
                            </Form>
                        )}
                    </div>
                </Card>

                {channel.qr?.base64 ? (
                    <Card className="space-y-3 p-4">
                        <p className="text-sm font-medium">Personal phone (optional)</p>
                        <p className="text-xs text-muted-foreground">
                            Only if you also want to link the WhatsApp app on
                            your phone. Facebook login is the main path.
                        </p>
                        <div className="grid justify-items-center gap-3 rounded-xl border bg-background p-6">
                            <img
                                src={channel.qr.base64}
                                alt="WhatsApp QR code"
                                className="size-52 rounded-lg bg-white p-2"
                            />
                        </div>
                    </Card>
                ) : null}
            </div>
        </>
    );
}

WhatsAppSettings.layout = {
    breadcrumbs: [
        { title: 'Apps', href: '/settings/apps' },
        { title: 'WhatsApp', href: '/settings/whatsapp' },
    ],
};
