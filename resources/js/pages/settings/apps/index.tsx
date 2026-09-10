import { Head, Link } from '@inertiajs/react';
import { Check, ExternalLink, Mailbox, Minus } from 'lucide-react';
import {
    GoogleMark,
    MetaMark,
    WhatsAppBusinessMark,
    WhatsAppMark,
} from '@/components/brand/marks';
import { BrandConnectButtons } from '@/components/connectors/brand-connect';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { MarketplaceApp } from '@/types';

function AppLogo({ appKey }: { appKey: string }) {
    if (appKey === 'google') {
        return (
            <div className="grid size-11 shrink-0 place-content-center rounded-xl border bg-background">
                <GoogleMark className="size-5" />
            </div>
        );
    }

    if (appKey === 'meta') {
        return (
            <div className="grid size-11 shrink-0 place-content-center rounded-xl border bg-background">
                <MetaMark className="size-6" />
            </div>
        );
    }

    if (appKey === 'whatsapp') {
        return (
            <div className="grid size-11 shrink-0 place-content-center rounded-xl border bg-background">
                <WhatsAppMark className="size-6" />
            </div>
        );
    }

    if (appKey === 'whatsapp_business') {
        return (
            <div className="grid size-11 shrink-0 place-content-center rounded-xl border bg-background">
                <WhatsAppBusinessMark className="size-6" />
            </div>
        );
    }

    return (
        <div className="grid size-11 shrink-0 place-content-center rounded-xl border bg-background">
            <Mailbox className="size-5 text-foreground" />
        </div>
    );
}

function AppCard({ app }: { app: MarketplaceApp }) {
    return (
        <Card className="p-4">
            <div className="flex items-start gap-3">
                <AppLogo appKey={app.key} />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold">{app.name}</h3>
                        <Badge
                            variant={app.connected ? 'default' : 'secondary'}
                        >
                            {app.connected ? 'Connected' : 'Not connected'}
                        </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {app.tagline}
                    </p>

                    {app.key === 'meta' && app.connected && (
                        <div className="mt-3 grid gap-1.5">
                            {app.unlocks.map((unlock) => (
                                <div
                                    key={`${unlock.key}-${unlock.scope}`}
                                    className="flex items-center gap-2 text-xs"
                                >
                                    {unlock.granted ? (
                                        <Check className="size-3.5 text-brand" />
                                    ) : (
                                        <Minus className="size-3.5 text-muted-foreground" />
                                    )}
                                    <span
                                        className={
                                            unlock.granted
                                                ? 'text-foreground'
                                                : 'text-muted-foreground'
                                        }
                                    >
                                        {unlock.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {app.key === 'google' && (
                        <div className="mt-3 space-y-1 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                            <p className="font-medium text-foreground">
                                Google Cloud Console
                            </p>
                            <p>
                                On this OAuth client, Authorized JavaScript
                                origin must be exactly:
                            </p>
                            {app.origin_url ? (
                                <p className="font-mono break-all text-brand">
                                    {app.origin_url}
                                </p>
                            ) : null}
                            <p>
                                Authorized redirect URI must be exactly (no
                                trailing slash). Error 400
                                redirect_uri_mismatch means this URI is missing
                                on the client:
                            </p>
                            {app.callback_url ? (
                                <p className="font-mono break-all text-brand">
                                    {app.callback_url}
                                </p>
                            ) : null}
                        </div>
                    )}

                    {app.key === 'smtp' && (
                        <p className="mt-2 text-xs text-muted-foreground">
                            {app.mailboxes ?? 0} mailbox
                            {(app.mailboxes ?? 0) === 1 ? '' : 'es'} on this
                            workspace. Not OAuth — credentials live per
                            mailbox.
                        </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        {(app.key === 'meta' ||
                            app.key === 'whatsapp' ||
                            app.key === 'whatsapp_business') &&
                            !app.connected && (
                                <BrandConnectButtons facebookUrl={app.connect_url} />
                            )}
                        {app.connected && app.manage_url && (
                            <Button size="sm" variant="outline" asChild>
                                <Link href={app.manage_url}>Manage</Link>
                            </Button>
                        )}
                        {app.key === 'smtp' && app.webmail_url && (
                            <Button size="sm" variant="ghost" asChild>
                                <a
                                    href={app.webmail_url}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <ExternalLink className="size-3.5" />
                                    Open webmail
                                </a>
                            </Button>
                        )}
                        {app.key === 'meta' &&
                            app.connected &&
                            app.connected_at && (
                                <span className="text-xs text-muted-foreground">
                                    since{' '}
                                    {new Date(
                                        app.connected_at,
                                    ).toLocaleDateString('en-GB', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                </span>
                            )}
                    </div>
                </div>
            </div>
        </Card>
    );
}

export default function AppsMarketplace({ apps }: { apps: MarketplaceApp[] }) {
    return (
        <>
            <Head title="Apps" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">Apps</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Continue with Facebook. WhatsApp connects automatically.
                            You never enter an App ID, token, or API key.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/settings/setup">Get started</Link>
                    </Button>
                </div>

                <div className="grid gap-3">
                    {apps.map((app) => (
                        <AppCard key={app.key} app={app} />
                    ))}
                </div>
            </div>
        </>
    );
}

AppsMarketplace.layout = {
    breadcrumbs: [{ title: 'Apps', href: '/settings/apps' }],
};
