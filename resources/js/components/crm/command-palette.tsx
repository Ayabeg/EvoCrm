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
    Search,
    Send,
    SendHorizonal,
    SquareKanban,
    Users,
    Workflow,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
    { label: 'Home', href: '/dashboard', icon: Home, keywords: 'dashboard command center' },
    { label: 'Contacts', href: '/crm/contacts', icon: Users, keywords: 'crm people leads' },
    { label: 'Companies', href: '/crm/companies', icon: Building2, keywords: 'accounts organizations' },
    { label: 'Leads', href: '/crm/leads', icon: SquareKanban, keywords: 'pipeline prospects' },
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

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const [query, setQuery] = useState('');
    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) return NAV_ITEMS;
        return NAV_ITEMS.filter(
            (item) =>
                item.label.toLowerCase().includes(needle) ||
                item.keywords.includes(needle) ||
                item.href.includes(needle),
        );
    }, [query]);

    const runSearch = useCallback(() => {
        const term = query.trim();
        if (!term) return;
        onOpenChange(false);
        router.get('/crm/contacts', { q: term }, { preserveState: true });
    }, [onOpenChange, query]);

    useEffect(() => {
        if (!open) setQuery('');
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="gap-0 overflow-hidden border-hairline bg-canvas p-0 sm:max-w-lg">
                <DialogHeader className="border-b border-hairline px-4 py-3 text-left">
                    <DialogTitle className="text-[15px] font-semibold">Find or Ask</DialogTitle>
                    <DialogDescription className="text-[12px]">
                        Search contacts or jump to any room, list, or report category.
                    </DialogDescription>
                </DialogHeader>
                <div className="border-b border-hairline px-3 py-2">
                    <Input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                if (filtered.length === 1) {
                                    onOpenChange(false);
                                    router.visit(filtered[0].href);
                                    return;
                                }
                                runSearch();
                            }
                        }}
                        placeholder="Search contacts, deals, or navigate…"
                        className="h-9 border-0 bg-canvas-soft text-[13px] shadow-none focus-visible:ring-0"
                    />
                </div>
                <ul className="max-h-72 overflow-y-auto py-1">
                    {filtered.map((item) => {
                        const Icon = item.icon;
                        return (
                            <li key={item.href}>
                                <button
                                    type="button"
                                    className={cn(
                                        'flex w-full items-center gap-3 px-4 py-2 text-left text-[13px] hover:bg-canvas-soft',
                                    )}
                                    onClick={() => {
                                        onOpenChange(false);
                                        router.visit(item.href);
                                    }}
                                >
                                    <Icon className="size-4 text-muted-foreground" />
                                    <span>{item.label}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </DialogContent>
        </Dialog>
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
