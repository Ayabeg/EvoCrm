import { Head, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';

import { RoomShell } from '@/components/crm/room-shell';
import type { RoomTab } from '@/components/crm/room-shell';
import { t } from '@/lib/i18n';

type TabDef = RoomTab & { exact?: boolean; activePaths?: string[] };

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

const ADS_TABS: TabDef[] = [
    { label: 'Overview', href: '/ads', exact: true },
    { label: 'Attribution', href: '/ads/attribution', exact: true },
    { label: 'Audiences', href: '/ads/audiences', exact: true },
    { label: 'Campaigns', href: '/ads/campaigns', activePaths: ['/ads/campaigns'] },
    { label: 'Ad sets', href: '/ads/ad-sets' },
    { label: 'Ads', href: '/ads/ads' },
];

export function AdsShell({
    title,
    children,
    actions,
}: {
    title: string;
    children: ReactNode;
    actions?: ReactNode;
}) {
    const pathname = usePage().url.split('?')[0] ?? '/ads';
    const tabs = ADS_TABS.map((tab) => ({
        label: tab.label,
        href: tab.href,
        active: tabActive(pathname, tab),
    }));

    return (
        <>
            <Head title={t(title)} />
            <RoomShell title="Ads" tabs={tabs} actions={actions}>
                <div className="h-full overflow-y-auto bg-[var(--evo-canvas)]">{children}</div>
            </RoomShell>
        </>
    );
}

export function AdsPageHeader({
    title,
    description,
    actions,
}: {
    title: string;
    description?: ReactNode;
    actions?: ReactNode;
}) {
    return (
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
                <h1 className="text-[20px] font-semibold tracking-tight text-[var(--evo-ink)]">
                    {t(title)}
                </h1>
                {description ? (
                    <p className="mt-1 text-[13px] text-[var(--evo-ink-secondary)]">
                        {typeof description === 'string' ? t(description) : description}
                    </p>
                ) : null}
            </div>
            {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
    );
}
