import { Form, Head, Link } from '@inertiajs/react';
import { useSimpleMode } from '@/hooks/use-simple-mode';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ChannelSettings({
    channels,
    evolution,
    inboxUrl,
}: {
    channels: { id: number; name: string; type: string; status: string }[];
    evolution: { connected: boolean };
    inboxUrl: string;
}) {
    const { features } = useSimpleMode();
    const visibleChannels = features.sms
        ? channels
        : channels.filter((channel) => channel.type !== 'sms');

    return (
        <>
            <Head title="Channels" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-semibold">Channels</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Sold Desk is EvoDesk (Chatwoot Community). WhatsApp and WhatsApp Business via Evolution are first-class. Telegram is later.
                    </p>
                </div>
                <Card className="space-y-3 p-4">
                    <h2 className="font-medium">Desk embed source</h2>
                    <p className="text-sm text-muted-foreground">
                        This URL is embedded inside EvoSales at <Link href="/inbox" className="underline">My Inbox</Link>{' '}
                        — operators stay on this CRM hostname. Default{' '}
                        <span className="font-medium">https://desk.evotechly.com</span>. If the desk sends
                        X-Frame-Options, allow-frame this origin on the desk, or clear the URL to use the native
                        CRM desk at /inbox. Optional path: <code>EVOSALES_INBOX_EMBED_PATH</code>.
                    </p>
                    <Form action="/settings/channels" method="post" className="grid gap-3">
                        {({ processing }) => (
                            <>
                                <div>
                                    <Label htmlFor="inbox_url">EVOSALES_INBOX_URL</Label>
                                    <Input id="inbox_url" name="inbox_url" type="url" defaultValue={inboxUrl} />
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button disabled={processing}>Save Desk URL</Button>
                                    <Link href="/inbox" className="text-sm font-medium text-brand">
                                        Open inbox
                                    </Link>
                                </div>
                            </>
                        )}
                    </Form>
                </Card>
                <div className="space-y-3">
                    {visibleChannels.map((channel) => (
                        <Card key={channel.id} className="flex items-center justify-between p-4 text-sm">
                            <div>
                                <p className="font-medium">{channel.name}</p>
                                <p className="text-muted-foreground">{channel.type}</p>
                            </div>
                            <Badge variant={channel.status === 'connected' || evolution.connected ? 'default' : 'secondary'}>
                                {channel.type === 'whatsapp_cloud' && evolution.connected
                                    ? 'connected'
                                    : channel.status}
                            </Badge>
                        </Card>
                    ))}
                </div>
            </div>
        </>
    );
}

ChannelSettings.layout = {
    breadcrumbs: [{ title: 'Channels', href: '/settings/channels' }],
};
