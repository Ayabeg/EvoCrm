import { Form, Head } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function MetaSettings({
    connected,
    app_id_set,
    ad_account_id_set,
    ad_accounts,
    selected_ad_account_id,
    graph_version,
    reason,
    can_manage,
}: {
    connected: boolean;
    app_id_set: boolean;
    ad_account_id_set: boolean;
    ad_accounts: { id: string; name: string }[];
    selected_ad_account_id: string | null;
    graph_version: string;
    reason: string | null;
    can_manage: boolean;
}) {
    return (
        <>
            <Head title="Meta" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-semibold">Meta Marketing API</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Uses this workspace&apos;s encrypted Meta OAuth connection. App
                        credentials remain in the environment.
                    </p>
                </div>
                <Card className="space-y-2 p-4 text-sm">
                    <Badge variant={connected ? 'default' : 'secondary'}>
                        {connected ? 'Ready' : 'Needs setup'}
                    </Badge>
                    <p>App ID: {app_id_set ? 'set' : 'empty'}</p>
                    <p>Workspace token: {ad_accounts.length > 0 ? 'connected' : 'not connected'}</p>
                    <p>Ad account: {ad_account_id_set ? 'selected' : 'not selected'}</p>
                    <p>Graph version: {graph_version}</p>
                    {reason ? <p className="text-brand">{reason}</p> : null}
                </Card>

                {ad_accounts.length > 0 ? (
                    <Card className="space-y-4 p-4">
                        <div>
                            <h2 className="text-sm font-semibold">Marketing ad account</h2>
                            <p className="text-xs text-muted-foreground">
                                Campaign and audience sync use only this workspace account.
                            </p>
                        </div>

                        <Form action="/settings/meta/ad-account" method="put">
                            {({ processing, errors }) => (
                                <div className="space-y-3">
                                    <label
                                        htmlFor="meta-ad-account"
                                        className="block text-xs font-medium"
                                    >
                                        Ad account
                                    </label>
                                    <select
                                        id="meta-ad-account"
                                        name="ad_account_id"
                                        defaultValue={selected_ad_account_id ?? ''}
                                        disabled={!can_manage || processing}
                                        className="h-9 w-full rounded-md border border-hairline bg-canvas px-3 text-sm"
                                    >
                                        <option value="" disabled>
                                            Select an account
                                        </option>
                                        {ad_accounts.map((account) => (
                                            <option key={account.id} value={account.id}>
                                                {account.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.ad_account_id ? (
                                        <p className="text-xs text-destructive">
                                            {errors.ad_account_id}
                                        </p>
                                    ) : null}
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={!can_manage || processing}
                                    >
                                        Save account
                                    </Button>
                                </div>
                            )}
                        </Form>
                    </Card>
                ) : null}
            </div>
        </>
    );
}

MetaSettings.layout = {
    breadcrumbs: [{ title: 'Meta', href: '/settings/meta' }],
};
