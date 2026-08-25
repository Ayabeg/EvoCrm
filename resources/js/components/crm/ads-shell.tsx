import { Head, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { RoomShell, type RoomTab } from '@/components/crm/room-shell';

const ADS_TABS: Array<RoomTab & { match?: (pathname: string) => boolean }> = [
    {
        label: 'Overview',
        href: '/ads',
        match: (pathname) => pathname === '/ads' || pathname.startsWith('/ads/'),
    },
];

export function adsTabs(pathname: string): RoomTab[] {
    return ADS_TABS.map(({ label, href, match }) => ({
        label,
        href,
        active: match ? match(pathname) : pathname === href || pathname.startsWith(`${href}/`),
    }));
}

export function AdsShell({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    const { url } = usePage();
    const pathname = url.split('?')[0] ?? '/ads';

    return (
        <>
            <Head title={title} />
            <RoomShell title="Ads" tabs={adsTabs(pathname)}>
                <div className="h-full overflow-y-auto">{children}</div>
            </RoomShell>
        </>
    );
}
