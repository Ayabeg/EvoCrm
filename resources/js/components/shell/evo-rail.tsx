import { Link, usePage } from '@inertiajs/react';
import { Bell } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { TasksOverlay } from '@/components/crm/tasks-overlay';
import {
    activeParentId,
    activeNavId,
    isNavigationChildActive,
    visibleSections,
    visibleSettings,
} from '@/components/shell/product-nav';
import type { NavItem } from '@/components/shell/product-nav';
import { UserMenuContent } from '@/components/user-menu-content';
import { CaretDown, CaretLeft, CaretRight, GearSix, MagnifyingGlass, Plus } from '@/evo/icons';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/evo/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/evo/ui/tooltip';
import { useInitials } from '@/hooks/use-initials';
import { useSimpleMode } from '@/hooks/use-simple-mode';
import { canCreateQuote } from '@/lib/command-os';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { User } from '@/types/auth';

const rowClass =
    'evo-nav-link relative flex h-8 w-full items-center gap-2 rounded-[6px] px-2 text-start text-[13px] font-medium text-[var(--evo-ink-secondary)] transition-colors duration-[var(--evo-duration-micro)] hover:bg-[var(--evo-sidebar-hover)] motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evo-focus)]';

const iconTargetClass =
    'grid size-10 shrink-0 place-items-center rounded-[6px] text-[var(--evo-ink-secondary)] hover:bg-[var(--evo-sidebar-hover)] hover:text-[var(--evo-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evo-focus)]';

export function EvoRail({
    collapsed = false,
    onNavigate,
    onToggleCollapsed,
    onOpenPalette,
}: {
    collapsed?: boolean;
    onNavigate?: () => void;
    onToggleCollapsed?: () => void;
    onOpenPalette?: () => void;
}) {
    const page = usePage();
    const path = (page.url.split('?')[0] ?? '/').split('#')[0] ?? '/';
    const { simpleMode, nav, features } = useSimpleMode();
    const initials = useInitials();
    const user = page.props.auth?.user as User | undefined;
    const workspace = page.props.workspace as { name?: string } | null;
    const workspaceName = workspace?.name?.trim() || 'EvoCRM';
    const rawCapabilities = page.props.auth?.capabilities;
    const capabilities = Array.isArray(rawCapabilities)
        ? (rawCapabilities as string[])
        : [];
    const capabilitySet = capabilities.length > 0 ? new Set(capabilities) : null;
    const taskCount = Number(page.props.evoOpenTaskCount ?? 0);
    const [createOpen, setCreateOpen] = useState(false);
    const [tasksOpen, setTasksOpen] = useState(false);
    const allowed = simpleMode ? new Set(nav.map((item) => item.id)) : null;
    const sections = visibleSections(
        simpleMode,
        allowed,
        features,
        capabilitySet,
    );
    const activeId = activeNavId(path, sections);
    const activeGroupId = activeParentId(path, sections);
    const settingsActive =
        path === '/settings' || path.startsWith('/settings/');
    const settingsItem = visibleSettings(capabilitySet);
    const [manualOpenGroupId, setManualOpenGroupId] = useState<string | null>(
        null,
    );
    const openGroupId =
        activeGroupId ??
        (settingsActive ? settingsItem.id : manualOpenGroupId);

    useEffect(() => {
        const openCreate = () => setCreateOpen(true);
        const openTasks = () => setTasksOpen(true);
        window.addEventListener('openEvoCreate', openCreate);
        window.addEventListener('openEvoTasks', openTasks);

        return () => {
            window.removeEventListener('openEvoCreate', openCreate);
            window.removeEventListener('openEvoTasks', openTasks);
        };
    }, []);

    const searchControl = (
        <button
            type="button"
            data-chrome="search"
            data-command-trigger="search"
            aria-label={t('Search EvoCRM…')}
            className={cn(
                collapsed
                    ? iconTargetClass
                    : 'flex h-8 w-full items-center gap-2 rounded-[6px] border border-[var(--evo-hairline)] bg-[var(--evo-surface)] px-2 text-start text-[13px] text-[var(--evo-ink-muted)] hover:bg-[var(--evo-sidebar-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evo-focus)]',
            )}
            onClick={onOpenPalette}
        >
            <MagnifyingGlass className="size-4 shrink-0" weight="regular" />
            {collapsed ? null : (
                <span className="min-w-0 flex-1 truncate">{t('Search EvoCRM…')}</span>
            )}
            {collapsed ? null : (
                <kbd className="text-[11px] text-[var(--evo-ink-faint)]">⌘K</kbd>
            )}
        </button>
    );

    const createMenu = (
        <DropdownMenu open={createOpen} onOpenChange={setCreateOpen}>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    data-chrome="create"
                    title={t('Create')}
                    aria-label={t('Create')}
                    className={cn(
                        collapsed
                            ? iconTargetClass
                            : 'inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-[6px] border border-[var(--evo-hairline)] bg-[var(--evo-surface)] px-2 text-[13px] font-medium text-[var(--evo-ink)] hover:bg-[var(--evo-sidebar-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evo-focus)]',
                    )}
                >
                    <Plus className="size-4" weight="bold" aria-hidden />
                    {collapsed ? null : <span>{t('Create')}</span>}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuItem asChild>
                    <Link href="/crm/contacts?create=1" onClick={onNavigate}>
                        {t('Contact')}
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/crm/companies?create=1" onClick={onNavigate}>
                        {t('Company')}
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/crm/leads?create=1" onClick={onNavigate}>
                        {t('Lead')}
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/crm/deals?create=1" onClick={onNavigate}>
                        {t('Deal')}
                    </Link>
                </DropdownMenuItem>
                {canCreateQuote(capabilities) ? (
                    <DropdownMenuItem asChild>
                        <Link href="/crm/quotes?create=1" onClick={onNavigate}>
                            {t('Quote')}
                        </Link>
                    </DropdownMenuItem>
                ) : null}
            </DropdownMenuContent>
        </DropdownMenu>
    );

    const tasksButton = (
        <button
            type="button"
            data-chrome="notify"
            title={t('Tasks')}
            aria-label={
                taskCount > 0 ? `${t('Tasks')} (${taskCount})` : t('Tasks')
            }
            className={cn(iconTargetClass, 'relative')}
            onClick={() => setTasksOpen(true)}
        >
            <Bell className="size-4" weight="regular" aria-hidden />
            {taskCount > 0 ? (
                <span className="absolute top-1 end-1 grid min-w-3.5 place-items-center rounded-full bg-[var(--evo-teal)] px-0.5 text-[10px] leading-none text-[var(--evo-surface)]">
                    {taskCount > 99 ? '99+' : taskCount}
                </span>
            ) : null}
        </button>
    );

    if (collapsed) {
        return (
            <nav
                aria-label={t('Menu')}
                className="flex h-full min-h-0 w-full flex-col items-center bg-[var(--evo-sidebar)] py-2"
            >
                <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                        <Link
                            href="/dashboard"
                            className="mb-2 grid size-10 place-items-center"
                            aria-label={workspaceName}
                        >
                            <AppLogoIcon className="size-5" />
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{workspaceName}</TooltipContent>
                </Tooltip>
                {onToggleCollapsed ? (
                    <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                className={cn(iconTargetClass, 'mb-2')}
                                aria-label={t('Expand sidebar')}
                                aria-expanded={false}
                                onClick={onToggleCollapsed}
                            >
                                <CaretRight
                                    className="size-4 rtl:rotate-180"
                                    weight="regular"
                                />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            {t('Expand sidebar')} · ⌘\
                        </TooltipContent>
                    </Tooltip>
                ) : null}
                <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>{searchControl}</TooltipTrigger>
                    <TooltipContent side="right">
                        {t('Search EvoCRM…')} · ⌘K
                    </TooltipContent>
                </Tooltip>
                <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>{createMenu}</TooltipTrigger>
                    <TooltipContent side="right">{t('Create')} · C</TooltipContent>
                </Tooltip>
                <div className="evo-scroll mt-2 flex min-h-0 flex-1 flex-col items-center gap-0.5 overflow-y-auto">
                    {sections.flatMap((section) =>
                        section.items.map((item) => (
                            <CollapsedNavItem
                                key={item.id}
                                item={item}
                                active={
                                    activeId === item.id ||
                                    Boolean(
                                        item.children?.some((child) =>
                                            isNavigationChildActive(path, child),
                                        ),
                                    )
                                }
                                onNavigate={onNavigate}
                            />
                        )),
                    )}
                </div>
                <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                        <Link
                            href="/settings"
                            aria-current={settingsActive ? 'page' : undefined}
                            aria-label={t(settingsItem.labelKey)}
                            className={cn(
                                iconTargetClass,
                                settingsActive &&
                                    'bg-[var(--evo-teal-soft)] text-[var(--evo-teal-ink)]',
                            )}
                            onClick={onNavigate}
                        >
                            <GearSix className="size-5" weight="regular" />
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        {t(settingsItem.labelKey)} · G P
                    </TooltipContent>
                </Tooltip>
                <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>{tasksButton}</TooltipTrigger>
                    <TooltipContent side="right">{t('Tasks')} · G N</TooltipContent>
                </Tooltip>
                {user ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="mt-1 grid size-10 place-items-center rounded-full"
                                title={user.name}
                                aria-label={t(':name account menu', {
                                    name: user.name,
                                })}
                            >
                                <span className="grid size-6 place-items-center rounded-full bg-[var(--evo-teal-soft)] text-[11px] font-medium text-[var(--evo-teal)]">
                                    {initials(user.name)}
                                </span>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-64">
                            <UserMenuContent user={user} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : null}
                <TasksOverlay open={tasksOpen} onOpenChange={setTasksOpen} />
            </nav>
        );
    }

    return (
        <div className="relative flex h-full min-h-0 w-full min-w-0 flex-col bg-[var(--evo-sidebar)]">
            <div className="flex h-12 shrink-0 items-center gap-2 px-3">
                <AppLogoIcon className="size-5 shrink-0" />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--evo-ink)]">
                    {workspaceName}
                </span>
                {onToggleCollapsed ? (
                    <button
                        type="button"
                        className="grid size-8 shrink-0 place-items-center rounded-[6px] text-[var(--evo-ink-muted)] hover:bg-[var(--evo-sidebar-hover)] hover:text-[var(--evo-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evo-focus)]"
                        aria-label={t('Collapse sidebar')}
                        aria-expanded={true}
                        onClick={onToggleCollapsed}
                    >
                        <CaretLeft
                            className="size-4 rtl:rotate-180"
                            weight="regular"
                        />
                    </button>
                ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-1.5 px-2 pb-2">
                <div className="min-w-0 flex-1">{searchControl}</div>
                {createMenu}
            </div>
            <nav
                aria-label={t('Menu')}
                className="evo-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-2"
            >
                {sections.map((section) => (
                    <section
                        key={section.id}
                        className={section.labelKey ? 'mt-3' : undefined}
                    >
                        {section.labelKey ? (
                            <h2 className="evo-nav-section-label mb-1 px-2 text-[11px] font-medium text-[var(--evo-ink-muted)]">
                                {t(section.labelKey)}
                            </h2>
                        ) : null}
                        <ul className="flex flex-col gap-0.5">
                            {section.items.map((item) => (
                                <li key={item.id}>
                                    <NavGroup
                                        item={item}
                                        activeId={
                                            settingsActive ? undefined : activeId
                                        }
                                        path={path}
                                        open={openGroupId === item.id}
                                        onToggle={() =>
                                            setManualOpenGroupId((current) =>
                                                current === item.id
                                                    ? null
                                                    : item.id,
                                            )
                                        }
                                        onNavigate={onNavigate}
                                    />
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </nav>
            <footer className="shrink-0 border-t border-[var(--evo-hairline)] px-2 py-2">
                <Link
                    href="/settings"
                    aria-current={settingsActive ? 'page' : undefined}
                    className={cn(rowClass, settingsActive && 'font-medium')}
                    onClick={onNavigate}
                >
                    <GearSix className="size-4 shrink-0" weight="regular" />
                    <span className="evo-nav-label min-w-0 flex-1 truncate">
                        {t(settingsItem.labelKey)}
                    </span>
                </Link>
                {user ? (
                    <div className="mt-1 flex h-11 items-center gap-1">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-[6px] px-2 text-start hover:bg-[var(--evo-sidebar-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evo-focus)]"
                                    title={user.name}
                                    aria-label={t(':name account menu', {
                                        name: user.name,
                                    })}
                                >
                                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--evo-teal-soft)] text-[11px] font-medium text-[var(--evo-teal)]">
                                        {initials(user.name)}
                                    </span>
                                    <span className="min-w-0 truncate text-[13px] font-medium text-[var(--evo-ink)]">
                                        {user.name}
                                    </span>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-64">
                                <UserMenuContent user={user} />
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {tasksButton}
                    </div>
                ) : null}
            </footer>
            <TasksOverlay open={tasksOpen} onOpenChange={setTasksOpen} />
        </div>
    );
}

function CollapsedNavItem({
    item,
    active,
    onNavigate,
}: {
    item: NavItem;
    active: boolean;
    onNavigate?: () => void;
}) {
    const Icon = item.icon;

    return (
        <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
                <Link
                    href={item.href}
                    prefetch
                    aria-current={active ? 'page' : undefined}
                    aria-label={t(item.labelKey)}
                    className={cn(
                        iconTargetClass,
                        active &&
                            'bg-[var(--evo-teal-soft)] text-[var(--evo-teal-ink)]',
                    )}
                    onClick={onNavigate}
                >
                    <Icon className="size-5" weight="regular" />
                </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{t(item.labelKey)}</TooltipContent>
        </Tooltip>
    );
}

function NavRow({
    item,
    active,
    onNavigate,
}: {
    item: NavItem;
    active: boolean;
    onNavigate?: () => void;
}) {
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            prefetch
            aria-current={active ? 'page' : undefined}
            aria-label={t(item.labelKey)}
            className={cn(rowClass, active && 'font-medium')}
            onClick={onNavigate}
        >
            <Icon className="size-4 shrink-0" weight="regular" />
            <span
                className="evo-nav-label min-w-0 flex-1 truncate"
                data-active={active ? 'true' : 'false'}
            >
                {t(item.labelKey)}
            </span>
        </Link>
    );
}

function NavGroup({
    item,
    activeId,
    active = false,
    path,
    open,
    onToggle,
    onNavigate,
}: {
    item: NavItem;
    activeId?: string;
    active?: boolean;
    path: string;
    open: boolean;
    onToggle: () => void;
    onNavigate?: () => void;
}) {
    const childActive =
        item.children?.some((child) =>
            isNavigationChildActive(path, child),
        ) ?? false;
    const parentActive = active || activeId === item.id || childActive;

    if (!item.children?.length) {
        return (
            <NavRow
                item={item}
                active={activeId === item.id}
                onNavigate={onNavigate}
            />
        );
    }

    const childrenId = `nav-children-${item.id}`;

    return (
        <div>
            <button
                type="button"
                className={cn(
                    rowClass,
                    'group',
                    parentActive &&
                        'bg-[var(--evo-teal-soft)] font-medium text-[var(--evo-teal-ink)]',
                )}
                aria-expanded={open}
                aria-controls={childrenId}
                onClick={onToggle}
            >
                <item.icon
                    aria-hidden
                    className="size-4 shrink-0"
                    weight="regular"
                />
                <span className="evo-nav-label min-w-0 flex-1 truncate">
                    {t(item.labelKey)}
                </span>
                <span
                    aria-hidden
                    className="grid size-5 shrink-0 place-items-center text-[var(--evo-ink-muted)]"
                    data-open={open ? 'true' : 'false'}
                >
                    {open ? (
                        <CaretDown className="size-3.5" />
                    ) : (
                        <CaretRight className="size-3.5 rtl:rotate-180" />
                    )}
                </span>
            </button>
            <ul
                id={childrenId}
                className={cn(
                    'evo-nav-children mt-0.5 flex flex-col gap-0.5 overflow-hidden ps-3',
                    open
                        ? 'max-h-[28rem] opacity-100'
                        : 'pointer-events-none max-h-0 opacity-0',
                )}
                aria-hidden={!open}
                inert={!open}
            >
                {item.children.map((child) => (
                    <li key={child.id}>
                        <Link
                            href={child.href}
                            prefetch
                            aria-current={
                                activeId === child.id ? 'page' : undefined
                            }
                            className={cn(
                                rowClass,
                                'pe-2 ps-8',
                                isNavigationChildActive(path, child) &&
                                    'font-medium text-[var(--evo-teal-ink)]',
                            )}
                            onClick={onNavigate}
                        >
                            <span className="truncate">{t(child.labelKey)}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
