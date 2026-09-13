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
}: {
    channel: Channel;
    facebook_url: string;
}) {
    return (
        <>
            <Head title="WhatsApp Business" />
            <div className="space-y-3">
                <SettingsPageHeader
                    title="WhatsApp Business"
                    description="Continue with Facebook. Evolution connects WhatsApp Business automatically. No phone-number ID to type."
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
                        {!channel.connected ? (
                            <BrandConnectButtons facebookUrl={facebook_url} />
                        ) : null}
                        {channel.connected ? (
                            <Form
                                action="/settings/whatsapp-business"
                                method="delete"
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
