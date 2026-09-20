import { Link, usePage } from '@inertiajs/react';
import type { Icon } from '@phosphor-icons/react';
import {
    AddressBook,
    Buildings,
    ChartLine,
    CheckSquare,
    DotsThree,
    FileText,
    FlowArrow,
    GearSix,
    Handshake,
    House,
    Megaphone,
    PaperPlaneTilt,
    Path,
    SquaresFour,
    Ticket,
    Tray,
    UsersThree,
} from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Sidebar, useSidebar } from '@/components/ui/sidebar';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSimpleMode } from '@/hooks/use-simple-mode';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export type NavLeaf = {
    id: string;
    label: string;
    href: string;
    icon: Icon;
    activePaths?: string[];
    excludePaths?: string[];
    exact?: boolean;
};

type NavGroup = {
    id: string;
    label: string | null;
    items: NavLeaf[];
};

type MoreItem = NavLeaf & { category: string };

const CRM_RAIL_OBJECTS: NavLeaf[] = [
    { id: 'contacts', label: 'Contacts', href: '/crm/contacts', icon: AddressBook },
    { id: 'companies', label: 'Companies', href: '/crm/companies', icon: Buildings },
    { id: 'deals', label: 'Deals', href: '/crm/deals', icon: Handshake },
    { id: 'leads', label: 'Leads', href: '/crm/leads', icon: Path },
    { id: 'tickets', label: 'Tickets', href: '/crm/tickets', icon: Ticket },
];

const HOME: NavLeaf = {
    id: 'home',
    label: 'Home',
    href: '/dashboard',
    icon: House,
    activePaths: ['/'],
};

const CRM_LEAVES: NavLeaf[] = [
    { id: 'contacts', label: 'Contacts', href: '/crm/contacts', icon: AddressBook },
    { id: 'companies', label: 'Companies', href: '/crm/companies', icon: Buildings },
    {
        id: 'deals',
        label: 'Deals',
        href: '/crm/deals',
        icon: Handshake,
        excludePaths: ['/crm/deals/board'],
    },
    { id: 'pipeline', label: 'Pipeline', href: '/crm/deals/board', icon: SquaresFour },
];

const COMMUNICATION_LEAVES: NavLeaf[] = [
    {
        id: 'inbox',
        label: 'Inbox',
        href: '/inbox',
        icon: Tray,
        activePaths: ['/desk', '/conversations'],
    },
    { id: 'activities', label: 'Activities', href: '/crm/activities', icon: CheckSquare },
];

const SALES_LEAVES: NavLeaf[] = [
    { id: 'quotes', label: 'Quotes', href: '/crm/quotes', icon: FileText },
];

const AUTOMATION_LEAVES: NavLeaf[] = [
    {
        id: 'workflows',
        label: 'Workflows',
        href: '/crm/workflows',
        icon: FlowArrow,
        activePaths: ['/automation'],
    },
];

const NAV_GROUPS: NavGroup[] = [
    { id: 'home', label: null, items: [HOME] },
    { id: 'crm', label: 'CRM', items: CRM_LEAVES },
    { id: 'communication', label: 'Communication', items: COMMUNICATION_LEAVES },
    { id: 'sales', label: 'Sales', items: SALES_LEAVES },
    { id: 'automation', label: 'Automation', items: AUTOMATION_LEAVES },
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
    { id: 'ads', label: 'Ads', href: '/ads', icon: Megaphone, category: 'Ads' },
    { id: 'reports', label: 'Reports', href: '/reports', icon: ChartLine, category: 'Reports' },
    { id: 'outbound', label: 'Outbound', href: '/outbound', icon: PaperPlaneTilt, category: 'Outbound' },
];

const NAV_ICONS: Record<string, Icon> = {
    home: House,
    contacts: AddressBook,
    companies: Buildings,
    deals: Handshake,
    pipeline: SquaresFour,
    leads: Path,
    tickets: Ticket,
    inbox: Tray,
    activities: CheckSquare,
    quotes: FileText,
    workflows: FlowArrow,
    ads: Megaphone,
    reports: ChartLine,
    outbound: PaperPlaneTilt,
    segments: UsersThree,
    settings: GearSix,
};

function pathMatches(
    current: string,
    href: string,
    exact?: boolean,
    extra: string[] = [],
    exclude: string[] = [],
): boolean {
    if (exclude.some((path) => current === path || current.startsWith(`${path}/`))) {
        return false;
    }

    if (exact) {
        return current === href || extra.includes(current);
    }

    return (
        current === href ||
        current.startsWith(`${href}/`) ||
        extra.some((path) => current === path || current.startsWith(`${path}/`))
    );
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
    const active = pathMatches(
        currentPath,
        item.href,
        item.exact,
        item.activePaths,
        item.excludePaths,
    );
    const row = (
        <Link
            href={item.href}
            prefetch
            title={t(item.label)}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            data-active={active || undefined}
            className={cn(
                'app-rail-item font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                labeled
                    ? 'flex h-9 w-full items-center gap-2 px-3 text-[13px] leading-[18px]'
                    : 'flex h-12 w-full items-center justify-center',
                active
                    ? 'bg-sidebar-accent font-medium text-sidebar-ink'
                    : 'text-sidebar-mute hover:bg-sidebar-hover hover:text-sidebar-ink',
            )}
        >
            <Icon
                className="size-5 shrink-0"
                weight={active ? 'fill' : 'regular'}
            />
            {labeled ? <span className="truncate">{t(item.label)}</span> : null}
        </Link>
    );

    if (labeled) {
        return row;
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>{row}</TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
                {t(item.label)}
            </TooltipContent>
        </Tooltip>
    );
}

export function AppSidebar() {
    const { isMobile, openMobile, toggleSidebar, state } = useSidebar();
    const page = usePage();
    const currentPath = new URL(page.url, 'http://localhost').pathname;
    const [moreOpen, setMoreOpen] = useState(false);
    const moreRef = useRef<HTMLLIElement>(null);
    const { simpleMode, nav } = useSimpleMode();
    const labeled = isMobile || state === 'expanded';
    const allowedIds = simpleMode ? new Set(nav.map((item) => item.id)) : null;
    const launchIcons = Object.fromEntries(
        nav.map((item) => [item.id, NAV_ICONS[item.id] ?? House]),
    ) as Record<string, Icon>;

    const visibleGroups = NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items
            .filter((item) => !allowedIds || allowedIds.has(item.id))
            .map((item) => ({
                ...item,
                icon: simpleMode ? (launchIcons[item.id] ?? item.icon) : item.icon,
            })),
    })).filter((group) => group.items.length > 0);

    const groupedIds = new Set(NAV_GROUPS.flatMap((group) => group.items.map((item) => item.id)));
    const extraLeaves = simpleMode
        ? nav
              .filter((item) => !groupedIds.has(item.id) && item.id !== 'settings')
              .map((item) => ({
                  ...item,
                  icon: launchIcons[item.id] ?? House,
              }))
        : [];

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
            <div
                className={cn(
                    'flex h-12 shrink-0 items-center',
                    labeled ? 'gap-2 px-3' : 'justify-center px-1',
                )}
            >
                <AppLogoIcon className="size-7" />
                {labeled ? (
                    <span className="truncate text-[13px] leading-[18px] font-medium text-sidebar-ink">
                        EvoCrm
                    </span>
                ) : (
                    <span className="sr-only">EvoCrm</span>
                )}
            </div>

            <nav
                aria-label="EvoCrm"
                className={cn(
                    'no-scrollbar min-h-0 flex-grow overflow-y-auto py-1',
                    labeled ? 'px-2' : 'px-1',
                )}
            >
                <ul className={cn('m-0 flex list-none flex-col gap-0.5', !labeled && 'items-center')}>
                    {visibleGroups.map((group) => (
                        <li key={group.id} className="w-full">
                            {group.label && labeled ? (
                                <p className="text-meta px-3 pt-3 pb-1 font-medium text-sidebar-mute">
                                    {t(group.label)}
                                </p>
                            ) : null}
                            <ul
                                className={cn(
                                    'm-0 flex list-none flex-col gap-0.5',
                                    !labeled && 'items-center',
                                )}
                                data-nav={group.id === 'crm' ? 'crm-objects' : undefined}
                            >
                                {group.items.map((item) => (
                                    <li key={item.id} className="w-full">
                                        <RailLink
                                            item={item}
                                            currentPath={currentPath}
                                            labeled={labeled}
                                            onNavigate={closeMobile}
                                        />
                                    </li>
                                ))}
                            </ul>
                        </li>
                    ))}
                    {extraLeaves.map((item) => (
                        <li key={item.id} className="w-full">
                            <RailLink
                                item={item}
                                currentPath={currentPath}
                                labeled={labeled}
                                onNavigate={closeMobile}
                            />
                        </li>
                    ))}
                    {showMore ? (
                        <li ref={moreRef} className="relative w-full">
                            {labeled ? (
                                <p className="text-meta px-3 pt-3 pb-1 font-medium text-sidebar-mute">
                                    {t('More')}
                                </p>
                            ) : null}
                            <button
                                type="button"
                                title={t('More')}
                                aria-expanded={moreOpen}
                                aria-haspopup="menu"
                                data-active={moreOpen || undefined}
                                onClick={() => setMoreOpen((open) => !open)}
                                className={cn(
                                    'app-rail-item font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                                    labeled
                                        ? 'flex h-9 w-full items-center gap-2 px-3 text-[13px] leading-[18px]'
                                        : 'flex h-12 w-full items-center justify-center',
                                    moreOpen
                                        ? 'bg-sidebar-accent font-medium text-sidebar-ink'
                                        : 'text-sidebar-mute hover:bg-sidebar-hover hover:text-sidebar-ink',
                                )}
                            >
                                <DotsThree className="size-5" weight="bold" />
                                {labeled ? <span>{t('More')}</span> : null}
                            </button>
                            {moreOpen ? (
                                <div
                                    id="sidebar-more-panel"
                                    role="menu"
                                    className={cn(
                                        'z-[100] overflow-hidden rounded-[10px] border border-hairline bg-surface text-ink shadow-[var(--aurora-shadow-medium)]',
                                        labeled
                                            ? 'relative mt-1 w-full'
                                            : 'absolute top-0 left-[calc(100%+8px)] w-56',
                                    )}
                                >
                                    <ul className="m-0 list-none p-1" data-nav="crm-objects">
                                        {MORE_ITEMS.map((item) => {
                                            const Icon = item.icon;

                                            return (
                                                <li key={item.id}>
                                                    <Link
                                                        href={item.href}
                                                        role="menuitem"
                                                        className="flex h-9 items-center gap-2 rounded-lg px-2 text-[13px] leading-[18px] text-ink hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                                                        onClick={() => {
                                                            setMoreOpen(false);
                                                            closeMobile();
                                                        }}
                                                    >
                                                        <Icon className="size-4 shrink-0" />
                                                        <span className="truncate">{t(item.label)}</span>
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
