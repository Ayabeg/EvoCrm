import { Link, usePage } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';
import type { Auth } from '@/types/auth';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: edit(),
        icon: null,
    },
    {
        title: 'Security',
        href: editSecurity(),
        icon: null,
    },
    {
        title: 'Appearance',
        href: editAppearance(),
        icon: null,
    },
    {
        title: 'Meetings',
        href: '/settings/meetings',
        icon: null,
    },
    {
        title: 'Integrations',
        href: '/settings/apps',
        icon: null,
    },
    {
        title: 'Connectors',
        href: '/settings/connectors',
        icon: null,
    },
    {
        title: 'WhatsApp',
        href: '/settings/evolution',
        icon: null,
    },
    {
        title: 'Meta',
        href: '/settings/meta',
        icon: null,
    },
    {
        title: 'Channels',
        href: '/settings/channels',
        icon: null,
    },
    {
        title: 'SMS',
        href: '/settings/sms',
        icon: null,
    },
    {
        title: 'Custom attributes',
        href: '/settings/attributes',
        icon: null,
    },
    {
        title: 'Pipelines',
        href: '/settings/pipelines',
        icon: null,
    },
    {
        title: 'Qualify',
        href: '/settings/qualify',
        icon: null,
    },
    {
        title: 'Quotas',
        href: '/settings/quotas',
        icon: null,
    },
    {
        title: 'Record layouts',
        href: '/settings/record-layouts',
        icon: null,
    },
    {
        title: 'Permissions',
        href: '/settings/permissions',
        icon: null,
    },
    {
        title: 'Playbooks',
        href: '/settings/playbooks',
        icon: null,
    },
    {
        title: 'Audit trail',
        href: '/settings/audit',
        icon: null,
    },
    {
        title: 'System health',
        href: '/settings/system-health',
        icon: null,
    },
];

const requiredPermissionByHref: Record<string, string> = {
    '/settings/apps': 'settings.integrations',
    '/settings/connectors': 'settings.integrations',
    '/settings/evolution': 'settings.integrations',
    '/settings/whatsapp': 'settings.integrations',
    '/settings/whatsapp-business': 'settings.integrations',
    '/settings/meta': 'settings.integrations',
    '/settings/channels': 'settings.integrations',
    '/settings/sms': 'settings.integrations',
    '/settings/attributes': 'settings.attributes',
    '/settings/pipelines': 'settings.pipelines',
    '/settings/record-layouts': 'settings.attributes',
};

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const page = usePage<{ auth: Auth }>();
    const { auth } = page.props;

    // People manages workspace members — owner/admin only. The routes 403
    // for members; the nav item simply stays hidden for them.
    const canManageSettings = ['owner', 'admin'].includes(auth.user.role);
    const visibleItems = sidebarNavItems.filter((item) => {
        if (
            ['/settings/permissions', '/settings/system-health', '/settings/audit', '/settings/playbooks', '/settings/qualify', '/settings/quotas'].includes(
                toUrl(item.href),
            )
        ) {
            return canManageSettings;
        }

        const permission = requiredPermissionByHref[toUrl(item.href)];

        return !permission || auth.capabilities.includes(permission);
    });
    const items = canManageSettings
        ? [
              ...visibleItems.slice(0, 3),
              { title: 'People', href: '/settings/people', icon: null },
              ...visibleItems.slice(3),
          ]
        : visibleItems;

    // The People table needs more room than the settings forms.
    const wide =
        page.component === 'settings/people' ||
        page.component === 'settings/attributes' ||
        page.component === 'settings/pipelines' ||
        page.component === 'settings/record-layouts' ||
        page.component === 'settings/connectors' ||
        page.component === 'settings/system-health' ||
        page.component === 'settings/audit' ||
        page.component === 'settings/playbooks' ||
        page.component === 'settings/quotas' ||
        page.component === 'settings/meta' ||
        page.component === 'settings/apps/meta' ||
        page.component === 'settings/sms';

    return (
        <div className="px-4 py-6">
            <header className="mb-8">
                <h1 className="aurora-text-display-2 text-ink">Settings</h1>
                <p className="aurora-text-lead mt-1 max-w-[65ch] text-mute">
                    Workspace profile, the apps marketplace, official connectors,
                    Evolution Cloud, Meta, SMS, and channels
                </p>
            </header>

            <div className="flex flex-col lg:flex-row lg:gap-10">
                <aside className="w-full max-w-xl lg:w-56">
                    <nav
                        className="flex flex-col gap-0.5 rounded-xl border border-hairline bg-canvas p-2"
                        aria-label="Settings"
                    >
                        {items.map((item, index) => (
                            <Button
                                key={`${toUrl(item.href)}-${index}`}
                                size="sm"
                                variant="ghost"
                                asChild
                                className={cn('w-full justify-start', {
                                    'bg-brand/10 text-ink': isCurrentOrParentUrl(
                                        item.href,
                                    ),
                                    'text-mute hover:text-ink':
                                        !isCurrentOrParentUrl(item.href),
                                })}
                            >
                                <Link href={item.href}>
                                    {item.icon && (
                                        <item.icon className="h-4 w-4" />
                                    )}
                                    {item.title}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                </aside>

                <Separator className="my-6 lg:hidden" />

                <div className={cn('flex-1', wide ? '' : 'md:max-w-2xl')}>
                    <section
                        className={cn(
                            'space-y-12',
                            wide ? 'max-w-4xl' : 'max-w-xl',
                        )}
                    >
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}
