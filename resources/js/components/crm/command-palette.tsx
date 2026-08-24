import { router } from '@inertiajs/react';
import { Building2, Handshake, Home, Inbox, Megaphone, Search, Send, Users } from 'lucide-react';
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
    { label: 'Deals', href: '/crm/deals', icon: Handshake, keywords: 'pipeline opportunities' },
    { label: 'Desk', href: '/inbox', icon: Inbox, keywords: 'inbox conversations evodesk' },
    { label: 'Outbound', href: '/outbound', icon: Send, keywords: 'email sequences campaigns' },
    { label: 'Ads', href: '/ads', icon: Megaphone, keywords: 'meta facebook instagram' },
    { label: 'Reports', href: '/reports', icon: Search, keywords: 'analytics funnels' },
];

export function CommandPalette({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) {
            return NAV_ITEMS;
        }

        return NAV_ITEMS.filter(
            (item) =>
                item.label.toLowerCase().includes(needle) ||
                item.keywords.includes(needle) ||
                item.href.includes(needle),
        );
    }, [query]);

    const runSearch = useCallback(() => {
        const term = query.trim();
        if (!term) {
            return;
        }

        onOpenChange(false);
        router.get('/crm/contacts', { q: term }, { preserveState: true });
    }, [onOpenChange, query]);

    useEffect(() => {
        if (!open) {
            setQuery('');
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="gap-0 overflow-hidden border-hairline bg-canvas p-0 sm:max-w-lg">
                <DialogHeader className="border-b border-hairline px-4 py-3 text-left">
                    <DialogTitle className="text-[15px] font-semibold">Find or Ask</DialogTitle>
                    <DialogDescription className="text-[12px]">
                        Search contacts or jump to a room. Ask Evo opens from any record.
                    </DialogDescription>
                </DialogHeader>
                <div className="border-b border-hairline px-3 py-2">
                    <Input
                        autoFocus
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
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
                    {query.trim() ? (
                        <li>
                            <button
                                type="button"
                                className="flex w-full items-center gap-3 px-4 py-2 text-left text-[13px] text-brand hover:bg-canvas-soft"
                                onClick={runSearch}
                            >
                                <Search className="size-4" />
                                Search contacts for &ldquo;{query.trim()}&rdquo;
                            </button>
                        </li>
                    ) : null}
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
