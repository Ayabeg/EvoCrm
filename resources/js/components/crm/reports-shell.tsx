import { Head, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { RoomShell } from '@/components/crm/room-shell';
import type { RoomTab } from '@/components/crm/room-shell';

type TabDef = RoomTab & { exact?: boolean; activePaths?: string[] };

function tabActive(pathname: string, tab: TabDef): boolean {
    const extras = tab.activePaths ?? [];

    if (tab.exact) {
        return pathname === tab.href || extras.includes(pathname);
    }

    if (pathname === tab.href) {
        return true;
    }

    if (extras.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
        return true;
    }

    return pathname.startsWith(`${tab.href}/`);
}

const REPORTS_TABS: TabDef[] = [
    {
        label: 'Overview',
        href: '/reports',
        exact: true,
        activePaths: ['/crm/reports'],
    },
    { label: 'Sales', href: '/reports/sales' },
    { label: 'Pipeline', href: '/reports/pipeline' },
    { label: 'Outbound', href: '/reports/outbound' },
    { label: 'Ads', href: '/reports/ads' },
    {
        label: 'Custom',
        href: '/crm/report-builder',
        activePaths: ['/reports/funnels', '/crm/report-builder'],
    },
];

export function reportsTabs(pathname: string): RoomTab[] {
    return REPORTS_TABS.map((tab) => ({
        label: tab.label,
        href: tab.href,
        active: tabActive(pathname, tab),
    }));
}

export function reportsBasePath(activeCategory: string): string {
    return activeCategory === 'overview'
        ? '/reports'
        : `/reports/${activeCategory}`;
}

export function ReportsShell({
    title,
    pageTitle,
    description,
    filters,
    footer,
    hero,
    children,
}: {
    title: string;
    pageTitle?: string;
    description?: string;
    filters?: ReactNode;
    footer?: ReactNode;
    hero?: ReactNode;
    children: ReactNode;
}) {
    const pathname = usePage().url.split('?')[0] ?? '/reports';
    const innerTitle = pageTitle ?? title;
    const showDashboardName = Boolean(innerTitle && innerTitle !== 'Reports');

    return (
        <>
            <Head title={title} />
            <RoomShell title="Reports" tabs={reportsTabs(pathname)}>
                <div className="h-full overflow-y-auto bg-canvas-soft">
                    <div className="px-4 py-3 md:px-5 md:py-4">
                        {hero}
                        <header className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                            <div className="min-w-0">
                                {showDashboardName ? (
                                    <h2 className="text-[13px] font-semibold tracking-tight text-ink">
                                        {innerTitle}
                                    </h2>
                                ) : null}
                                {description ? (
                                    <p className="mt-0.5 max-w-2xl text-[11px] leading-4 text-mute">
                                        {description}
                                    </p>
                                ) : null}
                            </div>
                            {filters ? (
                                <div className="shrink-0">{filters}</div>
                            ) : null}
                        </header>
                        {children}
                        {footer ? (
                            <footer className="mt-4 border-t border-hairline pt-2.5 text-[11px] text-mute">
                                {footer}
                            </footer>
                        ) : null}
                    </div>
                </div>
            </RoomShell>
        </>
    );
}
