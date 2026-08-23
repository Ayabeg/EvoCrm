import { Form, Head, usePage } from '@inertiajs/react';
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
    const desk = usePage<{ deskUrl?: string }>().props.deskUrl || inboxUrl;

    return (
        <>
            <Head title="Channels" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-semibold">Channels</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Sold Desk is EvoDesk (Chatwoot Community). WhatsApp Cloud via Evolution is first-class. Telegram is later.
                    </p>
                </div>
                <Card className="space-y-3 p-4">
                    <h2 className="font-medium">Desk URL</h2>
                    <p className="text-sm text-muted-foreground">
                        The Desk nav item opens this URL in the same window. Default{' '}
                        <a href="https://desk.evotechly.com" className="underline">
                            https://desk.evotechly.com
                        </a>
                        .
                    </p>
                    <Form action="/settings/channels" method="post" className="grid gap-3">
                        {({ processing }) => (
                            <>
                                <div>
                                    <Label htmlFor="inbox_url">EVOSALES_INBOX_URL</Label>
                                    <Input id="inbox_url" name="inbox_url" type="url" defaultValue={inboxUrl} required />
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button disabled={processing}>Save Desk URL</Button>
                                    <a href={desk} className="text-sm font-medium text-brand">
                                        Open Desk
                                    </a>
                                </div>
                            </>
                        )}
                    </Form>
                </Card>
                <div className="space-y-3">
                    {channels.map((channel) => (
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
