import { Link, router, usePage } from '@inertiajs/react';
import { ChevronUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

/**
 * EvoDesk (Chatwoot Community) next-sidebar, ported to React/Inertia.
 * Mirrors SidebarGroup.vue + SidebarGroupHeader.vue + SidebarGroupLeaf.vue:
 * one expanded group at a time, the group holding the active child
 * auto-expands, and a collapsed group still surfaces its active leaf.
 */

export type NavLeaf = {
    name: string;
    label: string;
    href: string;
    icon?: LucideIcon | null;
    /** Extra paths that also mark this leaf active (e.g. /desk). */
    activePaths?: string[];
    /** Query params that must be absent for the leaf to stay active. */
    absentParams?: string[];
};

export type NavGroupItem = {
    name: string;
    label: string;
    icon: LucideIcon;
    href?: string;
    external?: boolean;
    children?: NavLeaf[];
};

type NavContextValue = {
    expandedItem: string | null;
    toggleItem: (name: string) => void;
    expandItem: (name: string) => void;
};

const NavContext = createContext<NavContextValue | null>(null);

export function ChatwootNav({
    defaultExpanded,
    children,
}: {
    defaultExpanded?: string;
    children: ReactNode;
}) {
    const [expandedItem, setExpandedItem] = useState<string | null>(
        defaultExpanded ?? null,
    );

    const toggleItem = useCallback((name: string) => {
        setExpandedItem((current) => (current === name ? null : name));
    }, []);

    const expandItem = useCallback((name: string) => {
        setExpandedItem(name);
    }, []);

    const value = useMemo(
        () => ({ expandedItem, toggleItem, expandItem }),
        [expandedItem, toggleItem, expandItem],
    );

    return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

function useCurrentUrlParts(): URL {
    const pageUrl = usePage().url;

    return useMemo(() => {
        const base =
            typeof window !== 'undefined'
                ? window.location.origin
                : 'http://localhost';

        return new URL(pageUrl, base);
    }, [pageUrl]);
}

function pathMatches(currentPath: string, hrefPath: string): boolean {
    return currentPath === hrefPath || currentPath.startsWith(`${hrefPath}/`);
}

function leafIsActive(leaf: NavLeaf, current: URL): boolean {
    const href = new URL(leaf.href, current.origin);
    const pathHit =
        pathMatches(current.pathname, href.pathname) ||
        (leaf.activePaths ?? []).some((path) =>
            pathMatches(current.pathname, path),
        );

    if (!pathHit) {
        return false;
    }

    for (const [key, value] of href.searchParams.entries()) {
        if (current.searchParams.get(key) !== value) {
            return false;
        }
    }

    for (const key of leaf.absentParams ?? []) {
        if (current.searchParams.has(key)) {
            return false;
        }
    }

    return true;
}

const TREE_CONNECTOR =
    "before:content-[''] before:absolute before:start-0 before:w-0.5 before:h-full before:bg-sidebar-line first:before:rounded-t last:before:h-1/5 last:after:content-[''] last:after:absolute last:after:start-0 last:after:bottom-[calc(50%_-_2px)] last:after:h-3 last:after:w-2.5 last:after:border-b-2 last:after:border-s-2 last:after:rounded-es last:after:border-sidebar-line";

function NavLeafItem({
    leaf,
    active,
    visible,
}: {
    leaf: NavLeaf;
    active: boolean;
    visible: boolean;
}) {
    const Icon = leaf.icon;

    return (
        <li
            className={cn(
                'relative ms-3 min-w-0 py-0.5 ps-2 text-sidebar-mute',
                TREE_CONNECTOR,
                !visible && 'hidden',
            )}
        >
            <Link
                href={leaf.href}
                prefetch
                title={leaf.label}
                className={cn(
                    'group flex h-8 min-w-0 items-center gap-2 rounded-lg from-transparent via-sidebar-hover/70 to-sidebar-hover/70 px-2 py-1 hover:bg-gradient-to-r',
                    active && 'bg-sidebar-accent text-sidebar-ink',
                )}
            >
                {Icon && (
                    <span className="grid size-4 place-content-center rounded-full">
                        <Icon className="inline-block size-4" />
                    </span>
                )}
                <div className="min-w-0 flex-1 truncate text-sm">
                    {leaf.label}
                </div>
            </Link>
        </li>
    );
}

export function NavGroup({ item }: { item: NavGroupItem }) {
    const { state, isMobile } = useSidebar();
    const collapsed = state === 'collapsed' && !isMobile;
    const current = useCurrentUrlParts();
    const nav = useContext(NavContext);

    const hasChildren = !!item.children?.length;
    const activeChild = item.children?.find((leaf) =>
        leafIsActive(leaf, current),
    );
    const hasActiveChild = !!activeChild;
    const isActive = item.href
        ? pathMatches(
              current.pathname,
              new URL(item.href, current.origin).pathname,
          )
        : false;
    const isExpanded = nav?.expandedItem === item.name;

    // Auto-expand the group holding the active child, once per location.
    const autoExpandedFor = useRef<string | null>(null);
    useEffect(() => {
        if (!hasActiveChild || !nav) {
            return;
        }

        const key = `${current.pathname}${current.search}`;

        if (autoExpandedFor.current === key) {
            return;
        }

        autoExpandedFor.current = key;
        nav.expandItem(item.name);
    }, [hasActiveChild, current, nav, item.name]);

    const firstChild = item.children?.[0];

    const handleToggle = () => {
        if (!nav) {
            return;
        }

        if (hasChildren && !isExpanded && !hasActiveChild && firstChild) {
            router.visit(firstChild.href);
        }

        nav.toggleItem(item.name);
    };

    const handleChevron = (event: MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
        nav?.toggleItem(item.name);
    };

    const Icon = item.icon;

    if (collapsed) {
        const collapsedClass = cn(
            'flex size-10 items-center justify-center rounded-lg',
            isActive || hasActiveChild
                ? 'bg-sidebar-accent text-sidebar-ink'
                : 'text-sidebar-mute hover:bg-sidebar-accent',
        );

        return (
            <li className="grid min-w-0 cursor-pointer gap-1 text-sm select-none">
                {item.href && !hasChildren ? (
                    item.external ? (
                        <a
                            href={item.href}
                            title={item.label}
                            className={collapsedClass}
                        >
                            <Icon className="size-4" />
                        </a>
                    ) : (
                        <Link
                            href={item.href}
                            prefetch
                            title={item.label}
                            className={collapsedClass}
                        >
                            <Icon className="size-4" />
                        </Link>
                    )
                ) : (
                    <button
                        type="button"
                        title={item.label}
                        className={collapsedClass}
                        onClick={() => {
                            if (firstChild) {
                                router.visit(firstChild.href);
                            }
                        }}
                    >
                        <Icon className="size-4" />
                    </button>
                )}
            </li>
        );
    }

    const headerClass = cn(
        'flex h-8 min-w-0 items-center gap-2 rounded-lg px-1.5 py-1',
        isActive && !hasActiveChild
            ? 'bg-sidebar-accent font-medium text-sidebar-ink'
            : hasActiveChild
              ? 'font-medium text-sidebar-ink'
              : 'text-sidebar-mute hover:bg-sidebar-accent',
    );

    const headerInner = (
        <>
            <div className="relative flex items-center gap-2">
                <Icon className="size-4" />
            </div>
            <div className="flex min-w-0 flex-1 flex-grow items-center justify-between gap-1.5">
                <span
                    className={cn(
                        'truncate',
                        (isActive || hasActiveChild) && 'text-sm font-medium',
                    )}
                >
                    {item.label}
                </span>
            </div>
            {hasChildren && isExpanded && (
                <ChevronUp
                    className="size-3 shrink-0"
                    onClick={handleChevron}
                />
            )}
        </>
    );

    return (
        <li className="grid min-w-0 cursor-pointer gap-1 text-sm select-none">
            {item.href && !hasChildren ? (
                item.external ? (
                    <a
                        href={item.href}
                        title={item.label}
                        className={headerClass}
                    >
                        {headerInner}
                    </a>
                ) : (
                    <Link
                        href={item.href}
                        prefetch
                        title={item.label}
                        role="button"
                        draggable={false}
                        className={headerClass}
                        onClick={() => nav?.toggleItem(item.name)}
                    >
                        {headerInner}
                    </Link>
                )
            ) : (
                <div
                    role="button"
                    draggable={false}
                    title={item.label}
                    className={headerClass}
                    onClick={handleToggle}
                >
                    {headerInner}
                </div>
            )}

            {hasChildren && (
                <ul
                    className={cn(
                        'm-0 grid min-w-0 list-none',
                        !isExpanded && !hasActiveChild && 'hidden',
                    )}
                >
                    {item.children!.map((leaf) => (
                        <NavLeafItem
                            key={leaf.name}
                            leaf={leaf}
                            active={activeChild?.name === leaf.name}
                            visible={
                                isExpanded || activeChild?.name === leaf.name
                            }
                        />
                    ))}
                </ul>
            )}
        </li>
    );
}
