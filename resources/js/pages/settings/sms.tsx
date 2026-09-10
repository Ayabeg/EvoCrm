import { Form, Head } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
            <Head title="SMS" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-semibold">SMS · Algeria</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Sends only to Algerian mobiles (+213 05 Ooredoo, 06 Mobilis, 07
                        Djezzy). Landlines and foreign numbers are refused. Desk replies
                        can stub locally; sequences never fake a send.
                    </p>
                </div>
                <Card className="space-y-3 p-4 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={connected ? 'default' : 'secondary'}>
                            {connected ? 'Workspace gateway' : 'Not connected'}
                        </Badge>
                        <span>
                            Env HTTP {env_http_configured ? 'set' : 'empty'} · Twilio{' '}
                            {env_twilio_configured ? 'set' : 'empty'}
                        </span>
                    </div>
                    <p className="text-muted-foreground">
                        Default driver is a local HTTP aggregator (generic POST or
                        SMSMode-style fields). Twilio is opt-in via{' '}
                        <code className="font-mono">SMS_DRIVER=twilio</code>. Arabic SMS
                        uses 70 characters per segment (UCS-2); French GSM-7 is 160. Quiet
                        hours (Africa/Algiers 21:00–08:00) defer sequence SMS; desk replies
                        still send.
                    </p>
                </Card>
                <Card className="space-y-4 p-4">
                    <h2 className="font-medium">Workspace gateway</h2>
                    <Form action="/settings/sms" method="post" className="grid gap-3">
                        {({ processing }) => (
                            <>
                                <div>
                                    <Label htmlFor="driver">Driver</Label>
                                    <select
                                        id="driver"
                                        name="driver"
                                        defaultValue={driver}
                                        className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                    >
                                        <option value="http">DZ HTTP aggregator</option>
                                        <option value="twilio">Twilio (env credentials)</option>
                                    </select>
                                </div>
                                <div>
                                    <Label htmlFor="url">Gateway URL</Label>
                                    <Input
                                        id="url"
                                        name="url"
                                        type="url"
                                        defaultValue={url ?? ''}
                                        placeholder="https://sms.example.dz/api/send"
                                    />
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <Label htmlFor="method">Method</Label>
                                        <select
                                            id="method"
                                            name="method"
                                            defaultValue={method}
                                            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                        >
                                            <option value="POST">POST</option>
                                            <option value="GET">GET</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label htmlFor="auth">Auth</Label>
                                        <select
                                        id="auth"
                                        name="auth"
                                        defaultValue={http_auth}
                                            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                        >
                                            <option value="form">API key in form body</option>
                                            <option value="bearer">Bearer token</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="sender">Sender (≤11 letters/digits)</Label>
                                    <Input
                                        id="sender"
                                        name="sender"
                                        defaultValue={sender}
                                        maxLength={11}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="api_key">
                                        API key {key_set ? '(leave blank to keep the stored key)' : ''}
                                    </Label>
                                    <Input
                                        id="api_key"
                                        name="api_key"
                                        type="password"
                                        autoComplete="new-password"
                                        placeholder={key_set ? '••••••••' : 'Aggregator token'}
                                    />
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <Label htmlFor="field_to">To field</Label>
                                        <Input id="field_to" name="field_to" defaultValue={field_to} />
                                    </div>
                                    <div>
                                        <Label htmlFor="field_message">Message field</Label>
                                        <Input
                                            id="field_message"
                                            name="field_message"
                                            defaultValue={field_message}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="field_sender">Sender field</Label>
                                        <Input
                                            id="field_sender"
                                            name="field_sender"
                                            defaultValue={field_sender}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="field_api_key">Key field</Label>
                                        <Input
                                            id="field_api_key"
                                            name="field_api_key"
                                            defaultValue={field_api_key}
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    SMSMode-style: set To to <code>numero</code>, sender to{' '}
                                    <code>emetteur</code>, auth to Bearer.
                                </p>
                                <Button disabled={processing}>Save SMS gateway</Button>
                            </>
                        )}
                    </Form>
                    {connected ? (
                        <Form action="/settings/sms" method="delete">
                            {({ processing }) => (
                                <Button type="submit" variant="outline" disabled={processing}>
                                    Disconnect
                                </Button>
                            )}
                        </Form>
                    ) : null}
                </Card>
            </div>
        </>
    );
}

SmsSettings.layout = {
    breadcrumbs: [{ title: 'SMS', href: '/settings/sms' }],
};
