import { Head, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { RoomShell, type RoomTab } from '@/components/crm/room-shell';

const REPORTS_TABS: Array<RoomTab & { match?: (pathname: string) => boolean }> = [
    {
        label: 'Overview',
        href: '/reports',
        match: (pathname) =>
            pathname === '/reports' ||
            pathname === '/crm/reports' ||
            pathname.startsWith('/crm/reports/'),
    },
    {
        label: 'Funnels',
        href: '/reports/funnels',
        match: (pathname) =>
            pathname === '/reports/funnels' || pathname.startsWith('/reports/funnels/'),
    },
    {
        label: 'Report builder',
        href: '/crm/report-builder',
        match: (pathname) =>
            pathname === '/crm/report-builder' || pathname.startsWith('/crm/report-builder/'),
    },
];

export function reportsTabs(pathname: string): RoomTab[] {
    return REPORTS_TABS.map(({ label, href, match }) => ({
        label,
        href,
        active: match ? match(pathname) : pathname === href || pathname.startsWith(`${href}/`),
    }));
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
    const { url } = usePage();
    const pathname = url.split('?')[0] ?? '/reports';

    return (
        <>
            <Head title={title} />
            <RoomShell title="Reports" tabs={reportsTabs(pathname)}>
                <div className="h-full overflow-y-auto">
                    <div className="mx-auto w-full max-w-7xl px-5 py-8">
                        {hero}
                        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <h2 className="text-page-title font-semibold tracking-tight">
                                    {pageTitle ?? title}
                                </h2>
                                {description ? (
                                    <p className="mt-1 text-[13px] text-muted-foreground">
                                        {description}
                                    </p>
                                ) : null}
                            </div>
                            {filters ? <div className="shrink-0">{filters}</div> : null}
                        </header>
                        {children}
                        {footer ? (
                            <footer className="mt-10 border-t border-hairline pt-4 text-[11px] text-muted-foreground">
                                {footer}
                            </footer>
                        ) : null}
                    </div>
                </div>
            </RoomShell>
        </>
    );
}
