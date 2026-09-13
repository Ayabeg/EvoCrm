import { Link, usePage } from '@inertiajs/react';
import type { Icon } from '@phosphor-icons/react';
import {
    AddressBook,
    Buildings,
    ChartLine,
    DotsThree,
    FileText,
    FlowArrow,
    GearSix,
    Handshake,
    House,
    Megaphone,
    Path,
    Ticket,
    Tray,
    UsersThree,
} from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { Sidebar, useSidebar } from '@/components/ui/sidebar';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSimpleMode } from '@/hooks/use-simple-mode';
import { cn } from '@/lib/utils';

export type NavLeaf = {
    id: string;
    label: string;
    href: string;
    icon: Icon;
    activePaths?: string[];
    exact?: boolean;
};

type MoreItem = NavLeaf & { category: string };

const CRM_RAIL_OBJECTS: NavLeaf[] = [
    { id: 'contacts', label: 'Contacts', href: '/crm/contacts', icon: AddressBook },
    { id: 'companies', label: 'Companies', href: '/crm/companies', icon: Buildings },
    { id: 'deals', label: 'Deals', href: '/crm/deals', icon: Handshake },
    { id: 'leads', label: 'Leads', href: '/crm/leads', icon: Path },
    { id: 'tickets', label: 'Tickets', href: '/crm/tickets', icon: Ticket },
];

const PRIMARY: NavLeaf[] = [
    { id: 'home', label: 'Home', href: '/dashboard', icon: House, activePaths: ['/'] },
    { id: 'contacts', label: 'Contacts', href: '/crm/contacts', icon: AddressBook },
    { id: 'companies', label: 'Companies', href: '/crm/companies', icon: Buildings },
    { id: 'deals', label: 'Deals', href: '/crm/deals', icon: Handshake },
    {
        id: 'inbox',
        label: 'Inbox',
        href: '/inbox',
        icon: Tray,
        activePaths: ['/desk', '/conversations'],
    },
    { id: 'quotes', label: 'Quotes', href: '/crm/quotes', icon: FileText },
];

const SETTINGS: NavLeaf = {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: GearSix,
};

const MORE_ITEMS: MoreItem[] = [
    { id: 'leads', label: 'Leads', href: '/crm/leads', icon: Path, category: 'CRM' },
    { id: 'tickets', label: 'Tickets', href: '/crm/tickets', icon: Ticket, category: 'CRM' },
    { id: 'segments', label: 'Segments', href: '/crm/segments', icon: UsersThree, category: 'CRM' },
    { id: 'workflows', label: 'Automation', href: '/crm/workflows', icon: FlowArrow, category: 'CRM' },
    { id: 'ads', label: 'Ads', href: '/ads', icon: Megaphone, category: 'Ads' },
    { id: 'reports', label: 'Reports', href: '/reports', icon: ChartLine, category: 'Reports' },
];

const NAV_ICONS: Record<string, Icon> = {
    home: House,
    contacts: AddressBook,
    companies: Buildings,
    deals: Handshake,
    leads: Path,
    tickets: Ticket,
    inbox: Tray,
    quotes: FileText,
    ads: Megaphone,
    settings: GearSix,
};

function pathMatches(current: string, href: string, exact?: boolean, extra: string[] = []): boolean {
    if (exact) {
        return current === href || extra.includes(current);
    }

    return current === href || current.startsWith(`${href}/`) || extra.some((path) => current === path || current.startsWith(`${path}/`));
}

function RailLink({
    item,
    currentPath,
    labeled,
    onNavigate,
}: {
    item: NavLeaf;
    currentPath: string;
    labeled: boolean;
    onNavigate?: () => void;
}) {
    const Icon = item.icon;
    const active = pathMatches(currentPath, item.href, item.exact, item.activePaths);
    const row = (
        <Link
            href={item.href}
            prefetch
            title={item.label}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            data-active={active || undefined}
            className={cn(
                'app-rail-item font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                labeled
                    ? 'flex h-10 w-full items-center gap-2.5 px-3 text-[13px]'
                    : 'flex size-10 items-center justify-center',
                active
                    ? 'bg-sidebar-accent font-medium text-sidebar-ink'
                    : 'text-sidebar-mute hover:bg-sidebar-hover hover:text-sidebar-ink',
            )}
        >
            <Icon className="size-5 shrink-0" weight={active ? 'fill' : 'regular'} />
            {labeled ? <span className="truncate">{item.label}</span> : null}
        </Link>
    );

    if (labeled) {
        return row;
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>{row}</TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
                {item.label}
            </TooltipContent>
        </Tooltip>
    );
}

export function AppSidebar() {
    const { isMobile, openMobile, toggleSidebar } = useSidebar();
    const page = usePage();
    const currentPath = new URL(page.url, 'http://localhost').pathname;
    const [moreOpen, setMoreOpen] = useState(false);
    const moreRef = useRef<HTMLLIElement>(null);
    const { simpleMode, nav } = useSimpleMode();
    const labeled = isMobile;
    const launchRail = nav.map((item) => ({
        ...item,
        icon: NAV_ICONS[item.id] ?? House,
    }));
    const railItems = simpleMode ? launchRail : PRIMARY;
    const showMore = !simpleMode && MORE_ITEMS.length > 0;

    useEffect(() => {
        if (isMobile && !openMobile) {
            // Closing the mobile sidebar also resets its nested "More" menu.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setMoreOpen(false);
        }
    }, [isMobile, openMobile]);

    useEffect(() => {
        if (!moreOpen) {
            return;
        }

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
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [moreOpen]);

    const closeMobile = () => {
        if (openMobile) {
            toggleSidebar();
        }
    };

    return (
        <Sidebar collapsible="icon" className="bg-sidebar" data-cabinet="rail">
            <nav className={cn('no-scrollbar min-h-0 flex-grow overflow-y-auto py-3', labeled ? 'px-2' : 'px-1')}>
                <ul className={cn('m-0 flex list-none flex-col gap-0.5', !labeled && 'items-center')}>
                    {railItems.map((item) => (
                        <li key={item.id}>
                            <RailLink
                                item={item}
                                currentPath={currentPath}
                                labeled={labeled}
                                onNavigate={closeMobile}
                            />
                        </li>
                    ))}
                    {showMore ? (
                        <li ref={moreRef} className="relative">
                            <button
                                type="button"
                                title="More"
                                aria-expanded={moreOpen}
                                aria-haspopup="menu"
                                data-active={moreOpen || undefined}
                                onClick={() => setMoreOpen((open) => !open)}
                                className={cn(
                                    'app-rail-item font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                                    labeled
                                        ? 'flex h-10 w-full items-center gap-2.5 px-3 text-[13px]'
                                        : 'flex size-10 items-center justify-center',
                                    moreOpen
                                        ? 'bg-sidebar-accent font-medium text-sidebar-ink'
                                        : 'text-sidebar-mute hover:bg-sidebar-hover hover:text-sidebar-ink',
                                )}
                            >
                                <DotsThree className="size-5" weight="bold" />
                                {labeled ? <span>More</span> : null}
                            </button>
                            {moreOpen ? (
                                <div
                                    id="sidebar-more-panel"
                                    role="menu"
                                    className={cn(
                                        'z-[100] overflow-hidden rounded-md border',
                                        labeled ? 'relative mt-1 w-full' : 'absolute top-0 left-[calc(100%+8px)] w-56',
                                    )}
                                    style={{
                                        borderColor: 'var(--evosales-hairline)',
                                        background: 'var(--evosales-canvas)',
                                        color: 'var(--evosales-ink)',
                                    }}
                                >
                                    <p
                                        className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wide uppercase"
                                        style={{
                                            background: 'var(--evosales-canvas-soft)',
                                            color: 'var(--evosales-mute)',
                                        }}
                                    >
                                        More
                                    </p>
                                    <ul className="m-0 list-none p-1" data-nav="crm-objects">
                                        {MORE_ITEMS.map((item) => {
                                            const Icon = item.icon;

                                            return (
                                                <li key={item.id}>
                                                    <Link
                                                        href={item.href}
                                                        role="menuitem"
                                                        className="flex items-center gap-2.5 rounded-sm px-2 py-1.5 text-[13px] text-[var(--evosales-mute)] hover:text-[var(--evosales-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                                                        style={{ color: 'var(--evosales-ink)' }}
                                                        onClick={() => {
                                                            setMoreOpen(false);
                                                            closeMobile();
                                                        }}
                                                    >
                                                        <Icon className="size-4 shrink-0" />
                                                        <span className="truncate">{item.label}</span>
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ) : null}
                        </li>
                    ) : null}
                </ul>
            </nav>

            <section className={cn('flex shrink-0 flex-col pb-2', labeled ? 'px-2' : 'items-center px-1')}>
                <RailLink
                    item={SETTINGS}
                    currentPath={currentPath}
                    labeled={labeled}
                    onNavigate={closeMobile}
                />
            </section>
        </Sidebar>
    );
}

export { CRM_RAIL_OBJECTS };
