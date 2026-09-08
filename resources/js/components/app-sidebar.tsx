import { Link, usePage } from '@inertiajs/react';
import {
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
import { useEffect, useMemo, useRef, useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Sidebar, useSidebar } from '@/components/ui/sidebar';
import { PillGroup, PillTrigger, TabsContent } from '@/components/ui/tabs';
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

const CRM_RAIL_OBJECTS: NavLeaf[] = [
    { id: 'contacts', label: 'Contacts', href: '/crm/contacts', icon: Contact },
    { id: 'companies', label: 'Companies', href: '/crm/companies', icon: Building2 },
    { id: 'deals', label: 'Deals', href: '/crm/deals', icon: Handshake },
    { id: 'lead-board', label: 'Lead board', href: '/leads', icon: SquareKanban },
];

const PRIMARY: NavLeaf[] = [
    { id: 'home', label: 'Home', href: '/dashboard', icon: House, activePaths: ['/'] },
    {
        id: 'crm',
        label: 'CRM',
        href: '/crm/contacts',
        icon: Contact,
        activePaths: ['/crm', '/leads'],
    },
    {
        id: 'desk',
        label: 'Desk',
        href: '/inbox',
        icon: Inbox,
        activePaths: ['/desk', '/conversations'],
    },
    { id: 'outbound', label: 'Outbound', href: '/outbound', icon: Send, activePaths: ['/outbound'] },
    { id: 'ads', label: 'Ads', href: '/ads', icon: Megaphone, activePaths: ['/ads'] },
    {
        id: 'reports',
        label: 'Reports',
        href: '/reports',
        icon: ChartSpline,
        activePaths: ['/crm/reports', '/reports/funnels', '/crm/report-builder'],
    },
];

const MORE_ITEMS: MoreItem[] = [
    { id: 'contacts', label: 'Contacts', href: '/crm/contacts', icon: Contact, category: 'CRM' },
    { id: 'companies', label: 'Companies', href: '/crm/companies', icon: Building2, category: 'CRM' },
    { id: 'deals', label: 'Deals', href: '/crm/deals', icon: Handshake, category: 'CRM' },
    { id: 'activities', label: 'Activities', href: '/crm/activities', icon: SquareKanban, category: 'CRM' },
    { id: 'lead-board', label: 'Lead board', href: '/leads', icon: SquareKanban, category: 'CRM' },
    { id: 'leads', label: 'Leads list', href: '/crm/leads', icon: SquareKanban, category: 'CRM' },
    { id: 'lead-captures', label: 'Captures', href: '/crm/leads/captures', icon: Inbox, category: 'CRM' },
    { id: 'pipelines', label: 'Pipeline', href: '/crm/deals/board', icon: SquareKanban, category: 'CRM' },
    { id: 'segments', label: 'Segments', href: '/crm/segments', icon: Users, category: 'CRM' },
    { id: 'workflows', label: 'Automation', href: '/crm/workflows', icon: Workflow, category: 'CRM' },
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
    { id: 'conversion-funnels', label: 'Conversion funnels', href: '/reports/funnels', icon: ChartSpline, category: 'Reports' },
    { id: 'report-builder', label: 'Report builder', href: '/crm/report-builder', icon: PenLine, category: 'Reports' },
    { id: 'outbound-reports', label: 'Outbound reports', href: '/outbound/reports', icon: LibraryBig, category: 'Reports' },
    { id: 'settings', label: 'Settings', href: '/settings', icon: Settings, category: 'Settings' },
    { id: 'settings-channels', label: 'Channels', href: '/settings/channels', icon: LayoutGrid, category: 'Settings' },
    { id: 'settings-apps', label: 'Apps', href: '/settings/apps', icon: LayoutGrid, category: 'Settings' },
];

const CATEGORIES = ['CRM', 'Desk', 'Outbound', 'Ads', 'Reports', 'Settings'];

function MorePanelItems({
    category,
    pins,
    onPinsChange,
    onNavigate,
}: {
    category: string;
    pins: string[];
    onPinsChange: (pins: string[]) => void;
    onNavigate: () => void;
}) {
    return (
        <>
            {MORE_ITEMS.filter((item) => item.category === category).map((item) => {
                const pinned = pins.includes(item.id);
                const Icon = item.icon;

                return (
                    <div
                        key={`${item.category}-${item.id}`}
                        className="flex items-center justify-between rounded-[var(--radius-1)] px-2 py-2 hover:bg-sidebar-hover"
                    >
                        <Link
                            href={item.href}
                            className="flex min-w-0 flex-1 items-center gap-2.5 py-0.5 text-[13px] text-sidebar-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                            onClick={onNavigate}
                        >
                            <Icon className="size-4 shrink-0 text-sidebar-mute" />
                            <span className="truncate">{item.label}</span>
                        </Link>
                        <button
                            type="button"
                            title={pinned ? 'Unpin' : 'Pin'}
                            aria-label={pinned ? 'Unpin from sidebar' : 'Pin to sidebar'}
                            onClick={() => onPinsChange(togglePin(item.id, pins))}
                            className="ms-2 shrink-0 rounded p-1 text-sidebar-mute hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                        >
                            {pinned ? <Pin className="size-4" aria-hidden /> : <PinOff className="size-4" aria-hidden />}
                        </button>
                    </div>
                );
            })}
        </>
    );
}

function MorePanelDesktop({
    category,
    onCategoryChange,
    pins,
    onPinsChange,
    onNavigate,
}: {
    category: string;
    onCategoryChange: (category: string) => void;
    pins: string[];
    onPinsChange: (pins: string[]) => void;
    onNavigate: () => void;
}) {
    return (
        <>
            <div
                className="w-40 border-r py-2"
                style={{
                    borderColor: 'var(--evosales-hairline)',
                    background: 'var(--evosales-canvas-soft)',
                }}
            >
                {CATEGORIES.map((name) => (
                    <button
                        key={name}
                        type="button"
                        onClick={() => onCategoryChange(name)}
                        className={cn(
                            'block w-full px-3 py-1.5 text-left text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aurora-focus-ring-strong)]',
                            category === name
                                ? 'font-medium'
                                : 'text-[var(--evosales-mute)]',
                        )}
                        style={
                            category === name
                                ? {
                                      background: 'var(--evosales-canvas)',
                                      color: 'var(--evosales-ink)',
                                  }
                                : undefined
                        }
                    >
                        {name}
                    </button>
                ))}
            </div>
            <div className="min-w-0 flex-1 overflow-y-auto p-2">
                <MorePanelItems
                    category={category}
                    pins={pins}
                    onPinsChange={onPinsChange}
                    onNavigate={onNavigate}
                />
            </div>
        </>
    );
}

function MorePanelMobile({
    category,
    onCategoryChange,
    pins,
    onPinsChange,
    onNavigate,
}: {
    category: string;
    onCategoryChange: (category: string) => void;
    pins: string[];
    onPinsChange: (pins: string[]) => void;
    onNavigate: () => void;
}) {
    return (
        <div className="mx-1 mt-2 rounded-lg border border-sidebar-border bg-sidebar-well">
            <PillGroup
                value={category}
                onValueChange={onCategoryChange}
                className="mx-2 mt-2 w-[calc(100%-1rem)] border-0 bg-transparent p-0"
                panels={
                    <>
                        {CATEGORIES.map((name) => (
                            <TabsContent
                                key={name}
                                value={name}
                                className="sr-only"
                                aria-hidden
                            />
                        ))}
                    </>
                }
            >
                {CATEGORIES.map((name) => (
                    <PillTrigger
                        key={name}
                        value={name}
                        className="min-h-9 shrink-0 px-3 py-1.5 text-[12px]"
                    >
                        {name}
                    </PillTrigger>
                ))}
            </PillGroup>
            <div className="max-h-56 overflow-y-auto p-2">
                <MorePanelItems
                    category={category}
                    pins={pins}
                    onPinsChange={onPinsChange}
                    onNavigate={onNavigate}
                />
            </div>
        </div>
    );
}

function pathMatches(current: string, href: string, exact?: boolean, extra: string[] = []): boolean {
    if (exact) {
        return current === href || extra.includes(current);
    }

    return current === href || current.startsWith(`${href}/`) || extra.some((path) => current === path || current.startsWith(`${path}/`));
}

function crmObjectActive(current: string, href: string): boolean {
    if (href === '/crm/deals') {
        return (
            (current === '/crm/deals' || current.startsWith('/crm/deals/')) &&
            !current.startsWith('/crm/deals/board')
        );
    }

    return current === href || current.startsWith(`${href}/`);
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
            label: 'WhatsApp Business connected',
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
    const { state, isMobile, openMobile, toggleSidebar } = useSidebar();
    const collapsed = state === 'collapsed' && !isMobile;
    const page = usePage();
    const currentPath = new URL(page.url, 'http://localhost').pathname;
    const [pins, setPins] = useState<string[]>(() => readPins());
    const [moreOpen, setMoreOpen] = useState(false);
    const [category, setCategory] = useState('CRM');
    const moreRef = useRef<HTMLLIElement>(null);
    const [morePos, setMorePos] = useState<{ top: number; left: number } | null>(null);

    useEffect(() => {
        if (isMobile && !openMobile) {
            // Closing the mobile sidebar also resets its nested "More" menu.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setMoreOpen(false);
        }
    }, [isMobile, openMobile]);

    useEffect(() => {
        if (!moreOpen || isMobile) {
            return;
        }

        const updatePosition = () => {
            const anchor = moreRef.current;

            if (!anchor) {
                return;
            }

            const rect = anchor.getBoundingClientRect();
            setMorePos({
                top: rect.top,
                left: rect.right + 8,
            });
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        const onPointerDown = (event: MouseEvent) => {
            if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
                const panel = document.getElementById('sidebar-more-panel');

                if (panel && panel.contains(event.target as Node)) {
                    return;
                }

                setMoreOpen(false);
            }
        };

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setMoreOpen(false);
            }
        };

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [moreOpen, isMobile]);
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
    const pinnedIds = new Set(railItems.map((item) => item.id));
    const crmChildren = CRM_RAIL_OBJECTS.filter((item) => !pinnedIds.has(item.id));

    return (
        <Sidebar collapsible="icon" className="bg-sidebar" data-cabinet="rail">
            <section className={cn('grid text-sm', collapsed ? 'mt-4 mb-4 gap-3' : 'mt-3 mb-4 gap-2')}>
                <div className={cn('flex min-w-0 items-center gap-2.5', collapsed ? 'justify-center px-1' : 'px-3')}>
                    <Link href="/dashboard" title="Evotechly" className="grid place-content-center">
                        <AppLogoIcon className="size-6" />
                    </Link>
                    {!collapsed ? (
                        <span className="truncate text-sm font-medium tracking-[-0.01em] text-sidebar-ink">
                            Evotechly
                        </span>
                    ) : null}
                </div>
            </section>

            <nav className={cn('no-scrollbar min-h-0 flex-grow overflow-y-auto pb-3', collapsed ? 'px-1' : 'px-2')}>
                <ul className={cn('m-0 flex list-none flex-col gap-0.5', collapsed && 'items-center')}>
                    {railItems.map((item) => {
                        const Icon = item.icon;
                        const active = pathMatches(currentPath, item.href, item.exact, item.activePaths);
                        const rowClass = cn(
                            'app-rail-item font-normal',
                            collapsed
                                ? 'flex size-10 items-center justify-center'
                                : 'flex w-full items-center gap-2.5 px-3 text-[13px]',
                            active
                                ? 'bg-sidebar-accent font-medium text-sidebar-ink'
                                : 'text-sidebar-mute hover:bg-sidebar-hover hover:text-sidebar-ink',
                        );
                        const showCrmChildren = item.id === 'crm' && !collapsed && crmChildren.length > 0;

                        return (
                            <li key={item.id}>
                                <Link href={item.href} prefetch title={item.label} className={rowClass}>
                                    <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                                    {!collapsed ? <span className="truncate">{item.label}</span> : null}
                                </Link>
                                {showCrmChildren ? (
                                    <ul
                                        className="mt-0.5 mb-1 ml-3 flex list-none flex-col gap-0.5 border-l border-sidebar-border pl-2"
                                        data-nav="crm-objects"
                                    >
                                        {crmChildren.map((child) => {
                                            const childActive = crmObjectActive(currentPath, child.href);

                                            return (
                                                <li key={child.id}>
                                                    <Link
                                                        href={child.href}
                                                        prefetch
                                                        title={child.label}
                                                        className={cn(
                                                            'app-rail-item flex w-full items-center px-2 text-[12px] font-normal',
                                                            childActive
                                                                ? 'bg-sidebar-accent font-medium text-sidebar-ink'
                                                                : 'text-sidebar-mute hover:bg-sidebar-hover hover:text-sidebar-ink',
                                                        )}
                                                    >
                                                        <span className="truncate">{child.label}</span>
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : null}
                            </li>
                        );
                    })}
                    <li ref={moreRef} className="relative">
                        <button
                            type="button"
                            title="More"
                            aria-expanded={moreOpen}
                            onClick={() => setMoreOpen((open) => !open)}
                            className={cn(
                                'app-rail-item font-normal',
                                collapsed
                                    ? 'flex size-10 items-center justify-center'
                                    : 'flex w-full items-center gap-2.5 px-3 text-[13px]',
                                moreOpen
                                    ? 'bg-sidebar-accent font-medium text-sidebar-ink'
                                    : 'text-sidebar-mute hover:bg-sidebar-hover hover:text-sidebar-ink',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                            )}
                        >
                            <MoreHorizontal className="size-4" strokeWidth={1.75} />
                            {!collapsed ? <span>More</span> : null}
                        </button>
                        {isMobile && moreOpen ? (
                            <MorePanelMobile
                                category={category}
                                onCategoryChange={setCategory}
                                pins={pins}
                                onPinsChange={setPins}
                                onNavigate={() => {
                                    setMoreOpen(false);

                                    if (openMobile) {
                                        toggleSidebar();
                                    }
                                }}
                            />
                        ) : null}
                        {!isMobile && moreOpen && morePos ? (
                            <div
                                id="sidebar-more-panel"
                                className="fixed z-[100] flex h-[420px] w-[520px] max-w-[calc(100vw-1rem)] overflow-hidden rounded-[var(--radius-2)] border shadow-xl"
                                style={{
                                    top: morePos.top,
                                    left: morePos.left,
                                    borderColor: 'var(--evosales-hairline)',
                                    background: 'var(--evosales-canvas)',
                                    boxShadow: 'var(--aurora-shadow-strong)',
                                }}
                            >
                                <MorePanelDesktop
                                    category={category}
                                    onCategoryChange={setCategory}
                                    pins={pins}
                                    onPinsChange={setPins}
                                    onNavigate={() => setMoreOpen(false)}
                                />
                            </div>
                        ) : null}
                    </li>
                </ul>
            </nav>

            <section className="relative flex shrink-0 flex-col gap-1">
                {showSetup && !collapsed ? (
                    <Link
                        href="/settings/apps"
                        className="mx-2 mb-1 rounded-[var(--radius-1)] border border-sidebar-border bg-sidebar-well px-2.5 py-2 text-[11px] text-sidebar-ink"
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
                        'flex h-10 items-center gap-2 border-t border-sidebar-border px-3 text-[12px] font-normal text-sidebar-mute hover:text-sidebar-ink',
                        collapsed && 'justify-center',
                    )}
                >
                    <ChevronLeft className={cn('size-4', collapsed && 'rotate-180')} />
                    {!collapsed ? <span>{isMobile ? 'Close menu' : 'Collapse'}</span> : null}
                </button>
            </section>
        </Sidebar>
    );
}
