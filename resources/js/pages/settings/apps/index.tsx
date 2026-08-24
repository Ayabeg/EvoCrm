import { Head, Link } from '@inertiajs/react';
import { Check, ExternalLink, Facebook, Mailbox, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { MarketplaceApp } from '@/types';

function GoogleMark({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
            <path
                fill="#4285F4"
                d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
            />
            <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
            />
            <path
                fill="#FBBC05"
                d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
            />
            <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
            />
        </svg>
    );
}

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
                <Facebook className="size-5 text-foreground" />
            </div>
        );
    }

    return (
        <div className="grid size-11 shrink-0 place-content-center rounded-xl border bg-background">
            <Mailbox className="size-5 text-foreground" />
        </div>
    );
}

function MetaSetupCopy({ callbackUrl }: { callbackUrl?: string }) {
    return (
        <div className="mt-3 space-y-1 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Setup required</p>
            <p>
                Set <code className="font-mono">META_APP_ID</code> and{' '}
                <code className="font-mono">META_APP_SECRET</code> in{' '}
                <code className="font-mono">.env</code>, then reload. In the
                Meta App Dashboard, add this Facebook Login redirect URI:
            </p>
            {callbackUrl ? (
                <p className="font-mono break-all text-brand">{callbackUrl}</p>
            ) : null}
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
                                    key={unlock.key}
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

                    {app.key === 'google' && app.connected && (
                        <p className="mt-2 text-xs text-muted-foreground">
                            Sign-in with Google is live on the login screen.
                            Gmail and Calendar reuse that same OAuth client —
                            they never add a second Google login.
                        </p>
                    )}

                    {app.key === 'smtp' && (
                        <p className="mt-2 text-xs text-muted-foreground">
                            {app.mailboxes ?? 0} mailbox
                            {(app.mailboxes ?? 0) === 1 ? '' : 'es'} on this
                            workspace. Not OAuth — credentials live per
                            mailbox.
                        </p>
                    )}

                    {app.key === 'meta' &&
                        !app.configured &&
                        !app.connected && <MetaSetupCopy callbackUrl={app.callback_url} />}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        {app.key === 'meta' && app.configured && !app.connected && (
                            <Button size="sm" asChild>
                                <Link href={app.connect_url ?? '#'}>
                                    Set up
                                </Link>
                            </Button>
                        )}
                        {app.key === 'meta' && !app.configured && !app.connected && (
                            <Button size="sm" disabled>
                                Connect
                            </Button>
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
                        {app.key === 'meta' && app.connected && app.connected_at && (
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
                <div>
                    <h1 className="text-xl font-semibold">Apps</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        The integration marketplace. Every tile here is a real
                        mini-app with an official connection path — no fake
                        store tiles.
                    </p>
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
