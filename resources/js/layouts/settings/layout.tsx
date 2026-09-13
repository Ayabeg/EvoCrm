import { Link, usePage } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useSimpleMode } from '@/hooks/use-simple-mode';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { Auth } from '@/types/auth';

type SettingsNavItem = {
    title: string;
    href: string;
};

type SettingsNavGroup = {
    title: string;
    items: SettingsNavItem[];
};

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

const adminOnlyHrefs = [
    '/settings/permissions',
    '/settings/system-health',
    '/settings/audit',
    '/settings/playbooks',
    '/settings/qualify',
    '/settings/quotas',
];

const wideComponents = new Set([
    'settings/people',
    'settings/attributes',
    'settings/pipelines',
    'settings/record-layouts',
    'settings/connectors',
    'settings/system-health',
    'settings/audit',
    'settings/playbooks',
    'settings/quotas',
    'settings/meta',
    'settings/apps/meta',
    'settings/sms',
    'settings/permissions',
]);

function navGroups(
    canManageSettings: boolean,
    isOwner: boolean,
): SettingsNavGroup[] {
    return [
        {
            title: 'You',
            items: [
                { title: 'Profile', href: toUrl(edit()) },
                { title: 'Security', href: toUrl(editSecurity()) },
                { title: 'Appearance', href: toUrl(editAppearance()) },
            ],
        },
        {
            title: 'Workspace',
            items: [
                ...(isOwner
                    ? [{ title: 'Workspace', href: '/settings/workspace' }]
                    : []),
                ...(canManageSettings
                    ? [{ title: 'People', href: '/settings/people' }]
                    : []),
                { title: 'Meetings', href: '/settings/meetings' },
                { title: 'Get started', href: '/settings/setup' },
            ],
        },
        {
            title: 'Integrations',
            items: [
                { title: 'Apps', href: '/settings/apps' },
                { title: 'Connectors', href: '/settings/connectors' },
                { title: 'WhatsApp', href: '/settings/evolution' },
                { title: 'Meta', href: '/settings/meta' },
                { title: 'Channels', href: '/settings/channels' },
                { title: 'SMS', href: '/settings/sms' },
            ],
        },
        {
            title: 'CRM',
            items: [
                { title: 'Custom attributes', href: '/settings/attributes' },
                { title: 'Pipelines', href: '/settings/pipelines' },
                { title: 'Qualify', href: '/settings/qualify' },
                { title: 'Quotas', href: '/settings/quotas' },
                { title: 'Record layouts', href: '/settings/record-layouts' },
                { title: 'Playbooks', href: '/settings/playbooks' },
            ],
        },
        {
            title: 'Admin',
            items: [
                { title: 'Permissions', href: '/settings/permissions' },
                { title: 'Audit trail', href: '/settings/audit' },
                { title: 'System health', href: '/settings/system-health' },
            ],
        },
    ];
}

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentUrl, isCurrentOrParentUrl } = useCurrentUrl();
    const page = usePage<{ auth: Auth }>();
    const { auth } = page.props;
    const { features } = useSimpleMode();

    const canManageSettings = ['owner', 'admin'].includes(auth.user.role);
    const isOwner = auth.user.role === 'owner';
    const groups = navGroups(canManageSettings, isOwner)
        .map((group) => ({
            ...group,
            items: group.items.filter((item) => {
                if (item.href === '/settings/sms' && !features.sms) {
                    return false;
                }

                if (adminOnlyHrefs.includes(item.href)) {
                    return canManageSettings;
                }

                const permission = requiredPermissionByHref[item.href];

                return !permission || auth.capabilities.includes(permission);
            }),
        }))
        .filter((group) => group.items.length > 0);

    const wide = wideComponents.has(page.component);

    return (
        <div
            data-settings="workspace"
            className="flex min-h-full flex-col bg-[#eaeaea] lg:flex-row"
        >
            <aside
                data-settings="nav"
                className="shrink-0 border-b border-hairline bg-[#eaeaea] lg:w-[15.5rem] lg:border-r lg:border-b-0"
            >
                <div className="px-3 pt-3 pb-1">
                    <p className="text-[11px] font-semibold tracking-wide text-mute uppercase">
                        Settings
                    </p>
                </div>
                <nav
                    aria-label="Settings"
                    className="flex gap-4 overflow-x-auto px-2 pb-2 lg:flex-col lg:gap-3 lg:overflow-visible lg:px-2 lg:pb-4"
                >
                    {groups.map((group) => (
                        <div key={group.title} className="min-w-[10rem]">
                            <p className="px-2 pt-1 pb-0.5 text-[11px] font-medium text-mute">
                                {group.title}
                            </p>
                            <ul className="flex flex-col">
                                {group.items.map((item) => {
                                    const active =
                                        isCurrentUrl(item.href) ||
                                        (item.href !== toUrl(edit()) &&
                                            isCurrentOrParentUrl(item.href));

                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                aria-current={
                                                    active ? 'page' : undefined
                                                }
                                                className={cn(
                                                    'flex h-7 items-center border-l-2 px-2 text-[13px] leading-none transition-colors',
                                                    active
                                                        ? 'border-[#d9500f] bg-[rgba(217,80,15,0.1)] font-medium text-ink'
                                                        : 'border-transparent text-mute hover:bg-white/70 hover:text-ink',
                                                )}
                                            >
                                                {item.title}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>
            </aside>

            <div
                data-settings="pane"
                className={cn(
                    'min-w-0 flex-1 px-4 py-4 lg:px-6 lg:py-5',
                    wide ? '' : 'lg:max-w-3xl',
                )}
            >
                {children}
            </div>
        </div>
    );
}
