import { router } from '@inertiajs/react';
import {
    Bolt,
    Building2,
    ChartSpline,
    Handshake,
    Home,
    Inbox,
    LibraryBig,
    Megaphone,
    MessageCircle,
    PenLine,
    Send,
    SendHorizonal,
    SquareKanban,
    Ticket,
    Users,
    Workflow,
} from 'lucide-react';
import { useEffect, useMemo } from 'react';
import {
    CommandPalette as AuroraCommandPalette
    
} from '@/components/aurora/command-palette';
import type {CommandItem} from '@/components/aurora/command-palette';

const NAV_ITEMS = [
    { label: 'Home', href: '/dashboard', icon: Home, keywords: 'dashboard command center' },
    { label: 'Contacts', href: '/crm/contacts', icon: Users, keywords: 'crm people leads' },
    { label: 'Companies', href: '/crm/companies', icon: Building2, keywords: 'accounts organizations' },
    { label: 'Leads', href: '/crm/leads', icon: SquareKanban, keywords: 'pipeline prospects' },
    { label: 'Tickets', href: '/crm/tickets', icon: Ticket, keywords: 'help desk support cases whatsapp' },
    { label: 'Captures', href: '/crm/leads/captures', icon: Inbox, keywords: 'inbox capture csv meta maps url' },
    { label: 'Deals', href: '/crm/deals', icon: Handshake, keywords: 'pipeline opportunities' },
    { label: 'Pipelines', href: '/crm/deals/board', icon: SquareKanban, keywords: 'kanban board stages' },
    { label: 'Segments', href: '/crm/segments', icon: Users, keywords: 'saved views audiences filters' },
    { label: 'Automation', href: '/crm/workflows', icon: Workflow, keywords: 'workflows triggers' },
    { label: 'Conversations', href: '/conversations', icon: MessageCircle, keywords: 'crm activities history' },
    { label: 'Desk', href: '/inbox', icon: Inbox, keywords: 'inbox conversations evodesk' },
    { label: 'Outbound', href: '/outbound', icon: Send, keywords: 'email sequences campaigns' },
    { label: 'Prospects', href: '/crm/contacts?status=new', icon: Users, keywords: 'outbound new leads' },
    { label: 'Outbound campaigns', href: '/outbound/campaigns', icon: SendHorizonal, keywords: 'newsletter broadcast' },
    { label: 'Sequences', href: '/outbound/sequences', icon: Bolt, keywords: 'drip enrollments' },
    { label: 'Outbox', href: '/outbound/outbox', icon: Send, keywords: 'sent mail activity' },
    { label: 'Replies', href: '/outbound/replies', icon: MessageCircle, keywords: 'inbound email' },
    { label: 'Ads', href: '/ads', icon: Megaphone, keywords: 'meta facebook instagram' },
    { label: 'Ads attribution', href: '/ads/attribution', icon: Megaphone, keywords: 'funnel spend deals won' },
    { label: 'Ads audiences', href: '/ads/audiences', icon: Users, keywords: 'meta custom audience segments' },
    { label: 'Reports', href: '/reports', icon: ChartSpline, keywords: 'analytics overview' },
    { label: 'Conversion funnels', href: '/reports/funnels', icon: ChartSpline, keywords: 'reports funnels' },
    { label: 'Report builder', href: '/crm/report-builder', icon: PenLine, keywords: 'custom reports saved' },
    { label: 'Outbound reports', href: '/outbound/reports', icon: LibraryBig, keywords: 'email performance' },
];

export function CommandPalette({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const items = useMemo<CommandItem[]>(
        () =>
            NAV_ITEMS.map((item) => {
                const Icon = item.icon;

                return {
                    id: item.href,
                    label: item.label,
                    description: item.keywords,
                    section: 'navigate',
                    icon: <Icon className="size-3.5" strokeWidth={1.65} aria-hidden />,
                    onSelect: () => {
                        onOpenChange(false);
                        router.visit(item.href);
                    },
                };
            }),
        [onOpenChange],
    );

    return (
        <AuroraCommandPalette
            open={open}
            onOpenChange={onOpenChange}
            items={items}
            sections={[{ id: 'navigate', label: 'Navigate' }]}
            placeholder="Find a page"
            filter={(query, item) => {
                const needle = query.trim().toLowerCase();

                if (!needle) {
return 1;
}

                const hay = `${item.label} ${item.description ?? ''}`.toLowerCase();

                return hay.includes(needle) ? 1 : 0;
            }}
            onSelect={(item) => item.onSelect?.()}
        />
    );
}

export function useCommandPaletteShortcut(onOpen: () => void) {
    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                onOpen();
            }
        };
        window.addEventListener('keydown', handler);

        return () => window.removeEventListener('keydown', handler);
    }, [onOpen]);
}
