import { Form, Head } from '@inertiajs/react';
import { ChatCircle } from '@phosphor-icons/react';
import { BrandConnectButtons } from '@/components/connectors/brand-connect';
import {
    SettingsCard,
    SettingsEmptyState,
    SettingsPageHeader,
} from '@/components/settings/chrome';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
    can_configure = true,
}: {
    channel: Channel;
    facebook_url: string;
    can_configure?: boolean;
}) {
    return (
        <>
            <Head title="WhatsApp Business" />
            <div className="space-y-3">
                <SettingsPageHeader
                    title="WhatsApp Business"
                    description="WhatsApp Cloud via Evolution. Separate from personal WhatsApp. Disconnect removes the Cloud instance. Meta login and inbox messages stay."
                />

                {!channel.connected ? (
                    <SettingsEmptyState
                        icon={<ChatCircle className="size-6" />}
                        title="WhatsApp Business is disconnected"
                        description="Continue with Facebook. Evolution attaches the Business number without a token."
                    />
                ) : null}

                <SettingsCard>
                    <div className="flex items-center gap-2">
                        <Badge
                            variant={
                                channel.connected ? 'default' : 'secondary'
                            }
                        >
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
                        {can_configure && !channel.connected ? (
                            <BrandConnectButtons facebookUrl={facebook_url} />
                        ) : null}
                        {can_configure && channel.connected ? (
                            <Form
                                action="/settings/whatsapp-business"
                                method="delete"
                                onBefore={() =>
                                    window.confirm(
                                        'Disconnect WhatsApp Business from this workspace? The Cloud instance and stored credentials are removed. Existing inbox messages stay. Meta OAuth is not disconnected. You can reconnect later.',
                                    )
                                }
                            >
                                {({ processing }) => (
                                    <Button
                                        variant="outline"
                                        disabled={processing}
                                    >
                                        Disconnect
                                    </Button>
                                )}
                            </Form>
                        ) : null}
                    </div>
                </SettingsCard>
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
