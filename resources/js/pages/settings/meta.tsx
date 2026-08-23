import { Head } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function MetaSettings({
    connected,
    app_id_set,
    ad_account_id_set,
    graph_version,
    reason,
}: {
    connected: boolean;
    app_id_set: boolean;
    ad_account_id_set: boolean;
    graph_version: string;
    reason: string | null;
}) {
    return (
        <>
            <Head title="Meta" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-semibold">Meta Marketing API</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Env-driven. Do not invent app IDs, tokens, or Tech Provider status.
                    </p>
                </div>
                <Card className="space-y-2 p-4 text-sm">
                    <Badge variant={connected ? 'default' : 'secondary'}>
                        {connected ? 'Connected' : 'Not connected'}
                    </Badge>
                    <p>App ID: {app_id_set ? 'set' : 'empty'}</p>
                    <p>Ad account ID: {ad_account_id_set ? 'set' : 'empty'}</p>
                    <p>Graph version: {graph_version}</p>
                    {reason ? <p className="text-brand">{reason}</p> : null}
                </Card>
            </div>
        </>
    );
}

MetaSettings.layout = {
    breadcrumbs: [{ title: 'Meta', href: '/settings/meta' }],
};
