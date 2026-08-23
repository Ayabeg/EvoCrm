import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, Check, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { AppUnlock } from '@/types';

type MetaIntegration = {
    connected_at: string | null;
    expires_at: string | null;
    scopes: string[];
    account_name: string | null;
    account_email: string | null;
    long_lived: boolean;
    pages: { id: string; name: string }[];
    ad_accounts: { id: string; name: string }[];
};

function formatDate(iso: string | null): string {
    if (!iso) {
        return '—';
    }

    return new Date(iso).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default function MetaApp({
    integration,
    unlocks,
    graph_version,
}: {
    integration: MetaIntegration;
    unlocks: AppUnlock[];
    graph_version: string;
}) {
    return (
        <>
            <Head title="Meta" />
            <div className="space-y-6">
                <div>
                    <Link
                        href="/settings/apps"
                        className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="size-3" />
                        Apps
                    </Link>
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-semibold">Meta</h1>
                        <Badge>Connected</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Official Facebook Login OAuth. One connection, four
                        surfaces.
                    </p>
                </div>

                <Card className="space-y-2 p-4 text-sm">
                    <p>
                        <span className="text-muted-foreground">Account:</span>{' '}
                        {integration.account_name ?? '—'}
                        {integration.account_email
                            ? ` (${integration.account_email})`
                            : ''}
                    </p>
                    <p>
                        <span className="text-muted-foreground">
                            Connected:
                        </span>{' '}
                        {formatDate(integration.connected_at)}
                    </p>
                    <p>
                        <span className="text-muted-foreground">Token:</span>{' '}
                        {integration.long_lived
                            ? 'long-lived, stored encrypted'
                            : 'short-lived, stored encrypted'}
                        {integration.expires_at
                            ? ` — expires ${formatDate(integration.expires_at)}`
                            : ''}
                    </p>
                    <p>
                        <span className="text-muted-foreground">
                            Graph version:
                        </span>{' '}
                        {graph_version}
                    </p>
                </Card>

                <Card className="p-4">
                    <h2 className="text-sm font-semibold">Unlocks</h2>
                    <div className="mt-3 grid gap-2">
                        {unlocks.map((unlock) => (
                            <div
                                key={unlock.key}
                                className="flex items-center justify-between gap-2 text-sm"
                            >
                                <span className="flex items-center gap-2">
                                    {unlock.granted ? (
                                        <Check className="size-4 text-brand" />
                                    ) : (
                                        <Minus className="size-4 text-muted-foreground" />
                                    )}
                                    <span
                                        className={
                                            unlock.granted
                                                ? ''
                                                : 'text-muted-foreground'
                                        }
                                    >
                                        {unlock.label}
                                    </span>
                                </span>
                                <code className="text-xs text-muted-foreground">
                                    {unlock.scope}
                                </code>
                            </div>
                        ))}
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                        Live Ads spend and WhatsApp Cloud messaging still
                        require Meta Business Verification and App Review
                        advanced access on these scopes.
                    </p>
                </Card>

                <Card className="p-4 text-sm">
                    <h2 className="text-sm font-semibold">
                        Discovered assets
                    </h2>
                    <div className="mt-3 space-y-3">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase">
                                Facebook Pages
                            </p>
                            {integration.pages.length > 0 ? (
                                <ul className="mt-1 list-inside list-disc">
                                    {integration.pages.map((page) => (
                                        <li key={page.id}>{page.name}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-1 text-muted-foreground">
                                    None discovered on this grant.
                                </p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase">
                                Ad accounts
                            </p>
                            {integration.ad_accounts.length > 0 ? (
                                <ul className="mt-1 list-inside list-disc">
                                    {integration.ad_accounts.map((account) => (
                                        <li key={account.id}>
                                            {account.name} ({account.id})
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-1 text-muted-foreground">
                                    None discovered on this grant.
                                </p>
                            )}
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <h2 className="text-sm font-semibold">Granted scopes</h2>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {integration.scopes.map((scope) => (
                            <Badge key={scope} variant="secondary">
                                {scope}
                            </Badge>
                        ))}
                    </div>
                </Card>

                <Card className="p-4">
                    <h2 className="text-sm font-semibold text-destructive">
                        Disconnect
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Deletes the stored tokens from this workspace. The Meta
                        app keeps its grant on Meta's side — revoke it there
                        too if needed.
                    </p>
                    <Form
                        action="/settings/apps/meta"
                        method="delete"
                        className="mt-3"
                        onBefore={() =>
                            window.confirm(
                                'Disconnect Meta from this workspace?',
                            )
                        }
                    >
                        {({ processing }) => (
                            <Button
                                variant="outline"
                                className="text-destructive"
                                disabled={processing}
                            >
                                Disconnect Meta
                            </Button>
                        )}
                    </Form>
                </Card>
            </div>
        </>
    );
}

MetaApp.layout = {
    breadcrumbs: [
        { title: 'Apps', href: '/settings/apps' },
        { title: 'Meta', href: '/settings/apps/meta' },
    ],
};
