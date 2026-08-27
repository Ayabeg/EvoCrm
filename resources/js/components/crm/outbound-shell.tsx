import { Head, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import {
    RoomShell,
    outboundSubTabs,
    outboundTabs,
} from '@/components/crm/room-shell';

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

export function OutboundPage({
    title,
    description,
    actions,
    children,
}: {
    title: string;
    description?: string;
    actions?: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 md:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="aurora-text-section text-ink">{title}</h2>
                    {description ? (
                        <p className="aurora-text-body-sm mt-1 max-w-[65ch] text-mute">
                            {description}
                        </p>
                    ) : null}
                </div>
                {actions}
            </div>
            {children}
        </div>
    );
}
