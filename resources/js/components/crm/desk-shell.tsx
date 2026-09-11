import { Head, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { RoomShell } from '@/components/crm/room-shell';
import type { RoomTab } from '@/components/crm/room-shell';

const DESK_TABS: Array<RoomTab & { match?: (pathname: string) => boolean }> = [
    {
        label: 'Inbox',
        href: '/inbox',
        match: (pathname) => pathname === '/inbox' || pathname.startsWith('/desk/'),
    },
    {
        label: 'Conversations',
        href: '/conversations',
        match: (pathname) =>
            pathname === '/conversations' || pathname.startsWith('/conversations/'),
    },
    {
        label: 'Tickets',
        href: '/crm/tickets',
        match: (pathname) =>
            pathname === '/crm/tickets' || pathname.startsWith('/crm/tickets/'),
    },
    {
        label: 'Channels',
        href: '/settings/channels',
        match: (pathname) =>
            pathname === '/settings/channels' || pathname.startsWith('/settings/channels/'),
    },
];

export function deskTabs(pathname: string): RoomTab[] {
    return DESK_TABS.map(({ label, href, match }) => ({
        label,
        href,
        active: match ? match(pathname) : pathname === href || pathname.startsWith(`${href}/`),
    }));
}

export function DeskShell({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    const { url } = usePage();
    const pathname = url.split('?')[0] ?? '/inbox';

    return (
        <>
            <Head title={title} />
            <RoomShell title="Desk" tabs={deskTabs(pathname)}>
                <div className="h-full overflow-hidden">{children}</div>
            </RoomShell>
        </>
    );
}
