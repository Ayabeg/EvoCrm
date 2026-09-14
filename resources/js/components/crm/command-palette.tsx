import { router, usePage } from '@inertiajs/react';
import {
    AddressBook,
    Books,
    Buildings,
    ChartLine,
    ChatCircle,
    CheckSquare,
    FlowArrow,
    Handshake,
    House,
    Lightning,
    Megaphone,
    PaperPlaneRight,
    PaperPlaneTilt,
    Path,
    PencilSimple,
    SquaresFour,
    Ticket,
    Tray,
    UsersThree,
} from '@phosphor-icons/react';
import { useEffect, useMemo } from 'react';
import {
    CommandPalette as AuroraCommandPalette,
} from '@/components/aurora/command-palette';
import type { CommandItem } from '@/components/aurora/command-palette';

type SearchHit = {
    type: string;
    label: string;
    hint?: string | null;
    href: string;
};

const NAV_ITEMS = [
    { label: 'Home', href: '/home', icon: House, keywords: 'dashboard command center' },
    { label: 'Contacts', href: '/crm/contacts', icon: AddressBook, keywords: 'crm people leads' },
    { label: 'Companies', href: '/crm/companies', icon: Buildings, keywords: 'accounts organizations' },
    { label: 'Leads', href: '/crm/leads', icon: Path, keywords: 'pipeline prospects' },
    { label: 'Tickets', href: '/crm/tickets', icon: Ticket, keywords: 'help desk support cases whatsapp' },
    { label: 'Captures', href: '/crm/leads/captures', icon: Tray, keywords: 'inbox capture csv meta maps url' },
    { label: 'Deals', href: '/crm/deals', icon: Handshake, keywords: 'pipeline opportunities' },
    { label: 'Pipelines', href: '/crm/deals/board', icon: SquaresFour, keywords: 'kanban board stages' },
    { label: 'Activities', href: '/crm/activities', icon: CheckSquare, keywords: 'tasks calls meetings' },
    { label: 'Segments', href: '/crm/segments', icon: UsersThree, keywords: 'saved views audiences filters' },
    { label: 'Automation', href: '/crm/workflows', icon: FlowArrow, keywords: 'workflows triggers' },
    { label: 'Conversations', href: '/conversations', icon: ChatCircle, keywords: 'crm activities history' },
    { label: 'Desk', href: '/inbox', icon: Tray, keywords: 'inbox conversations evodesk' },
    { label: 'Outbound', href: '/outbound', icon: PaperPlaneTilt, keywords: 'email sequences campaigns' },
    { label: 'Prospects', href: '/crm/contacts?status=new', icon: AddressBook, keywords: 'outbound new leads' },
    { label: 'Outbound campaigns', href: '/outbound/campaigns', icon: PaperPlaneRight, keywords: 'newsletter broadcast' },
    { label: 'Sequences', href: '/outbound/sequences', icon: Lightning, keywords: 'drip enrollments' },
    { label: 'Outbox', href: '/outbound/outbox', icon: PaperPlaneTilt, keywords: 'sent mail activity' },
    { label: 'Replies', href: '/outbound/replies', icon: ChatCircle, keywords: 'inbound email' },
    { label: 'Ads', href: '/ads', icon: Megaphone, keywords: 'meta facebook instagram' },
    { label: 'Ads attribution', href: '/ads/attribution', icon: Megaphone, keywords: 'funnel spend deals won' },
    { label: 'Ads audiences', href: '/ads/audiences', icon: UsersThree, keywords: 'meta custom audience segments' },
    { label: 'Reports', href: '/reports', icon: ChartLine, keywords: 'analytics overview' },
    { label: 'Conversion funnels', href: '/reports/funnels', icon: ChartLine, keywords: 'reports funnels' },
    { label: 'Report builder', href: '/crm/report-builder', icon: PencilSimple, keywords: 'custom reports saved' },
    { label: 'Outbound reports', href: '/outbound/reports', icon: Books, keywords: 'email performance' },
];

export function CommandPalette({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const records = ((usePage().props.evoSearchIndex as SearchHit[] | undefined) ?? []);

    const items = useMemo<CommandItem[]>(() => {
        const nav = NAV_ITEMS.map((item) => {
            const Icon = item.icon;

            return {
                id: item.href,
                label: item.label,
                description: item.keywords,
                section: 'navigate',
                icon: <Icon className="size-3.5" weight="regular" aria-hidden />,
                onSelect: () => {
                    onOpenChange(false);
                    router.visit(item.href);
                },
            };
        });

        const hits = records.map((hit) => ({
            id: hit.href,
            label: hit.label,
            description: [hit.type, hit.hint].filter(Boolean).join(' · '),
            section: 'records',
            onSelect: () => {
                onOpenChange(false);
                router.visit(hit.href);
            },
        }));

        return [...hits, ...nav];
    }, [onOpenChange, records]);

    return (
        <AuroraCommandPalette
            open={open}
            onOpenChange={onOpenChange}
            items={items}
            sections={[
                { id: 'records', label: 'Records' },
                { id: 'navigate', label: 'Navigate' },
            ]}
            placeholder="Find a record or page"
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
