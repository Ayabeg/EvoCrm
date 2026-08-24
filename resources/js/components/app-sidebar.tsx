import { Link, usePage } from '@inertiajs/react';
import {
    Bell,
    Bolt,
    Building2,
    ChartSpline,
    ChevronLeft,
    Contact,
    Facebook,
    Flame,
    Globe,
    Handshake,
    House,
    Inbox,
    Instagram,
    LayoutGrid,
    LibraryBig,
    Mail,
    Mailbox,
    Megaphone,
    MessageCircle,
    MoonStar,
    MoreHorizontal,
    PenLine,
    Pin,
    PinOff,
    Send,
    SendHorizonal,
    Settings,
    ShieldOff,
    SquareKanban,
    Users,
    Workflow,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Sidebar, useSidebar } from '@/components/ui/sidebar';
import { DEFAULT_PINNED, readPins, togglePin } from '@/lib/nav-pins';
import { cn } from '@/lib/utils';

export type NavLeaf = {
    id: string;
    label: string;
    href: string;
    icon: LucideIcon;
    activePaths?: string[];
    exact?: boolean;
};

type MoreItem = NavLeaf & { category: string };

const PRIMARY: NavLeaf[] = [
    { id: 'home', label: 'Home', href: '/dashboard', icon: House, activePaths: ['/'] },
    { id: 'contacts', label: 'Contacts', href: '/crm/contacts', icon: Contact },
    { id: 'companies', label: 'Companies', href: '/crm/companies', icon: Building2 },
    { id: 'deals', label: 'Deals', href: '/crm/deals', icon: Handshake },
    { id: 'desk', label: 'Desk', href: '/inbox', icon: Inbox, activePaths: ['/desk'] },
    { id: 'outbound', label: 'Outbound', href: '/outbound', icon: Send, exact: true },
    { id: 'ads', label: 'Ads', href: '/ads', icon: Megaphone },
    { id: 'segments', label: 'Segments', href: '/crm/segments', icon: Users },
    { id: 'reports', label: 'Reports', href: '/reports', icon: ChartSpline, activePaths: ['/crm/reports'] },
];

const MORE_ITEMS: MoreItem[] = [
    { id: 'contacts', label: 'Contacts', href: '/crm/contacts', icon: Contact, category: 'CRM' },
    { id: 'companies', label: 'Companies', href: '/crm/companies', icon: Building2, category: 'CRM' },
    { id: 'deals', label: 'Deals', href: '/crm/deals', icon: Handshake, category: 'CRM' },
    { id: 'leads', label: 'Leads', href: '/leads', icon: SquareKanban, category: 'CRM' },
    { id: 'crm-leads', label: 'CRM Leads', href: '/crm/leads', icon: SquareKanban, category: 'CRM' },
    { id: 'workflows', label: 'Automation', href: '/crm/workflows', icon: Workflow, category: 'CRM' },
    { id: 'home', label: 'Home', href: '/dashboard', icon: House, category: 'Sales' },
    { id: 'desk', label: 'Desk', href: '/inbox', icon: Inbox, category: 'Desk' },
    { id: 'conversations', label: 'Conversations', href: '/conversations', icon: MessageCircle, category: 'Desk' },
    { id: 'outbound', label: 'Outbound', href: '/outbound', icon: Send, category: 'Outbound' },
    { id: 'outbound-mailboxes', label: 'Mailboxes', href: '/outbound/mailboxes', icon: Mailbox, category: 'Outbound' },
    { id: 'outbound-warmup', label: 'Warmup', href: '/outbound/warmup', icon: Flame, category: 'Outbound' },
    { id: 'outbound-domains', label: 'Domains', href: '/outbound/domains', icon: Globe, category: 'Outbound' },
    { id: 'outbound-templates', label: 'Templates', href: '/outbound/templates', icon: Mail, category: 'Outbound' },
    { id: 'outbound-campaigns', label: 'Campaigns', href: '/outbound/campaigns', icon: SendHorizonal, category: 'Outbound' },
    { id: 'outbound-sequences', label: 'Sequences', href: '/outbound/sequences', icon: Bolt, category: 'Outbound' },
    { id: 'outbound-outbox', label: 'Outbox', href: '/outbound/outbox', icon: Send, category: 'Outbound' },
    { id: 'outbound-replies', label: 'Replies', href: '/outbound/replies', icon: MessageCircle, category: 'Outbound' },
    { id: 'outbound-suppressions', label: 'Suppressions', href: '/outbound/suppressions', icon: ShieldOff, category: 'Outbound' },
    { id: 'outbound-quiet-hours', label: 'Quiet hours', href: '/outbound/quiet-hours', icon: MoonStar, category: 'Outbound' },
    { id: 'ads', label: 'Ads', href: '/ads', icon: Megaphone, category: 'Ads' },
    { id: 'reports', label: 'Reports', href: '/reports', icon: ChartSpline, category: 'Reports' },
    { id: 'report-builder', label: 'Report builder', href: '/crm/report-builder', icon: PenLine, category: 'Reports' },
    { id: 'outbound-reports', label: 'Outbound reports', href: '/outbound/reports', icon: LibraryBig, category: 'Reports' },
    { id: 'segments', label: 'Segments', href: '/crm/segments', icon: Users, category: 'Reports' },
    { id: 'settings', label: 'Settings', href: '/settings', icon: Settings, category: 'Settings' },
    { id: 'settings-channels', label: 'Channels', href: '/settings/channels', icon: LayoutGrid, category: 'Settings' },
    { id: 'settings-apps', label: 'Apps', href: '/settings/apps', icon: LayoutGrid, category: 'Settings' },
];

const CATEGORIES = ['CRM', 'Sales', 'Desk', 'Outbound', 'Ads', 'Reports', 'Settings'];

function pathMatches(current: string, href: string, exact?: boolean, extra: string[] = []): boolean {
    if (exact) {
        return current === href || extra.includes(current);
    }

    return current === href || current.startsWith(`${href}/`) || extra.some((path) => current === path || current.startsWith(`${path}/`));
}

function ChannelChips({ collapsed }: { collapsed: boolean }) {
    const { integrations } = usePage().props;
    const meta = integrations?.meta;

    if (!meta?.connected) {
        return null;
    }

    const scopes = meta.scopes ?? [];
    const chips: { key: string; label: string; icon: LucideIcon; scopes: string[] }[] = [
        { key: 'facebook', label: 'Facebook Page connected', icon: Facebook, scopes: ['pages_show_list'] },
        { key: 'instagram', label: 'Instagram connected', icon: Instagram, scopes: ['instagram_basic'] },
        {
            key: 'whatsapp',
            label: 'WhatsApp Cloud connected',
            icon: MessageCircle,
            scopes: ['whatsapp_business_messaging', 'whatsapp_business_management'],
        },
    ].filter((chip) => chip.scopes.some((scope) => scopes.includes(scope)));

    if (chips.length === 0) {
        return null;
    }

    return (
        <div className={cn('flex w-full items-center gap-1.5 px-2 pb-1', collapsed ? 'flex-col' : 'flex-row')}>
            {chips.map((chip) => (
                <Link
                    key={chip.key}
                    href="/settings/apps"
                    title={chip.label}
                    className="grid size-7 place-content-center rounded-md bg-sidebar-well"
                >
                    <chip.icon className="size-3.5 text-sidebar-mute" />
                </Link>
            ))}
        </div>
    );
}

export function AppSidebar() {
    const { state, isMobile, toggleSidebar } = useSidebar();
    const collapsed = state === 'collapsed' && !isMobile;
    const page = usePage();
    const currentPath = new URL(page.url, 'http://localhost').pathname;
    const [pins, setPins] = useState<string[]>(() => readPins());
    const [moreOpen, setMoreOpen] = useState(false);
    const [category, setCategory] = useState('CRM');
    const integrations = page.props.integrations;
    const showSetup = !integrations?.meta?.connected && !integrations?.smtp?.connected;

    const catalog = useMemo(() => {
        const extras = MORE_ITEMS.filter((item) => !PRIMARY.some((row) => row.id === item.id));
        return [...PRIMARY, ...extras];
    }, []);

    const pinnedItems = pins
        .map((id) => catalog.find((item) => item.id === id))
        .filter((item): item is NavLeaf => Boolean(item));

    const railItems = pinnedItems.length > 0 ? pinnedItems : PRIMARY.filter((item) => DEFAULT_PINNED.includes(item.id as (typeof DEFAULT_PINNED)[number]));

    return (
        <Sidebar collapsible="icon">
            <section className={cn('grid text-sm', collapsed ? 'mt-3 mb-4 gap-3' : 'mt-2 mb-3 gap-2')}>
                <div className={cn('flex min-w-0 items-center gap-2', collapsed ? 'justify-center px-1' : 'px-3')}>
                    <Link href="/dashboard" title="Evotechly" className="grid place-content-center">
                        <AppLogoIcon className="size-6" />
                    </Link>
                    {!collapsed ? (
                        <span className="truncate text-sm font-medium text-sidebar-ink">Evotechly</span>
                    ) : null}
                </div>
            </section>

            <nav className={cn('no-scrollbar min-h-0 flex-grow overflow-y-auto pb-3', collapsed ? 'px-1' : 'px-2')}>
                <ul className={cn('m-0 flex list-none flex-col gap-0.5', collapsed && 'items-center')}>
                    {railItems.map((item) => {
                        const Icon = item.icon;
                        const active = pathMatches(currentPath, item.href, item.exact, item.activePaths);
                        const rowClass = cn(
                            collapsed
                                ? 'flex size-10 items-center justify-center rounded-md'
                                : 'flex h-9 items-center gap-2.5 rounded-md px-2 text-[13px]',
                            active
                                ? 'bg-sidebar-accent font-medium text-sidebar-ink'
                                : 'text-sidebar-mute hover:bg-sidebar-hover hover:text-sidebar-ink',
                        );

                        return (
                            <li key={item.id}>
                                <Link href={item.href} prefetch title={item.label} className={rowClass}>
                                    <Icon className="size-4 shrink-0" />
                                    {!collapsed ? <span className="truncate">{item.label}</span> : null}
                                </Link>
                            </li>
                        );
                    })}
                    <li className="relative">
                        <button
                            type="button"
                            title="More"
                            onClick={() => setMoreOpen((open) => !open)}
                            className={cn(
                                collapsed
                                    ? 'flex size-10 items-center justify-center rounded-md'
                                    : 'flex h-9 w-full items-center gap-2.5 rounded-md px-2 text-[13px]',
                                moreOpen
                                    ? 'bg-sidebar-accent text-sidebar-ink'
                                    : 'text-sidebar-mute hover:bg-sidebar-hover hover:text-sidebar-ink',
                            )}
                        >
                            <MoreHorizontal className="size-4" />
                            {!collapsed ? <span>More</span> : null}
                        </button>
                        {moreOpen ? (
                            <div className="absolute start-full top-0 z-50 ms-2 flex h-[420px] w-[520px] overflow-hidden rounded-md border border-hairline bg-canvas shadow-xl">
                                <div className="w-40 border-r border-hairline bg-canvas-soft py-2">
                                    {CATEGORIES.map((name) => (
                                        <button
                                            key={name}
                                            type="button"
                                            onClick={() => setCategory(name)}
                                            className={cn(
                                                'block w-full px-3 py-1.5 text-left text-[13px]',
                                                category === name ? 'bg-canvas font-medium text-ink' : 'text-muted-foreground',
                                            )}
                                        >
                                            {name}
                                        </button>
                                    ))}
                                </div>
                                <div className="min-w-0 flex-1 overflow-y-auto p-2">
                                    {MORE_ITEMS.filter((item) => item.category === category).map((item) => {
                                        const pinned = pins.includes(item.id);
                                        const Icon = item.icon;

                                        return (
                                            <div
                                                key={`${item.category}-${item.id}`}
                                                className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-canvas-soft"
                                            >
                                                <Link
                                                    href={item.href}
                                                    className="flex min-w-0 items-center gap-2 text-[13px] text-ink"
                                                    onClick={() => setMoreOpen(false)}
                                                >
                                                    <Icon className="size-3.5 text-muted-foreground" />
                                                    <span className="truncate">{item.label}</span>
                                                </Link>
                                                <button
                                                    type="button"
                                                    title={pinned ? 'Unpin' : 'Pin'}
                                                    onClick={() => setPins(togglePin(item.id, pins))}
                                                    className="text-muted-foreground hover:text-brand"
                                                >
                                                    {pinned ? <Pin className="size-3.5" /> : <PinOff className="size-3.5" />}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : null}
                    </li>
                </ul>
            </nav>

            <section className="relative flex shrink-0 flex-col gap-1">
                {showSetup && !collapsed ? (
                    <Link
                        href="/settings/apps"
                        className="mx-2 mb-1 rounded-md border border-sidebar-border bg-sidebar-well px-2.5 py-2 text-[11px] text-sidebar-ink"
                    >
                        <p className="font-medium">Set up channels</p>
                        <p className="text-sidebar-mute">Connect WhatsApp Cloud or email.</p>
                    </Link>
                ) : null}
                <ChannelChips collapsed={collapsed} />
                <button
                    type="button"
                    onClick={toggleSidebar}
                    className={cn(
                        'flex items-center gap-2 border-t border-sidebar-border px-3 py-2 text-[12px] text-sidebar-mute hover:text-sidebar-ink',
                        collapsed && 'justify-center',
                    )}
                >
                    <ChevronLeft className={cn('size-3.5', collapsed && 'rotate-180')} />
                    {!collapsed ? <span>Collapse</span> : null}
                    {!collapsed ? <Bell className="ms-auto size-3.5" /> : null}
                </button>
            </section>
        </Sidebar>
    );
}
