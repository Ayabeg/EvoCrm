import { Head, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { RoomShell } from '@/components/crm/room-shell';
import type { RoomTab } from '@/components/crm/room-shell';

const CRM_TABS: Array<RoomTab & { match?: (pathname: string) => boolean }> = [
    {
        label: 'Contacts',
        href: '/crm/contacts',
        match: (pathname) =>
            pathname === '/crm/contacts' || pathname.startsWith('/crm/contacts/'),
    },
    {
        label: 'Companies',
        href: '/crm/companies',
        match: (pathname) =>
            pathname === '/crm/companies' || pathname.startsWith('/crm/companies/'),
    },
    {
        label: 'Leads list',
        href: '/crm/leads',
        match: (pathname) =>
            (pathname === '/crm/leads' || pathname.startsWith('/crm/leads/')) &&
            !pathname.startsWith('/crm/leads/captures'),
    },
    {
        label: 'Captures',
        href: '/crm/leads/captures',
        match: (pathname) => pathname.startsWith('/crm/leads/captures'),
    },
    {
        label: 'Deals',
        href: '/crm/deals',
        match: (pathname) =>
            (pathname === '/crm/deals' || pathname.startsWith('/crm/deals/')) &&
            !pathname.startsWith('/crm/deals/board'),
    },
    {
        label: 'Activities',
        href: '/crm/activities',
        match: (pathname) =>
            pathname === '/crm/activities' ||
            pathname.startsWith('/crm/activities/'),
    },
    {
        label: 'Pipeline',
        href: '/crm/deals/board',
        match: (pathname) =>
            pathname === '/crm/deals/board' || pathname.startsWith('/crm/deals/board/'),
    },
    {
        label: 'Automation',
        href: '/crm/workflows',
        match: (pathname) =>
            pathname === '/crm/workflows' || pathname.startsWith('/crm/workflows/'),
    },
];

export function crmTabs(pathname: string): RoomTab[] {
    return CRM_TABS.map(({ label, href, match }) => ({
        label,
        href,
        active: match ? match(pathname) : pathname === href || pathname.startsWith(`${href}/`),
    }));
}

export function CrmShell({
    title,
    children,
    chrome = 'room',
}: {
    title: string;
    children: ReactNode;
    chrome?: 'room' | 'workspace';
}) {
    const { url } = usePage();
    const pathname = url.split('?')[0] ?? '/crm/contacts';

    if (chrome === 'workspace') {
        return (
            <>
                <Head title={title} />
                <div className="flex h-app-workspace flex-col bg-canvas-soft text-[13px] text-ink">
                    {children}
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={title} />
            <RoomShell title="CRM" tabs={crmTabs(pathname)}>
                <div className="h-full overflow-hidden">{children}</div>
            </RoomShell>
        </>
    );
}
