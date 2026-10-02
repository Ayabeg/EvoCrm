import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Check, Minus } from '@phosphor-icons/react';
import { Badge } from '@/evo/ui/badge';
import { Button } from '@/evo/ui/button';
import { Card } from '@/evo/ui/card';
import { SettingsForm, SettingsPageHeader } from '@/evo/patterns/settings';
import { t } from '@/lib/i18n';
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
            <Head title={t('Meta')} />
            <div className="space-y-6">
                <div className="rounded-md border border-hairline bg-canvas p-4">
                    <ol className="flex flex-wrap gap-2 text-[12px]">
                        {[
                            'Connect Meta',
                            'Pick pages',
                            'Verify scopes',
                            'Finish',
                        ].map((step, index) => (
                            <li
                                key={step}
                                className={`rounded-full px-3 py-1 ${index === 0 ? 'bg-brand text-primary-foreground' : 'bg-canvas-soft text-muted-foreground'}`}
                            >
                                {index + 1}. {step}
                            </li>
                        ))}
                    </ol>
                </div>
                <div>
                    <Link
                        href="/settings/apps"
                        className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="size-3" />
                        Apps
                    </Link>
                    <SettingsPageHeader
                        title="Meta"
                        description="Official Facebook Login OAuth. One connection, four surfaces."
                    >
                        <Badge>{t('Connected')}</Badge>
                    </SettingsPageHeader>
                </div>

                <Card className="space-y-2 border-hairline bg-canvas p-4 text-sm shadow-none">
                    <p>
                        <span className="text-muted-foreground">{t('Account:')}</span>{' '}
                        {integration.account_name ?? '-'}
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
                        <span className="text-muted-foreground">{t('Token:')}</span>{' '}
                        {integration.long_lived
                            ? 'Configured · long-lived, stored encrypted'
                            : 'Configured · short-lived, stored encrypted'}
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
                    <h2 className="text-sm font-semibold">{t('Unlocks')}</h2>
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
                    <h2 className="text-sm font-semibold">Discovered assets</h2>
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
                        app keeps its grant on Meta's side — revoke it there too
                        if needed.
                    </p>
                    <SettingsForm
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
                    </SettingsForm>
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
