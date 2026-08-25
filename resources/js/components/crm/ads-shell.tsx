import { Head, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { RoomShell, type RoomTab } from '@/components/crm/room-shell';

type TabDef = RoomTab & { exact?: boolean; activePaths?: string[] };
function tabActive(pathname: string, tab: TabDef): boolean {
    const extras = tab.activePaths ?? [];
    if (tab.exact) return pathname === tab.href || extras.includes(pathname);
    if (pathname === tab.href) return true;
    if (extras.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true;
    return pathname.startsWith(`${tab.href}/`);
}
const ADS_TABS: TabDef[] = [
    { label: 'Overview', href: '/ads', exact: true },
    { label: 'Campaigns', href: '/ads/campaigns', activePaths: ['/ads/campaigns'] },
    { label: 'Ad sets', href: '/ads/ad-sets' },
    { label: 'Ads', href: '/ads/ads' },
];
export function AdsShell({ title, children }: { title: string; children: ReactNode }) {
    const pathname = usePage().url.split('?')[0] ?? '/ads';
    const tabs = ADS_TABS.map((tab) => ({ label: tab.label, href: tab.href, active: tabActive(pathname, tab) }));
    return (<><Head title={title} /><RoomShell title="Ads" tabs={tabs}><div className="h-full overflow-y-auto">{children}</div></RoomShell></>);
}
