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
        <div className="space-y-4 px-4 py-3 md:px-5 md:py-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                    <h2 className="text-[13px] font-semibold tracking-tight text-ink">
                        {title}
                    </h2>
                    {description ? (
                        <p className="mt-0.5 max-w-[65ch] text-[11px] leading-4 text-mute">
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
