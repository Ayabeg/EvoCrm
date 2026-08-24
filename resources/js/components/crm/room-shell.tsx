import type { ReactNode } from 'react';
import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

export type RoomTab = {
    label: string;
    href: string;
    active?: boolean;
};

export function RoomShell({
    title,
    tabs,
    children,
    actions,
}: {
    title: string;
    tabs: RoomTab[];
    children: ReactNode;
    actions?: ReactNode;
}) {
    return (
        <div className="flex h-[calc(100vh-52px)] flex-col bg-canvas text-[13px] text-ink">
            <div className="border-b border-hairline bg-canvas px-6 pt-4">
                <div className="flex items-center justify-between gap-3">
                    <h1 className="text-[22px] font-semibold tracking-tight">{title}</h1>
                    {actions}
                </div>
                <nav className="mt-3 flex gap-4 overflow-x-auto">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={cn(
                                'border-b-2 pb-2 text-[13px] whitespace-nowrap',
                                tab.active
                                    ? 'border-brand font-medium text-ink'
                                    : 'border-transparent text-muted-foreground hover:text-ink',
                            )}
                        >
                            {tab.label}
                        </Link>
                    ))}
                </nav>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
        </div>
    );
}

export const OUTBOUND_TABS: RoomTab[] = [
    { label: 'Hub', href: '/outbound' },
    { label: 'Mailboxes', href: '/outbound/mailboxes' },
    { label: 'Domains', href: '/outbound/domains' },
    { label: 'Templates', href: '/outbound/templates' },
    { label: 'Sequences', href: '/outbound/sequences' },
    { label: 'Campaigns', href: '/outbound/campaigns' },
    { label: 'Outbox', href: '/outbound/outbox' },
    { label: 'Replies', href: '/outbound/replies' },
    { label: 'Warmup', href: '/outbound/warmup' },
    { label: 'Suppressions', href: '/outbound/suppressions' },
    { label: 'Quiet hours', href: '/outbound/quiet-hours' },
];

export function outboundTabs(pathname: string): RoomTab[] {
    return OUTBOUND_TABS.map((tab) => ({
        ...tab,
        active: pathname === tab.href || pathname.startsWith(`${tab.href}/`),
    }));
}
