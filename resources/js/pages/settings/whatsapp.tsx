import { Head, router } from '@inertiajs/react';
import { ChatCircle } from '@phosphor-icons/react';
import { useEffect } from 'react';
import { BrandConnectButtons } from '@/components/connectors/brand-connect';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    SettingsCard,
    SettingsEmptyState,
    SettingsPageHeader,
    SettingsForm,
} from '@/evo/patterns/settings';
import { t } from '@/lib/i18n';

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
    can_configure = true,
}: {
    channel: Channel;
    facebook_url?: string;
    can_configure?: boolean;
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
            <Head title={t('WhatsApp')} />
            <div className="space-y-3">
                <SettingsPageHeader
                    title="WhatsApp"
                    description="Personal WhatsApp via Evolution. This is not WhatsApp Business Cloud. Disconnect removes the instance and credentials. Inbox messages stay."
                />

                {!channel.connected ? (
                    <SettingsEmptyState
                        icon={<ChatCircle className="size-6" />}
                        title="WhatsApp is disconnected"
                        description="Continue with Facebook. Evolution attaches the personal WhatsApp channel."
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
                    </div>
                    <p className="text-sm">{channel.message}</p>

                    {channel.display_phone ? (
                        <p className="min-w-0 truncate text-[13px] text-ink">
                            {channel.display_phone}
                        </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                        {can_configure && !channel.connected ? (
                            <BrandConnectButtons facebookUrl={facebook_url} />
                        ) : null}
                        {can_configure && channel.connected ? (
                            <SettingsForm
                                action="/settings/whatsapp"
                                method="delete"
                                onBefore={() =>
                                    window.confirm(
                                        'Disconnect WhatsApp from this workspace? The Evolution instance and stored credentials are removed. Existing inbox messages stay. You can reconnect later.',
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
                            </SettingsForm>
                        ) : null}
                    </div>
                </SettingsCard>

                {channel.qr?.base64 ? (
                    <SettingsCard title="Personal phone (optional)">
                        <p className="text-[12px] text-mute">
                            Only if you also want to link the WhatsApp app on
                            your phone. Facebook login is the main path.
                        </p>
                        <div className="grid justify-items-center gap-3 rounded-[4px] border border-hairline bg-white p-6">
                            <img
                                src={channel.qr.base64}
                                alt="WhatsApp QR code"
                                className="size-52 rounded-[4px] bg-white p-2"
                            />
                        </div>
                    </SettingsCard>
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
