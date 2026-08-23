import { Form, Head } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function EvolutionSettings({
    health,
    config,
    last_webhook_at,
    last_event,
}: {
    health: { connected: boolean; reason: string | null; instance: string; mode: string };
    config: Record<string, unknown>;
    last_webhook_at: string | null;
    last_event: string | null;
}) {
    return (
        <>
            <Head title="Evolution / WhatsApp Cloud" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-semibold">Evolution / WhatsApp Cloud</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Cloud-only. Official WhatsApp Cloud API through Evolution API in Business API mode.
                        Baileys, QR login, Linked-devices, and OpenWA are refused.
                    </p>
                </div>
                <Card className="space-y-3 p-4 text-sm">
                    <div className="flex items-center gap-2">
                        <Badge variant={health.connected ? 'default' : 'secondary'}>
                            {health.connected ? 'Healthy' : 'Not connected'}
                        </Badge>
                        <span>{health.mode}</span>
                    </div>
                    <p>Instance: {String(config.instance)}</p>
                    <p>Last webhook: {last_webhook_at ?? 'never'}</p>
                    <p>Last event: {last_event ?? '—'}</p>
                    <p>Webhook URL: {String(config.webhook_url ?? 'not set')}</p>
                    <p>
                        Base URL {config.base_url_set ? 'set' : 'empty'} · API key{' '}
                        {config.api_key_set ? 'set' : 'empty'} · Cloud token{' '}
                        {config.token_set ? 'set' : 'empty'} · Phone number ID{' '}
                        {config.phone_number_id_set ? 'set' : 'empty'} · WABA{' '}
                        {config.waba_id_set ? 'set' : 'empty'}
                    </p>
                    {health.reason ? (
                        <p className="text-brand">{health.reason}</p>
                    ) : null}
                    <Form action="/settings/evolution/sync" method="post">
                        {({ processing }) => (
                            <Button disabled={processing}>Create / refresh Cloud instance + webhook</Button>
                        )}
                    </Form>
                </Card>
            </div>
        </>
    );
}

EvolutionSettings.layout = {
    breadcrumbs: [{ title: 'Evolution', href: '/settings/evolution' }],
};
