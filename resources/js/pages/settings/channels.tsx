import { Head } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function ChannelSettings({
    channels,
    evolution,
}: {
    channels: { id: number; name: string; type: string; status: string }[];
    evolution: { connected: boolean };
}) {
    return (
        <>
            <Head title="Channels" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-semibold">Channels</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        WhatsApp Cloud via Evolution is first-class. Telegram is a later stub.
                    </p>
                </div>
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
