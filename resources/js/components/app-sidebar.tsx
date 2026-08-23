import { Link, usePage } from '@inertiajs/react';
import {
    AtSign,
    Bolt,
    Briefcase,
    Building2,
    ChartSpline,
    ClockAlert,
    Contact,
    Facebook,
    Globe,
    Handshake,
    House,
    Inbox,
    Instagram,
    LibraryBig,
    Mail,
    Mailbox,
    Megaphone,
    MessageCircle,
    MoonStar,
    PenLine,
    Search,
    Send,
    SendHorizonal,
    ShieldOff,
    SquareKanban,
    Target,
    UserRoundCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { ChatwootNav, NavGroup } from '@/components/nav-main';
import type { NavGroupItem } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

/**
 * Authenticated rail = EvoDesk (Chatwoot Community) next-sidebar.
 * Dark charcoal rail, Evotechly wordmark, search + compose, expandable
 * Conversations group, footer profile. Content stays Light Cabinet.
 */
/**
 * Kommo-style channel chips on the rail footer — rendered only for
 * connections that actually exist on the workspace (granted Meta scopes).
 */
function ChannelChips({ collapsed }: { collapsed: boolean }) {
    const { integrations } = usePage().props;
    const meta = integrations?.meta;

    if (!meta?.connected) {
        return null;
    }

    const scopes = meta.scopes ?? [];
    const chips: {
        key: string;
        label: string;
        icon: LucideIcon;
        scopes: string[];
    }[] = [
        {
            key: 'facebook',
            label: 'Facebook Page connected',
            icon: Facebook,
            scopes: ['pages_show_list'],
        },
        {
            key: 'instagram',
            label: 'Instagram connected',
            icon: Instagram,
            scopes: ['instagram_basic'],
        },
        {
            key: 'whatsapp',
            label: 'WhatsApp Cloud connected',
            icon: MessageCircle,
            scopes: [
                'whatsapp_business_messaging',
                'whatsapp_business_management',
            ],
        },
    ].filter((chip) => chip.scopes.some((scope) => scopes.includes(scope)));

    if (chips.length === 0) {
        return null;
    }

    return (
        <div
            className={cn(
                'z-50 flex w-full items-center gap-1.5 px-2 pb-1.5',
                collapsed ? 'flex-col' : 'flex-row',
            )}
        >
            {chips.map((chip) => (
                <Link
                    key={chip.key}
                    href="/settings/apps"
                    title={chip.label}
                    className="grid size-7 place-content-center rounded-lg bg-sidebar-well outline-1 outline-sidebar-border transition-colors hover:bg-sidebar-well-hover"
                >
                    <chip.icon className="size-3.5 text-sidebar-mute" />
                </Link>
            ))}
        </div>
    );
}

export function AppSidebar() {
    const { state, isMobile } = useSidebar();
    const collapsed = state === 'collapsed' && !isMobile;

    const menuItems: NavGroupItem[] = [
        {
            name: 'home',
            label: 'Home',
            icon: House,
            href: '/dashboard',
            activePaths: ['/'],
        },
        {
            name: 'inbox',
            label: 'My Inbox',
            icon: Inbox,
            href: '/inbox',
        },
        {
            name: 'leads',
            label: 'Leads',
            icon: SquareKanban,
            href: '/leads',
        },
        {
            name: 'conversations',
            label: 'Conversations',
            icon: MessageCircle,
            children: [
                {
                    name: 'all',
                    label: 'All Conversations',
                    href: '/conversations',
                    icon: Inbox,
                    activePaths: ['/desk'],
                    absentParams: ['filter'],
                },
                {
                    name: 'mentions',
                    label: '@ Mentions',
                    href: '/conversations?filter=mentions',
                    icon: AtSign,
                },
                {
                    name: 'participating',
                    label: 'Participating',
                    href: '/conversations?filter=participating',
                    icon: UserRoundCheck,
                },
                {
                    name: 'unattended',
                    label: 'Unattended',
                    href: '/conversations?filter=unattended',
                    icon: ClockAlert,
                },
            ],
        },
        {
            name: 'contacts',
            label: 'Contacts',
            icon: Contact,
            href: '/crm/contacts',
        },
        {
            name: 'crm',
            label: 'CRM',
            icon: Briefcase,
            children: [
                {
                    name: 'companies',
                    label: 'Companies',
                    href: '/crm/companies',
                    icon: Building2,
                },
                {
                    name: 'deals',
                    label: 'Deals',
                    href: '/crm/deals',
                    icon: Handshake,
                },
                {
                    name: 'leads',
                    label: 'Leads',
                    href: '/crm/leads',
                    icon: Target,
                },
            ],
        },
        {
            name: 'reports',
            label: 'Reports',
            icon: ChartSpline,
            href: '/crm/reports',
        },
        {
            name: 'campaigns',
            label: 'Campaigns',
            icon: Megaphone,
            href: '/ads',
        },
        {
            name: 'outbound',
            label: 'Outbound',
            icon: Send,
            children: [
                {
                    name: 'outbound-overview',
                    label: 'Overview',
                    href: '/outbound',
                    icon: ChartSpline,
                    exact: true,
                },
                {
                    name: 'outbound-mailboxes',
                    label: 'Mailboxes',
                    href: '/outbound/mailboxes',
                    icon: Mailbox,
                },
                {
                    name: 'outbound-domains',
                    label: 'Domains',
                    href: '/outbound/domains',
                    icon: Globe,
                },
                {
                    name: 'outbound-templates',
                    label: 'Templates',
                    href: '/outbound/templates',
                    icon: PenLine,
                },
                {
                    name: 'outbound-sequences',
                    label: 'Sequences',
                    href: '/outbound/sequences',
                    icon: Mail,
                },
                {
                    name: 'outbound-campaigns',
                    label: 'Campaigns',
                    href: '/outbound/campaigns',
                    icon: SendHorizonal,
                },
                {
                    name: 'outbound-outbox',
                    label: 'Outbox',
                    href: '/outbound/outbox',
                    icon: Send,
                },
                {
                    name: 'outbound-replies',
                    label: 'Replies',
                    href: '/outbound/replies',
                    icon: MessageCircle,
                },
                {
                    name: 'outbound-suppressions',
                    label: 'Suppressions',
                    href: '/outbound/suppressions',
                    icon: ShieldOff,
                },
                {
                    name: 'outbound-quiet-hours',
                    label: 'Quiet hours',
                    href: '/outbound/quiet-hours',
                    icon: MoonStar,
                },
                {
                    name: 'outbound-reports',
                    label: 'Reports',
                    href: '/outbound/reports',
                    icon: ChartSpline,
                },
            ],
        },
        {
            name: 'help',
            label: 'Help Center',
            icon: LibraryBig,
            href: '/settings',
        },
        {
            name: 'settings',
            label: 'Settings',
            icon: Bolt,
            href: '/settings',
        },
    ];

    return (
        <Sidebar collapsible="icon">
            <section
                className={cn(
                    'grid text-sm',
                    collapsed ? 'mt-3 mb-6 gap-4' : 'mt-1 mb-4 gap-2',
                )}
            >
                <div
                    className={cn(
                        'flex min-w-0 items-center gap-2',
                        collapsed ? 'justify-center px-1' : 'px-2',
                    )}
                >
                    {collapsed ? (
                        <Link
                            href="/dashboard"
                            title="Evotechly"
                            className="grid flex-shrink-0 cursor-pointer place-content-center rounded-lg p-2 hover:bg-sidebar-overlay"
                        >
                            <AppLogoIcon className="size-7" />
                        </Link>
                    ) : (
                        <>
                            <div className="grid size-6 flex-shrink-0 place-content-center">
                                <AppLogoIcon className="size-4" />
                            </div>
                            <div className="h-3 w-px flex-shrink-0 bg-sidebar-strong" />
                            <div className="-mx-1 min-w-0 flex-grow">
                                <div className="flex w-full items-center justify-between gap-2 rounded-lg px-2">
                                    <span className="truncate text-sm leading-5 font-medium text-sidebar-ink">
                                        Evotechly
                                    </span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <div
                    className={cn(
                        'flex gap-2',
                        collapsed ? 'flex-col items-center' : 'px-2',
                    )}
                >
                    {collapsed ? (
                        <>
                            <Link
                                href="/crm/contacts"
                                title="Search..."
                                className="flex size-8 items-center justify-center rounded-lg bg-sidebar-well outline outline-1 outline-sidebar-border transition-all duration-100 ease-out hover:bg-sidebar-accent"
                            >
                                <Search className="size-4 text-sidebar-mute" />
                            </Link>
                            <Link
                                href="/inbox"
                                title="New conversation"
                                className="flex size-8 items-center justify-center rounded-lg bg-sidebar-well text-sidebar-mute outline outline-1 outline-sidebar-border transition-all duration-100 ease-out hover:bg-sidebar-well-hover"
                            >
                                <PenLine className="size-4" />
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/crm/contacts"
                                prefetch
                                className="flex h-7 w-full items-center gap-2 rounded-lg bg-sidebar-well px-2 py-1 outline outline-1 outline-sidebar-border transition-all duration-100 ease-out"
                            >
                                <Search className="size-4 flex-shrink-0 text-sidebar-faint" />
                                <span className="flex-grow text-start text-sidebar-faint">
                                    Search...
                                </span>
                            </Link>
                            <Link
                                href="/inbox"
                                title="New conversation"
                                className="inline-flex h-7 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-sidebar-well p-0 text-sidebar-mute outline outline-1 outline-sidebar-border transition-all duration-100 ease-out hover:bg-sidebar-well-hover active:scale-[0.97]"
                            >
                                <PenLine className="size-4 flex-shrink-0" />
                            </Link>
                        </>
                    )}
                </div>
            </section>

            <nav
                className={cn(
                    'no-scrollbar grid min-h-0 min-w-0 flex-grow gap-2 overflow-y-scroll pb-5',
                    collapsed ? 'px-1' : 'px-2',
                )}
            >
                <ChatwootNav defaultExpanded="conversations">
                    <ul
                        className={cn(
                            'm-0 flex min-w-0 list-none flex-col gap-1',
                            collapsed && 'items-center',
                        )}
                    >
                        {menuItems.map((item) => (
                            <NavGroup key={item.name} item={item} />
                        ))}
                    </ul>
                </ChatwootNav>
            </nav>

            <section className="relative flex flex-shrink-0 flex-col items-center justify-between gap-1">
                <div className="pointer-events-none absolute inset-x-0 -top-[1.938rem] h-8 bg-gradient-to-t from-sidebar to-transparent" />
                <ChannelChips collapsed={collapsed} />
                <div
                    className={cn(
                        'z-50 flex w-full flex-shrink-0 items-center gap-2 border-t border-sidebar-border px-1 py-1.5 shadow-[0px_-2px_4px_0px_rgba(27,28,29,0.02)]',
                        collapsed ? 'justify-center' : 'justify-between',
                    )}
                >
                    <NavUser />
                </div>
            </section>
        </Sidebar>
    );
}
