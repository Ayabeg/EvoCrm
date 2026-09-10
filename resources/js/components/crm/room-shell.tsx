import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type RoomTab = {
    label: string;
    href: string;
    active?: boolean;
};

type TabDef = RoomTab & {
    exact?: boolean;
    activePaths?: string[];
};

function tabActive(pathname: string, tab: TabDef): boolean {
    const extras = tab.activePaths ?? [];

    if (tab.exact) {
        return pathname === tab.href || extras.includes(pathname);
    }

    if (pathname === tab.href) {
        return true;
    }

    if (extras.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
        return true;
    }

    return pathname.startsWith(`${tab.href}/`);
}

function mapTabs(pathname: string, defs: TabDef[]): RoomTab[] {
    return defs.map((tab) => ({
        label: tab.label,
        href: tab.href,
        active: tabActive(pathname, tab),
    }));
}

export function RoomShell({
    title,
    tabs,
    subTabs,
    children,
    actions,
}: {
    title: string;
    tabs: RoomTab[];
    subTabs?: RoomTab[];
    children: ReactNode;
    actions?: ReactNode;
}) {
    return (
        <div className="flex h-app-workspace flex-col bg-canvas-soft text-[13px] text-ink">
            <div className="sticky top-0 z-10 border-b border-hairline bg-canvas px-4 pt-3 sm:px-6">
                <div className="flex items-end justify-between gap-3">
                    <h1 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h1>
                    {actions}
                </div>
                <nav className="mt-2 flex gap-0 overflow-x-auto" aria-label={`${title} sections`}>
                    {tabs.map((tab) => (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={cn(
                                'border-b-2 px-3 pb-2 text-[13px] whitespace-nowrap transition-colors',
                                tab.active
                                    ? 'border-[var(--evosales-mark)] font-medium text-ink'
                                    : 'border-transparent text-mute hover:text-ink',
                            )}
                        >
                            {tab.label}
                        </Link>
                    ))}
                </nav>
                {subTabs && subTabs.length > 0 ? (
                    <nav className="mt-0 flex gap-1 overflow-x-auto border-t border-hairline pt-2 pb-2">
                        {subTabs.map((tab) => (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={cn(
                                    'rounded-full px-2.5 py-1 text-[12px] whitespace-nowrap',
                                    tab.active
                                        ? 'bg-ink font-medium text-canvas'
                                        : 'text-mute hover:bg-canvas-soft hover:text-ink',
                                )}
                            >
                                {tab.label}
                            </Link>
                        ))}
                    </nav>
                ) : null}
            </div>
            <div className="min-h-0 flex-1 overflow-hidden bg-canvas">{children}</div>
        </div>
    );
}

const OUTBOUND_PRIMARY: TabDef[] = [
    { label: 'Overview', href: '/outbound', exact: true },
    { label: 'Campaigns', href: '/outbound/campaigns' },
    { label: 'Sequences', href: '/outbound/sequences' },
    { label: 'Templates', href: '/outbound/templates' },
    { label: 'Lists', href: '/outbound/lists' },
    {
        label: 'Activity',
        href: '/outbound/outbox',
        activePaths: ['/outbound/outbox', '/outbound/replies'],
    },
    {
        label: 'Settings',
        href: '/outbound/mailboxes',
        activePaths: [
            '/outbound/mailboxes',
            '/outbound/domains',
            '/outbound/warmup',
            '/outbound/suppressions',
            '/outbound/quiet-hours',
        ],
    },
];

const OUTBOUND_ACTIVITY_SUB: TabDef[] = [
    { label: 'Outbox', href: '/outbound/outbox' },
    { label: 'Replies', href: '/outbound/replies' },
];

const OUTBOUND_SETTINGS_SUB: TabDef[] = [
    { label: 'Mailboxes', href: '/outbound/mailboxes' },
    { label: 'Domains', href: '/outbound/domains' },
    { label: 'Warmup', href: '/outbound/warmup' },
    { label: 'Suppressions', href: '/outbound/suppressions' },
    { label: 'Quiet hours', href: '/outbound/quiet-hours' },
];

const ACTIVITY_PATHS = ['/outbound/outbox', '/outbound/replies'];
const SETTINGS_PATHS = [
    '/outbound/mailboxes',
    '/outbound/domains',
    '/outbound/warmup',
    '/outbound/suppressions',
    '/outbound/quiet-hours',
];

function matchesAny(pathname: string, paths: string[]): boolean {
    return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function outboundTabs(pathname: string): RoomTab[] {
    return mapTabs(pathname, OUTBOUND_PRIMARY);
}

export function outboundSubTabs(pathname: string): RoomTab[] | undefined {
    if (matchesAny(pathname, ACTIVITY_PATHS)) {
        return mapTabs(pathname, OUTBOUND_ACTIVITY_SUB);
    }

    if (matchesAny(pathname, SETTINGS_PATHS)) {
        return mapTabs(pathname, OUTBOUND_SETTINGS_SUB);
    }

    return undefined;
}
