import { Head, Link } from '@inertiajs/react';
import {
    Check,
    EnvelopeSimple,
    Minus,
    Plugs,
    ArrowSquareOut,
} from '@phosphor-icons/react';
import {
    GoogleMark,
    MetaMark,
    WhatsAppBusinessMark,
    WhatsAppMark,
} from '@/components/brand/marks';
import { BrandConnectButtons } from '@/components/connectors/brand-connect';
import { Badge } from '@/evo/ui/badge';
import { Button } from '@/evo/ui/button';
import {
    SettingsCard,
    SettingsEmptyState,
    SettingsPageHeader,
} from '@/evo/patterns/settings';
import { t } from '@/lib/i18n';
import type { MarketplaceApp } from '@/types';

function AppLogo({ appKey }: { appKey: string }) {
    if (appKey === 'google') {
        return (
            <div className="grid size-9 shrink-0 place-content-center rounded-[4px] border border-hairline bg-white">
                <GoogleMark className="size-5" />
            </div>
        );
    }

    if (appKey === 'meta') {
        return (
            <div className="grid size-9 shrink-0 place-content-center rounded-[4px] border border-hairline bg-white">
                <MetaMark className="size-6" />
            </div>
        );
    }

    if (appKey === 'whatsapp') {
        return (
            <div className="grid size-9 shrink-0 place-content-center rounded-[4px] border border-hairline bg-white">
                <WhatsAppMark className="size-6" />
            </div>
        );
    }

    if (appKey === 'whatsapp_business') {
        return (
            <div className="grid size-9 shrink-0 place-content-center rounded-[4px] border border-hairline bg-white">
                <WhatsAppBusinessMark className="size-6" />
            </div>
        );
    }

    return (
        <div className="grid size-9 shrink-0 place-content-center rounded-[4px] border border-hairline bg-white">
            <EnvelopeSimple className="size-5 text-ink" />
        </div>
    );
}

function AppCard({
    app,
    canConfigure,
}: {
    app: MarketplaceApp;
    canConfigure: boolean;
}) {
    return (
        <SettingsCard>
            <div className="flex items-start gap-3">
                <AppLogo appKey={app.key} />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-[14px] font-semibold text-ink">
                            {app.name}
                        </h3>
                        <Badge
                            variant={
                                app.status === 'needs_attention'
                                    ? 'destructive'
                                    : app.connected
                                      ? 'default'
                                      : 'secondary'
                            }
                        >
                            {app.status === 'needs_attention'
                                ? t('Needs attention')
                                : app.connected
                                  ? t('Connected')
                                  : t('Not connected')}
                        </Badge>
                    </div>
                    <p className="mt-1 text-[13px] text-mute">{app.tagline}</p>
                    {app.account_label ? (
                        <p className="mt-1 min-w-0 truncate text-[12px] text-ink">
                            {app.account_label}
                        </p>
                    ) : null}

                    {!app.connected ? (
                        <p
                            data-settings="disconnected"
                            className="mt-2 text-[12px] text-mute"
                        >
                            {t(
                                'Disconnected. Connect to unlock this app on the workspace.',
                            )}
                        </p>
                    ) : null}

                    {app.key === 'meta' && app.connected && (
                        <div className="mt-3 grid gap-1.5">
                            {app.unlocks.map((unlock) => (
                                <div
                                    key={`${unlock.key}-${unlock.scope}`}
                                    className="flex items-center gap-2 text-[12px]"
                                >
                                    {unlock.granted ? (
                                        <Check className="size-3.5 text-brand" />
                                    ) : (
                                        <Minus className="size-3.5 text-mute" />
                                    )}
                                    <span
                                        className={
                                            unlock.granted
                                                ? 'text-ink'
                                                : 'text-mute'
                                        }
                                    >
                                        {unlock.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {app.key === 'google' && (
                        <div className="mt-3 space-y-1 rounded-[4px] border border-dashed border-hairline bg-canvas p-3 text-[12px] text-mute">
                            <p className="font-medium text-ink">
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
                                trailing slash). Error 400 redirect_uri_mismatch
                                means this URI is missing on the client:
                            </p>
                            {app.callback_url ? (
                                <p className="font-mono break-all text-brand">
                                    {app.callback_url}
                                </p>
                            ) : null}
                        </div>
                    )}

                    {app.key === 'smtp' && (
                        <p className="mt-2 text-[12px] text-mute">
                            {app.mailboxes ?? 0} mailbox
                            {(app.mailboxes ?? 0) === 1 ? '' : 'es'} on this
                            workspace. Not OAuth - credentials live per mailbox.
                        </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        {canConfigure &&
                            (app.key === 'meta' ||
                                app.key === 'whatsapp' ||
                                app.key === 'whatsapp_business') &&
                            !app.connected && (
                                <BrandConnectButtons
                                    facebookUrl={app.connect_url}
                                />
                            )}
                        {app.connected && app.manage_url && (
                            <Button size="sm" variant="outline" asChild>
                                <Link href={app.manage_url}>{t('Manage')}</Link>
                            </Button>
                        )}
                        {app.key === 'smtp' && app.webmail_url && (
                            <Button size="sm" variant="ghost" asChild>
                                <a
                                    href={app.webmail_url}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <ArrowSquareOut className="size-3.5" />
                                    {t('Open webmail')}
                                </a>
                            </Button>
                        )}
                        {app.key === 'meta' &&
                            app.connected &&
                            app.connected_at && (
                                <span className="text-[12px] text-mute">
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
        </SettingsCard>
    );
}

export default function AppsMarketplace({
    apps,
    can_configure = true,
}: {
    apps: MarketplaceApp[];
    can_configure?: boolean;
}) {
    const connectedCount = apps.filter((app) => app.connected).length;

    return (
        <>
            <Head title={t('Apps')} />
            <SettingsPageHeader
                title={t('Apps')}
                description={t(
                    'Product connections for this workspace. Status is Connected when a configuration exists — not a live health probe.',
                )}
            >
                <Button
                    asChild
                    size="sm"
                    className="bg-brand text-white hover:bg-brand-hover"
                >
                    <Link href="/settings/setup">{t('Get started')}</Link>
                </Button>
            </SettingsPageHeader>

            {apps.length === 0 ? (
                <SettingsEmptyState
                    icon={<Plugs className="size-6" weight="regular" />}
                    title={t('No apps on this workspace')}
                    description={t(
                        'Apps appear here once the workspace marketplace is provisioned.',
                    )}
                />
            ) : (
                <div className="grid gap-3">
                    {connectedCount === 0 ? (
                        <SettingsEmptyState
                            icon={<Plugs className="size-6" weight="regular" />}
                            title={t('Nothing connected yet')}
                            description={t(
                                'Connect Meta, WhatsApp, Google, or mail to start using this workspace.',
                            )}
                            action={
                                <Button size="sm" asChild>
                                    <Link href="/settings/setup">
                                        {t('Open setup')}
                                    </Link>
                                </Button>
                            }
                        />
                    ) : null}
                    {apps.map((app) => (
                        <AppCard
                            key={app.key}
                            app={app}
                            canConfigure={can_configure}
                        />
                    ))}
                </div>
            )}
        </>
    );
}

AppsMarketplace.layout = {
    breadcrumbs: [{ title: 'Apps', href: '/settings/apps' }],
};
