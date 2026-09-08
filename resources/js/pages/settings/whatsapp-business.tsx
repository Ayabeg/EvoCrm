import { Form, Head } from '@inertiajs/react';
import { WhatsAppBusinessMark } from '@/components/brand/marks';
import { BrandConnectButtons } from '@/components/connectors/brand-connect';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type Channel = {
    available: boolean;
    connected: boolean;
    needs_facebook?: boolean;
    display_phone?: string | null;
    verified_name?: string | null;
    message: string;
};

export default function WhatsAppBusinessSettings({
    channel,
    facebook_url,
}: {
    channel: Channel;
    facebook_url: string;
}) {
    return (
        <>
            <Head title="WhatsApp Business" />
            <div className="space-y-6">
                <div className="flex items-start gap-3">
                    <div className="grid size-11 place-content-center rounded-xl border bg-background">
                        <WhatsAppBusinessMark className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold">WhatsApp Business</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Continue with Facebook. Evolution connects WhatsApp
                            Business automatically — no phone-number ID to type.
                        </p>
                    </div>
                </div>

                <Card className="space-y-4 p-4">
                    <div className="flex items-center gap-2">
                        <Badge variant={channel.connected ? 'default' : 'secondary'}>
                            {channel.connected ? 'Connected' : 'Not connected'}
                        </Badge>
                        {channel.display_phone ? (
                            <span className="text-sm text-muted-foreground">
                                {channel.display_phone}
                            </span>
                        ) : null}
                    </div>
                    <p className="text-sm">{channel.message}</p>

                    <div className="flex flex-wrap gap-2">
                        {!channel.connected ? (
                            <BrandConnectButtons facebookUrl={facebook_url} />
                        ) : null}
                        {channel.connected ? (
                            <Form action="/settings/whatsapp-business" method="delete">
                                {({ processing }) => (
                                    <Button variant="outline" disabled={processing}>
                                        Disconnect
                                    </Button>
                                )}
                            </Form>
                        ) : null}
                    </div>
                </Card>
            </div>
        </>
    );
}

WhatsAppBusinessSettings.layout = {
    breadcrumbs: [
        { title: 'Apps', href: '/settings/apps' },
        { title: 'WhatsApp Business', href: '/settings/whatsapp-business' },
    ],
};
