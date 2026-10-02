import { Head } from '@inertiajs/react';
import { ChatText } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    SettingsCard,
    SettingsDangerZone,
    SettingsEmptyState,
    SettingsForm,
    SettingsFormRow,
    SettingsPageHeader,
    SettingsSaveBar,
} from '@/evo/patterns/settings';
import { t } from '@/lib/i18n';

type SmsSettingsProps = {
    connected: boolean;
    key_set: boolean;
    driver: string;
    url: string | null;
    method: string;
    http_auth: string;
    sender: string;
    field_to: string;
    field_message: string;
    field_sender: string;
    field_api_key: string;
    env_http_configured: boolean;
    env_twilio_configured: boolean;
};

export default function SmsSettings({
    connected,
    key_set,
    driver,
    url,
    method,
    http_auth,
    sender,
    field_to,
    field_message,
    field_sender,
    field_api_key,
    env_http_configured,
    env_twilio_configured,
}: SmsSettingsProps) {
    return (
        <>
            <Head title={t('SMS')} />

            <SettingsPageHeader
                title="SMS"
                description="Sends only to Algerian mobiles (+213 05 Ooredoo, 06 Mobilis, 07 Djezzy). Landlines and foreign numbers are refused."
            />

            <div className="grid gap-3">
                {!connected ? (
                    <SettingsEmptyState
                        icon={<ChatText className="size-6" weight="regular" />}
                        title="SMS gateway is disconnected"
                        description="Save a workspace gateway below. Sequences never fake a send. Desk replies can stub locally."
                    />
                ) : (
                    <SettingsCard title="Gateway status">
                        <div className="flex flex-wrap items-center gap-2 text-[13px]">
                            <Badge variant="default">Workspace gateway</Badge>
                            <span className="text-mute">
                                Env HTTP {env_http_configured ? 'set' : 'empty'}{' '}
                                / Twilio{' '}
                                {env_twilio_configured ? 'set' : 'empty'}
                            </span>
                        </div>
                    </SettingsCard>
                )}

                <SettingsForm action="/settings/sms" method="post">
                    {({ processing }) => (
                        <SettingsCard
                            title="Workspace gateway"
                            required
                            footer={
                                <SettingsSaveBar
                                    processing={processing}
                                    saveLabel="Save SMS gateway"
                                />
                            }
                        >
                            <p className="text-[12px] text-mute">
                                Default driver is a local HTTP aggregator.
                                Twilio is opt-in via{' '}
                                <code className="font-mono">
                                    SMS_DRIVER=twilio
                                </code>
                                . Quiet hours (Africa/Algiers 21:00-08:00) defer
                                sequence SMS.
                            </p>
                            <SettingsFormRow label="Driver" htmlFor="driver">
                                <select
                                    id="driver"
                                    name="driver"
                                    defaultValue={driver}
                                    className="h-8 w-full rounded-[4px] border border-hairline bg-white px-2 text-[13px]"
                                >
                                    <option value="http">
                                        DZ HTTP aggregator
                                    </option>
                                    <option value="twilio">
                                        Twilio (env credentials)
                                    </option>
                                </select>
                            </SettingsFormRow>
                            <SettingsFormRow label="Gateway URL" htmlFor="url">
                                <Input
                                    id="url"
                                    name="url"
                                    type="url"
                                    defaultValue={url ?? ''}
                                    placeholder="https://sms.example.dz/api/send"
                                    className="h-8"
                                />
                            </SettingsFormRow>
                            <SettingsFormRow label="Method" htmlFor="method">
                                <select
                                    id="method"
                                    name="method"
                                    defaultValue={method}
                                    className="h-8 w-full rounded-[4px] border border-hairline bg-white px-2 text-[13px]"
                                >
                                    <option value="POST">POST</option>
                                    <option value="GET">GET</option>
                                </select>
                            </SettingsFormRow>
                            <SettingsFormRow label="Auth" htmlFor="auth">
                                <select
                                    id="auth"
                                    name="auth"
                                    defaultValue={http_auth}
                                    className="h-8 w-full rounded-[4px] border border-hairline bg-white px-2 text-[13px]"
                                >
                                    <option value="form">
                                        API key in form body
                                    </option>
                                    <option value="bearer">Bearer token</option>
                                </select>
                            </SettingsFormRow>
                            <SettingsFormRow
                                label="Sender"
                                htmlFor="sender"
                                required
                                hint="11 letters or digits at most."
                            >
                                <Input
                                    id="sender"
                                    name="sender"
                                    defaultValue={sender}
                                    maxLength={11}
                                    required
                                    className="h-8"
                                />
                            </SettingsFormRow>
                            <SettingsFormRow
                                label="API key"
                                htmlFor="api_key"
                                hint={
                                    key_set
                                        ? 'Leave blank to keep the stored key.'
                                        : undefined
                                }
                            >
                                <Input
                                    id="api_key"
                                    name="api_key"
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder={
                                        key_set
                                            ? '••••••••'
                                            : 'Aggregator token'
                                    }
                                    className="h-8"
                                />
                            </SettingsFormRow>
                            <SettingsFormRow
                                label="To field"
                                htmlFor="field_to"
                            >
                                <Input
                                    id="field_to"
                                    name="field_to"
                                    defaultValue={field_to}
                                    className="h-8"
                                />
                            </SettingsFormRow>
                            <SettingsFormRow
                                label="Message field"
                                htmlFor="field_message"
                            >
                                <Input
                                    id="field_message"
                                    name="field_message"
                                    defaultValue={field_message}
                                    className="h-8"
                                />
                            </SettingsFormRow>
                            <SettingsFormRow
                                label="Sender field"
                                htmlFor="field_sender"
                            >
                                <Input
                                    id="field_sender"
                                    name="field_sender"
                                    defaultValue={field_sender}
                                    className="h-8"
                                />
                            </SettingsFormRow>
                            <SettingsFormRow
                                label="Key field"
                                htmlFor="field_api_key"
                            >
                                <Input
                                    id="field_api_key"
                                    name="field_api_key"
                                    defaultValue={field_api_key}
                                    className="h-8"
                                />
                            </SettingsFormRow>
                            <p className="text-[11px] text-mute">
                                SMSMode-style: set To to{' '}
                                <code className="font-mono">numero</code>,
                                sender to{' '}
                                <code className="font-mono">emetteur</code>,
                                auth to Bearer.
                            </p>
                        </SettingsCard>
                    )}
                </SettingsForm>

                {connected ? (
                    <SettingsForm
                        action="/settings/sms"
                        method="delete"
                        onBefore={() =>
                            window.confirm(
                                'Disconnect the SMS gateway? Stored API credentials are deleted. Sent messages stay. Sequences will not send SMS until you save a gateway again.',
                            )
                        }
                    >
                        {({ processing }) => (
                            <SettingsDangerZone
                                title="Disconnect"
                                description="Deletes the stored API key. Messages already sent stay. This does not revoke the aggregator account."
                            >
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    size="sm"
                                    data-settings="danger"
                                    disabled={processing}
                                >
                                    Disconnect
                                </Button>
                            </SettingsDangerZone>
                        )}
                    </SettingsForm>
                ) : null}
            </div>
        </>
    );
}

SmsSettings.layout = {
    breadcrumbs: [{ title: 'SMS', href: '/settings/sms' }],
};
