import { Head, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { RoomShell, outboundSubTabs, outboundTabs } from '@/components/crm/room-shell';

export function OutboundShell({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    const { url } = usePage();
    const pathname = url.split('?')[0] ?? '/outbound';

    return (
        <>
            <Head title={title} />
            <RoomShell
                title="Outbound"
                tabs={outboundTabs(pathname)}
                subTabs={outboundSubTabs(pathname)}
            >
                <div className="h-full overflow-y-auto">{children}</div>
            </RoomShell>
        </>
    );
}
