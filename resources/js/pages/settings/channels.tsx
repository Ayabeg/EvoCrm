import { Form, Head, Link } from '@inertiajs/react';
import { PlugsConnected } from '@phosphor-icons/react';
import {
    SettingsCard,
    SettingsEmptyState,
    SettingsFormRow,
    SettingsPageHeader,
    SettingsSaveBar,
} from '@/components/settings/chrome';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useSimpleMode } from '@/hooks/use-simple-mode';

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

            <SettingsPageHeader
                title="Channels"
                description="Sold Desk is EvoDesk. WhatsApp and WhatsApp Business via Evolution are first-class. Telegram is later."
            />

            <div className="grid gap-3">
                <Form action="/settings/channels" method="post">
                    {({ processing }) => (
                        <SettingsCard
                            title="Desk embed"
                            description="Operators stay on this CRM hostname."
                            footer={
                                <SettingsSaveBar
                                    processing={processing}
                                    saveLabel="Save Desk URL"
                                />
                            }
                        >
                            <p className="text-[12px] text-mute">
                                Embedded inside EvoCrm at{' '}
                                <Link
                                    href="/inbox"
                                    className="font-medium text-[#d9500f]"
                                >
                                    Inbox
                                </Link>
                                . Default{' '}
                                <span className="font-medium text-ink">
                                    https://desk.evotechly.com
                                </span>
                                . Clear the URL to use the native CRM desk.
                            </p>
                            <SettingsFormRow
                                label="Desk URL"
                                htmlFor="inbox_url"
                            >
                                <Input
                                    id="inbox_url"
                                    name="inbox_url"
                                    type="url"
                                    defaultValue={inboxUrl}
                                    className="h-8"
                                />
                            </SettingsFormRow>
                        </SettingsCard>
                    )}
                </Form>

                {visibleChannels.length === 0 ? (
                    <SettingsEmptyState
                        icon={
                            <PlugsConnected
                                className="size-6"
                                weight="regular"
                            />
                        }
                        title="No channels yet"
                        description="Connect WhatsApp from Integrations when Evolution is ready. SMS appears when simple mode is off."
                    />
                ) : (
                    <SettingsCard title="Connected channels">
                        <ul className="divide-y divide-hairline">
                            {visibleChannels.map((channel) => (
                                <li
                                    key={channel.id}
                                    className="flex items-center justify-between gap-3 py-2 text-[13px] first:pt-0 last:pb-0"
                                >
                                    <div>
                                        <p className="font-medium text-ink">
                                            {channel.name}
                                        </p>
                                        <p className="text-[12px] text-mute">
                                            {channel.type}
                                        </p>
                                    </div>
                                    <Badge
                                        variant={
                                            channel.status === 'connected' ||
                                            evolution.connected
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {channel.type === 'whatsapp_cloud' &&
                                        evolution.connected
                                            ? 'connected'
                                            : channel.status}
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    </SettingsCard>
                )}
            </div>
        </>
    );
}

ChannelSettings.layout = {
    breadcrumbs: [{ title: 'Channels', href: '/settings/channels' }],
};
