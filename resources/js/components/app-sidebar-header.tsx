/**
 * Canonical topbar (P02/P16): Search/⌘K and Sparkle open the SAME Command OS.
 * Create stays the existing dropdown. One Tasks overlay. No second palette.
 */
import { Link, usePage } from '@inertiajs/react';
import { Bell, MagnifyingGlass, Plus, Sparkle } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { CommandPalette, useCommandPaletteShortcut } from '@/components/crm/command-palette';
import { TasksOverlay } from '@/components/crm/tasks-overlay';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import {
    COMMAND_FOCUS_OPEN_SUPPRESS_MS,
    canCreateQuote,
    shouldOpenCommandFromSearchFocus,
} from '@/lib/command-os';
import { t } from '@/lib/i18n';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const page = usePage();
    const { auth } = page.props;
    const { isMobile, state } = useSidebar();
    const collapsed = !isMobile && state === 'collapsed';
    const taskCount = Number(page.props.evoOpenTaskCount ?? 0);
    const initials = useInitials();
    const user = auth.user;
    const capabilities = Array.isArray(auth.capabilities) ? auth.capabilities : [];
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [tasksOpen, setTasksOpen] = useState(false);
    const suppressSearchFocusOpenRef = useRef(false);
    void breadcrumbs;

    useCommandPaletteShortcut(() => setPaletteOpen((current) => !current));

    const handlePaletteOpenChange = (next: boolean) => {
        if (!next) {
            suppressSearchFocusOpenRef.current = true;
            window.setTimeout(() => {
                suppressSearchFocusOpenRef.current = false;
            }, COMMAND_FOCUS_OPEN_SUPPRESS_MS);
        }

        setPaletteOpen(next);
    };

    const openFromSearchFocus = () => {
        if (!shouldOpenCommandFromSearchFocus(suppressSearchFocusOpenRef.current)) {
            return;
        }

        setPaletteOpen(true);
    };

    useEffect(() => {
        const open = () => setTasksOpen(true);
        window.addEventListener('openEvoTasks', open);

        return () => window.removeEventListener('openEvoTasks', open);
    }, []);

    return (
        <>
            <header className="app-topbar sticky top-0 z-20 flex min-w-0 shrink-0 items-center gap-1.5 px-3 sm:gap-3 sm:px-4">
                <div data-chrome="menu">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <SidebarTrigger className="-ml-0.5 h-9 w-9 shrink-0 text-ink" />
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Toggle sidebar</TooltipContent>
                    </Tooltip>
                </div>
                {collapsed ? (
                    <Link
                        href="/dashboard"
                        title="EvoCrm"
                        className="hidden shrink-0 items-center gap-2 md:flex"
                    >
                        <AppLogoIcon className="size-6" />
                        <span className="sr-only">EvoCrm</span>
                    </Link>
                ) : null}
                <div className="relative w-[min(100%,200px)] shrink-0 sm:w-[240px] lg:w-[280px]" data-chrome="search">
                    <Input
                        readOnly
                        value=""
                        placeholder={t('Search EvoCRM…')}
                        aria-label={t('Search EvoCRM…')}
                        data-command-trigger="search"
                        onClick={() => setPaletteOpen(true)}
                        onFocus={openFromSearchFocus}
                        startAdornment={
                            <MagnifyingGlass className="size-4" weight="regular" aria-hidden />
                        }
                        className="app-search-trigger cursor-pointer pr-3 sm:pr-12"
                    />
                    <span className="text-meta pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 font-sans text-mute sm:inline">
                        ⌘K
                    </span>
                </div>
                <div className="ml-auto flex shrink-0 items-center gap-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                title={t('Ask Evo')}
                                aria-label={t('Ask Evo')}
                                data-chrome="ai"
                                onClick={() => setPaletteOpen(true)}
                            >
                                <Sparkle className="size-4" weight="regular" aria-hidden />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">{t('Ask Evo')}</TooltipContent>
                    </Tooltip>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="default"
                                title={t('Create')}
                                aria-label={t('Create')}
                                className="h-9 gap-1.5 px-3"
                            >
                                <Plus className="size-4" weight="bold" aria-hidden />
                                <span className="hidden sm:inline">{t('Create')}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem asChild>
                                <Link href="/crm/contacts?create=1">{t('Contact')}</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/crm/companies?create=1">{t('Company')}</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/crm/deals?create=1">{t('Deal')}</Link>
                            </DropdownMenuItem>
                            {canCreateQuote(capabilities) ? (
                                <DropdownMenuItem asChild>
                                    <Link href="/crm/quotes?create=1">{t('Quote')}</Link>
                                </DropdownMenuItem>
                            ) : null}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="hidden min-[390px]:block" data-chrome="notify">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    title={t('Tasks')}
                                    aria-label={
                                        taskCount > 0
                                            ? `${t('Tasks')} (${taskCount})`
                                            : t('Tasks')
                                    }
                                    onClick={() => setTasksOpen(true)}
                                >
                                    <Bell className="size-4" weight="regular" aria-hidden />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">{t('Tasks')}</TooltipContent>
                        </Tooltip>
                    </div>
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="icon"
                                    className="text-meta rounded-full bg-ink font-medium text-canvas"
                                    title={user.name}
                                    aria-label={t(':name account menu', { name: user.name })}
                                >
                                    {initials(user.name)}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64">
                                <UserMenuContent user={user} />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : null}
                </div>
            </header>
            <CommandPalette open={paletteOpen} onOpenChange={handlePaletteOpenChange} />
            <TasksOverlay open={tasksOpen} onOpenChange={setTasksOpen} />
        </>
    );
}
