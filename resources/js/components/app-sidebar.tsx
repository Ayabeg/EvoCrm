import { Link, router, usePage } from '@inertiajs/react';
import type { Icon } from '@phosphor-icons/react';
import {
    AddressBook,
    Buildings,
    CaretDown,
    CaretRight,
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
    Plus,
    SquaresFour,
    Ticket,
    Tray,
    UsersThree,
} from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/evo/ui/dropdown-menu';
import { Sidebar, useSidebar } from '@/components/ui/sidebar';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/evo/ui/tooltip';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { useSimpleMode } from '@/hooks/use-simple-mode';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

export type AppId = 'vendre' | 'desk' | 'outbound' | 'ads' | 'reports';
export type RecentType = 'lead' | 'contact' | 'company' | 'deal' | 'quote';

export type NavLeaf = {
    id: string;
    label: string;
    href: string;
    icon: Icon;
    activePaths?: string[];
    excludePaths?: string[];
    exact?: boolean;
    hasObjectMenu?: boolean;
    createHref?: string;
    recentType?: RecentType;
};

type AppDefinition = {
    id: AppId;
    label: string;
    href: string;
    icon: Icon;
    items: NavLeaf[];
};

type MoreItem = NavLeaf & { category: string };

const HOME: NavLeaf = {
    id: 'home',
    label: 'Home',
    href: '/dashboard',
    icon: House,
    activePaths: ['/'],
};

const INBOX: NavLeaf = {
    id: 'inbox',
    label: 'Inbox',
    href: '/inbox',
    icon: Tray,
    activePaths: ['/desk', '/conversations'],
};

const VENDRE_OBJECTS: NavLeaf[] = [
    {
        id: 'leads',
        label: 'Leads',
        href: '/crm/leads',
        icon: Path,
        activePaths: ['/crm/leads/captures'],
        hasObjectMenu: true,
        createHref: '/crm/leads?create=1',
        recentType: 'lead',
    },
    {
        id: 'contacts',
        label: 'Contacts',
        href: '/crm/contacts',
        icon: AddressBook,
        hasObjectMenu: true,
        createHref: '/crm/contacts?create=1',
        recentType: 'contact',
    },
    {
        id: 'companies',
        label: 'Companies',
        href: '/crm/companies',
        icon: Buildings,
        hasObjectMenu: true,
        createHref: '/crm/companies?create=1',
        recentType: 'company',
    },
    {
        id: 'deals',
        label: 'Deals',
        href: '/crm/deals',
        icon: Handshake,
        activePaths: ['/crm/deals/board'],
        hasObjectMenu: true,
        createHref: '/crm/deals?create=1',
        recentType: 'deal',
    },
    {
        id: 'quotes',
        label: 'Quotes',
        href: '/crm/quotes',
        icon: FileText,
        hasObjectMenu: true,
        createHref: '/crm/quotes?create=1',
        recentType: 'quote',
    },
    { id: 'activities', label: 'Activities', href: '/crm/activities', icon: CheckSquare },
];

const APPS: AppDefinition[] = [
    {
        id: 'vendre',
        label: 'Vendre',
        href: '/crm/deals',
        icon: Handshake,
        items: [HOME, INBOX, ...VENDRE_OBJECTS],
    },
    {
        id: 'desk',
        label: 'Desk',
        href: '/inbox',
        icon: Tray,
        items: [
            HOME,
            INBOX,
            { id: 'tickets', label: 'Tickets', href: '/crm/tickets', icon: Ticket },
            { id: 'conversations', label: 'Conversations', href: '/conversations', icon: Tray },
        ],
    },
    {
        id: 'outbound',
        label: 'Outbound',
        href: '/outbound',
        icon: PaperPlaneTilt,
        items: [{ id: 'outbound', label: 'Outbound', href: '/outbound', icon: PaperPlaneTilt }],
    },
    {
        id: 'ads',
        label: 'Ads',
        href: '/ads',
        icon: Megaphone,
        items: [{ id: 'ads', label: 'Ads', href: '/ads', icon: Megaphone }],
    },
    {
        id: 'reports',
        label: 'Reports',
        href: '/reports',
        icon: ChartLine,
        items: [
            {
                id: 'reports',
                label: 'Reports',
                href: '/reports',
                icon: ChartLine,
                activePaths: ['/crm/reports', '/crm/report-builder'],
            },
            { id: 'funnels', label: 'Funnels', href: '/reports/funnels', icon: ChartLine },
        ],
    },
];

const PLUS_ITEMS: MoreItem[] = [
    { id: 'segments', label: 'Segments', href: '/crm/segments', icon: UsersThree, category: 'CRM' },
    {
        id: 'workflows',
        label: 'Workflows',
        href: '/crm/workflows',
        icon: FlowArrow,
        activePaths: ['/automation'],
        category: 'CRM',
    },
    {
        id: 'lead-captures',
        label: 'Lead captures',
        href: '/crm/leads/captures',
        icon: Path,
        category: 'CRM',
    },
    { id: 'tickets', label: 'Tickets', href: '/crm/tickets', icon: Ticket, category: 'Desk' },
    {
        id: 'outbound',
        label: 'Outbound',
        href: '/outbound',
        icon: PaperPlaneTilt,
        category: 'Outbound',
    },
    { id: 'ads', label: 'Ads', href: '/ads', icon: Megaphone, category: 'Ads' },
    { id: 'reports', label: 'Reports', href: '/reports', icon: ChartLine, category: 'Reports' },
];

const SETTINGS: NavLeaf = {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: GearSix,
};

const CRM_RAIL_OBJECTS: NavLeaf[] = [
    { id: 'contacts', label: 'Contacts', href: '/crm/contacts', icon: AddressBook },
    { id: 'companies', label: 'Companies', href: '/crm/companies', icon: Buildings },
    { id: 'deals', label: 'Deals', href: '/crm/deals', icon: Handshake },
    { id: 'leads', label: 'Leads', href: '/crm/leads', icon: Path },
    { id: 'tickets', label: 'Tickets', href: '/crm/tickets', icon: Ticket },
];

const ALL_LEAVES = [HOME, INBOX, ...VENDRE_OBJECTS, ...PLUS_ITEMS, SETTINGS];
const LEAF_BY_ID = new Map(ALL_LEAVES.map((item) => [item.id, item]));
const APP_BY_ID = new Map(APPS.map((app) => [app.id, app]));
const RECENT_LIMIT = 5;

type RecentRecord = {
    id: number;
    name: string;
    href: string;
};

function pathMatches(
    current: string,
    href: string,
    exact?: boolean,
    extra: string[] = [],
    exclude: string[] = [],
): boolean {
    const [hrefPath, hrefQuery] = href.split('?');
    const [currentPath, currentQuery = ''] = current.split('?');

    if (hrefQuery) {
        return currentPath === hrefPath && currentQuery.includes(hrefQuery);
    }

    if (exclude.some((path) => currentPath === path || currentPath.startsWith(`${path}/`))) {
        return false;
    }

    if (exact) {
        return currentPath === hrefPath || extra.includes(currentPath);
    }

    return (
        currentPath === hrefPath ||
        currentPath.startsWith(`${hrefPath}/`) ||
        extra.some((path) => currentPath === path || currentPath.startsWith(`${path}/`))
    );
}

function appFromPath(path: string): AppId | undefined {
    if (
        path.startsWith('/crm/leads') ||
        path.startsWith('/crm/contacts') ||
        path.startsWith('/crm/companies') ||
        path.startsWith('/crm/deals') ||
        path.startsWith('/crm/quotes') ||
        path.startsWith('/crm/activities') ||
        path === '/dashboard' ||
        path === '/'
    ) {
        return 'vendre';
    }

    if (
        path.startsWith('/inbox') ||
        path.startsWith('/desk') ||
        path.startsWith('/conversations') ||
        path.startsWith('/crm/tickets')
    ) {
        return 'desk';
    }

    if (path.startsWith('/outbound')) {
        return 'outbound';
    }

    if (path.startsWith('/ads')) {
        return 'ads';
    }

    if (
        path.startsWith('/reports') ||
        path.startsWith('/crm/reports') ||
        path.startsWith('/crm/report-builder')
    ) {
        return 'reports';
    }

    return undefined;
}

function storedApp(): AppId {
    if (typeof window === 'undefined') {
        return 'vendre';
    }

    const value = window.localStorage.getItem('evo:nav-app');

    return APP_BY_ID.has(value as AppId) ? (value as AppId) : 'vendre';
}

function objectName(type: RecentType): string {
    return {
        lead: 'Lead',
        contact: 'Contact',
        company: 'Company',
        deal: 'Deal',
        quote: 'Quote',
    }[type];
}

function recentStorageKey(type: RecentType): string {
    return `evo.nav.recent.${type}`;
}

function loadRecent(type: RecentType): RecentRecord[] {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const value = JSON.parse(window.localStorage.getItem(recentStorageKey(type)) ?? '[]');

        if (!Array.isArray(value)) {
            return [];
        }

        return value
            .filter(
                (entry): entry is RecentRecord =>
                    Boolean(entry) &&
                    typeof entry.id === 'number' &&
                    typeof entry.name === 'string' &&
                    typeof entry.href === 'string',
            )
            .slice(0, RECENT_LIMIT);
    } catch {
        return [];
    }
}

function saveRecent(type: RecentType, record: RecentRecord): void {
    if (typeof window === 'undefined') {
        return;
    }

    const next = [record, ...loadRecent(type).filter((item) => item.id !== record.id)].slice(
        0,
        RECENT_LIMIT,
    );

    try {
        window.localStorage.setItem(recentStorageKey(type), JSON.stringify(next));
    } catch {
        // Private mode or a full quota should not interrupt navigation.
    }
}

function recordName(value: unknown, type: RecentType, id: number): string {
    if (!value || typeof value !== 'object') {
        return `${objectName(type)} #${id}`;
    }

    const record = value as Record<string, unknown>;
    const fullName = [record.first_name, record.last_name]
        .filter((part): part is string => typeof part === 'string' && part.trim() !== '')
        .join(' ')
        .trim();
    const nestedDeal = record.deal;

    for (const candidate of [
        record.name,
        record.title,
        record.display_name,
        record.displayName,
        fullName,
        nestedDeal && typeof nestedDeal === 'object'
            ? (nestedDeal as Record<string, unknown>).title
            : null,
    ]) {
        if (typeof candidate === 'string' && candidate.trim() !== '') {
            return candidate;
        }
    }

    return `${objectName(type)} #${id}`;
}

function rememberCurrentRecord(path: string, props: Record<string, unknown>): void {
    const match = path.match(/^\/crm\/(leads|contacts|companies|deals|quotes)\/(\d+)$/);

    if (!match) {
        return;
    }

    const type = match[1] as RecentType;
    const id = Number(match[2]);
    const plural = `${type}s`;
    const candidate = props.record ?? props[type] ?? props[plural];

    saveRecent(type, {
        id,
        name: recordName(candidate, type, id),
        href: path,
    });
}

function newObjectLabel(item: NavLeaf): string {
    if (item.id === 'leads') {
        return t('New lead');
    }

    const type = item.recentType ? objectName(item.recentType) : item.label;

    return `${t('New')} ${t(type)}`;
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

    return (
        <div className="group/row flex w-full items-center">
            <Link
                href={item.href}
                prefetch
                title={t(item.label)}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                data-active={active || undefined}
                className={cn(
                    'app-rail-item relative font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                    labeled
                        ? 'flex h-9 min-w-0 flex-1 items-center gap-2 px-3 text-[13px] leading-[18px]'
                        : 'flex h-9 w-full items-center justify-center',
                    active
                        ? 'bg-sidebar-accent font-medium text-sidebar-ink before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:bg-[var(--evo-primary)]'
                        : 'text-sidebar-mute hover:bg-sidebar-hover hover:text-sidebar-ink',
                )}
            >
                <Icon className="size-4 shrink-0" weight={active ? 'fill' : 'regular'} />
                {labeled ? <span className="truncate">{t(item.label)}</span> : null}
            </Link>
            {labeled && item.hasObjectMenu && item.recentType ? (
                <ObjectMenu item={item} onNavigate={onNavigate} />
            ) : null}
        </div>
    );
}

function ObjectMenu({
    item,
    onNavigate,
}: {
    item: NavLeaf;
    onNavigate?: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [recents, setRecents] = useState<RecentRecord[]>(() => loadRecent(item.recentType!));
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        const onPointerDown = (event: MouseEvent) => {
            if (!menuRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const type = item.recentType!;
        const local = loadRecent(type);

        if (local.length === 0) {
            return;
        }

        const controller = new AbortController();
        const remoteById = new Map<number, RecentRecord>();

        void Promise.all(
            local.map(async (record) => {
                try {
                    const response = await fetch(
                        `/crm/command/search?q=${encodeURIComponent(record.name)}`,
                        {
                            headers: {
                                Accept: 'application/json',
                                'X-Requested-With': 'XMLHttpRequest',
                            },
                            signal: controller.signal,
                        },
                    );

                    if (!response.ok) {
                        return;
                    }

                    const payload = (await response.json()) as {
                        hits?: Array<{
                            id: number;
                            type: string;
                            label: string;
                            href: string;
                            recordRef?: { type?: string; id?: number } | null;
                        }>;
                    };

                    for (const hit of payload.hits ?? []) {
                        const hitType = hit.recordRef?.type ?? hit.type;

                        if (hitType === type && typeof hit.recordRef?.id === 'number') {
                            remoteById.set(hit.recordRef.id, {
                                id: hit.recordRef.id,
                                name: hit.label,
                                href: hit.href,
                            });
                        }
                    }
                } catch {
                    // The localStorage fallback remains usable when search is unavailable.
                }
            }),
        ).then(() => {
            if (!controller.signal.aborted && remoteById.size > 0) {
                setRecents(
                    [
                        ...remoteById.values(),
                        ...local.filter((record) => !remoteById.has(record.id)),
                    ].slice(0, RECENT_LIMIT),
                );
            }
        });

        return () => controller.abort();
    }, [item.recentType, open]);

    return (
        <div ref={menuRef} className="relative shrink-0">
            <button
                type="button"
                aria-label={open ? `${t('Close')} ${t(item.label)}` : `${t('Open')} ${t(item.label)}`}
                aria-expanded={open}
                title={t(item.label)}
                className="mr-1 grid size-7 place-items-center rounded-md text-sidebar-mute hover:bg-sidebar-hover hover:text-sidebar-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                onClick={(event) => {
                    event.stopPropagation();
                    setOpen((current) => !current);
                }}
            >
                {open ? <CaretDown className="size-3.5" aria-hidden /> : <CaretRight className="size-3.5" aria-hidden />}
            </button>
            {open ? (
                <div
                    role="menu"
                    className="absolute top-0 right-[calc(100%+8px)] z-[100] w-60 overflow-hidden rounded-[10px] border border-hairline bg-surface text-ink shadow-[var(--aurora-shadow-medium)]"
                >
                    <Link
                        href={item.createHref ?? item.href}
                        role="menuitem"
                        className="flex min-h-9 items-center gap-2 px-3 py-2 text-[13px] font-medium hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                        onClick={() => {
                            setOpen(false);
                            onNavigate?.();
                        }}
                    >
                        <Plus className="size-3.5 shrink-0" aria-hidden />
                        {newObjectLabel(item)}
                    </Link>
                    <div role="separator" className="border-t border-hairline" />
                    <div className="px-3 pt-2 pb-1 text-meta font-medium text-sidebar-mute">
                        {t('Recent records')}
                    </div>
                    {recents.length > 0 ? (
                        <ul className="m-0 list-none px-1 pb-1">
                            {recents.map((record) => (
                                <li key={`${item.recentType}-${record.id}`}>
                                    <Link
                                        href={record.href}
                                        role="menuitem"
                                        className="block truncate rounded-lg px-2 py-1.5 text-[13px] hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                                        onClick={() => {
                                            setOpen(false);
                                            onNavigate?.();
                                        }}
                                    >
                                        {record.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="px-3 pb-2 text-[13px] text-sidebar-mute">{t('Nothing recent')}</p>
                    )}
                    <Link
                        href={item.href}
                        role="menuitem"
                        className="block border-t border-hairline px-3 py-2 text-[13px] font-medium hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                        onClick={() => {
                            setOpen(false);
                            onNavigate?.();
                        }}
                    >
                        {t('View all')}
                    </Link>
                </div>
            ) : null}
        </div>
    );
}

function AppLauncher({
    currentApp,
    labeled,
    open,
    onOpenChange,
}: {
    currentApp: AppId;
    labeled: boolean;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const launcherRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        const onPointerDown = (event: MouseEvent) => {
            if (!launcherRef.current?.contains(event.target as Node)) {
                onOpenChange(false);
            }
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onOpenChange(false);
            }
        };

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [onOpenChange, open]);

    return (
        <div ref={launcherRef} className="relative shrink-0">
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        aria-label={t('Apps')}
                        aria-expanded={open}
                        title={t('Apps')}
                        className={cn(
                            'grid size-8 place-items-center rounded-lg text-sidebar-mute hover:bg-sidebar-hover hover:text-sidebar-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                            open && 'bg-sidebar-accent text-sidebar-ink',
                        )}
                        onClick={() => onOpenChange(!open)}
                    >
                        <SquaresFour className="size-4" weight={open ? 'fill' : 'regular'} aria-hidden />
                    </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                    {t('Apps')}
                </TooltipContent>
            </Tooltip>
            {open ? (
                <div
                    role="menu"
                    className={cn(
                        'absolute z-[100] w-60 overflow-hidden rounded-[10px] border border-hairline bg-surface p-1 text-ink shadow-[var(--aurora-shadow-medium)]',
                        labeled ? 'top-full right-0 mt-2' : 'top-0 left-[calc(100%+8px)]',
                    )}
                >
                    {APPS.map((app) => {
                        const AppIcon = app.icon;

                        return (
                            <button
                                key={app.id}
                                type="button"
                                role="menuitem"
                                aria-current={app.id === currentApp ? 'page' : undefined}
                                className={cn(
                                    'flex h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-[13px] hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                                    app.id === currentApp && 'font-medium',
                                )}
                                onClick={() => {
                                    window.localStorage.setItem('evo:nav-app', app.id);
                                    onOpenChange(false);
                                    router.visit(app.href);
                                }}
                            >
                                <AppIcon className="size-4 shrink-0" weight={app.id === currentApp ? 'fill' : 'regular'} />
                                <span className="truncate">{t(app.label)}</span>
                            </button>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
}

function UserChip({ onNavigate }: { onNavigate?: () => void }) {
    const page = usePage();
    const initials = useInitials();
    const user = (page.props.auth as { user?: User } | undefined)?.user;

    if (!user?.name) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="mt-1 flex h-9 w-full items-center gap-2 rounded-lg px-2 text-left hover:bg-sidebar-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                    title={user.name}
                    aria-label={t(':name account menu', { name: user.name })}
                >
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-sidebar-accent text-meta font-medium text-sidebar-ink">
                        {initials(user.name)}
                    </span>
                    <span className="min-w-0 leading-tight">
                        <span className="block truncate text-[13px] font-medium text-sidebar-ink">{user.name}</span>
                        {user.role ? <span className="block truncate text-meta text-sidebar-mute">{user.role}</span> : null}
                    </span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64" onClick={onNavigate}>
                <UserMenuContent user={user} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function AppSidebar() {
    const { isMobile, openMobile, toggleSidebar, state } = useSidebar();
    const page = usePage();
    const currentPath = (page.url.split('#')[0] ?? '/').split('?')[0] ?? '/';
    const { simpleMode, nav, features } = useSimpleMode();
    const labeled = isMobile || state === 'expanded';
    const [appLauncherOpen, setAppLauncherOpen] = useState(false);
    const [storedAppId] = useState<AppId>(() => storedApp());
    const pathAppId = appFromPath(currentPath);
    const currentApp = pathAppId ?? storedAppId;
    const moreRef = useRef<HTMLLIElement>(null);
    const [moreOpen, setMoreOpen] = useState(false);
    useEffect(() => {
        rememberCurrentRecord(currentPath, page.props as Record<string, unknown>);
    }, [currentPath, page.props]);

    useEffect(() => {
        if (!moreOpen) {
            return;
        }

        const onPointerDown = (event: MouseEvent) => {
            if (!moreRef.current?.contains(event.target as Node)) {
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

    const app = APP_BY_ID.get(currentApp) ?? APPS[0];
    const simpleItems = nav
        .map((item) => {
            const known = LEAF_BY_ID.get(item.id);

            return known ?? { ...item, icon: House };
        })
        .filter((item) => item.id !== 'settings');
    const items = simpleMode ? simpleItems : app.items;
    const topItems = items.filter((item) => item.id === 'home' || item.id === 'inbox');
    const bodyItems = items.filter((item) => item.id !== 'home' && item.id !== 'inbox');
    const plusItems = PLUS_ITEMS.filter((item) => item.id !== 'ads' || features.ads);
    const plusActive = plusItems.some((item) =>
        pathMatches(currentPath, item.href, item.exact, item.activePaths, item.excludePaths),
    );

    return (
        <Sidebar collapsible="icon" className="bg-sidebar" data-cabinet="rail">
            <div
                data-sidebar-brand
                className={cn(
                    'relative flex h-14 shrink-0',
                    labeled ? 'items-center gap-2 px-3' : 'flex-col items-center justify-center gap-1 px-1',
                )}
            >
                <Link href="/dashboard" className="flex min-w-0 items-center gap-2" title="EvoCRM">
                    <AppLogoIcon className="size-7 shrink-0" />
                    {labeled ? (
                        <span className="truncate text-[13px] leading-[18px] font-medium text-sidebar-ink">
                            Evotechly / EvoCRM
                        </span>
                    ) : (
                        <span className="sr-only">Evotechly / EvoCRM</span>
                    )}
                </Link>
                {!simpleMode ? (
                    <AppLauncher
                        currentApp={currentApp}
                        labeled={labeled}
                        open={appLauncherOpen}
                        onOpenChange={setAppLauncherOpen}
                    />
                ) : null}
            </div>

            <nav
                aria-label="EvoCrm"
                className={cn(
                    'no-scrollbar min-h-0 flex-grow overflow-y-auto py-1',
                    labeled ? 'px-2' : 'px-1',
                )}
            >
                <ul className={cn('m-0 flex list-none flex-col gap-0.5', !labeled && 'items-center')}>
                    {topItems.map((item) => (
                        <li key={item.id} className="w-full">
                            <RailLink
                                item={item}
                                currentPath={currentPath}
                                labeled={labeled}
                                onNavigate={closeMobile}
                            />
                        </li>
                    ))}
                    {bodyItems.length > 0 ? (
                        <li className="w-full">
                            {currentApp === 'vendre' || simpleMode ? (
                                <p className="text-meta px-3 pt-3 pb-1 font-medium text-sidebar-mute">
                                    {t('Vendre')}
                                </p>
                            ) : null}
                            <ul
                                className={cn('m-0 flex list-none flex-col gap-0.5', !labeled && 'items-center')}
                                data-nav={currentApp === 'vendre' || simpleMode ? 'crm-objects' : undefined}
                            >
                                {bodyItems.map((item) => (
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
                    ) : null}
                    {!simpleMode ? (
                        <li ref={moreRef} className="relative w-full">
                            {labeled ? (
                                <p className="text-meta px-3 pt-3 pb-1 font-medium text-sidebar-mute">{t('More')}</p>
                            ) : null}
                            <button
                                type="button"
                                title={t('More')}
                                aria-label={t('More')}
                                aria-expanded={moreOpen}
                                aria-haspopup="menu"
                                data-active={moreOpen || plusActive || undefined}
                                onClick={() => setMoreOpen((open) => !open)}
                                className={cn(
                                    'app-rail-item relative font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                                    labeled
                                        ? 'flex h-9 w-full items-center gap-2 px-3 text-[13px] leading-[18px]'
                                        : 'flex h-9 w-full items-center justify-center',
                                    moreOpen || plusActive
                                        ? 'bg-sidebar-accent font-medium text-sidebar-ink before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:bg-[var(--evo-primary)]'
                                        : 'text-sidebar-mute hover:bg-sidebar-hover hover:text-sidebar-ink',
                                )}
                            >
                                <DotsThree className="size-4 shrink-0" weight="bold" aria-hidden />
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
                                            : 'absolute top-0 left-[calc(100%+8px)] w-60',
                                    )}
                                >
                                    <ul className="m-0 list-none p-1" data-nav="crm-objects">
                                        {plusItems.map((item, index) => {
                                            const previous = plusItems[index - 1];
                                            const ItemIcon = item.icon;

                                            return (
                                                <li key={item.id}>
                                                    {previous?.category !== item.category ? (
                                                        <p className="px-2 pt-2 pb-1 text-meta font-medium text-sidebar-mute">
                                                            {t(item.category)}
                                                        </p>
                                                    ) : null}
                                                    <Link
                                                        href={item.href}
                                                        role="menuitem"
                                                        className="flex h-9 items-center gap-2 rounded-lg px-2 text-[13px] leading-[18px] hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                                                        onClick={() => {
                                                            setMoreOpen(false);
                                                            closeMobile();
                                                        }}
                                                    >
                                                        <ItemIcon className="size-4 shrink-0" />
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

            <footer
                className={cn(
                    'flex shrink-0 flex-col border-t border-sidebar-line pb-2',
                    labeled ? 'px-2 pt-2' : 'items-center px-1 pt-2',
                )}
            >
                <RailLink
                    item={SETTINGS}
                    currentPath={currentPath}
                    labeled={labeled}
                    onNavigate={closeMobile}
                />
                {labeled ? <UserChip onNavigate={closeMobile} /> : null}
            </footer>
        </Sidebar>
    );
}

export { APPS, CRM_RAIL_OBJECTS, HOME, INBOX, PLUS_ITEMS, SETTINGS, VENDRE_OBJECTS };
