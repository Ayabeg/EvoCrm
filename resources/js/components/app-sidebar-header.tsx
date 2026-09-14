/**
 * Canonical topbar (P02): Search/⌘K → command palette; Sparkle/Ask Evo → same
 * palette (Ask section waits for P16/P24); Create stays Create; one Tasks
 * overlay (not a second notify bell, not a competing /crm/activities topbar link).
 */
/**
 * Canonical topbar (P02): Search/⌘K → command palette; Sparkle/Ask Evo → same
 * palette (Ask section waits for P16/P24); Create stays Create; one Tasks
 * overlay (not a second notify bell, not a competing /crm/activities topbar link).
 */
import { Link, usePage } from '@inertiajs/react';
import { Bell, MagnifyingGlass, Plus, Sparkle } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
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
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
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
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [tasksOpen, setTasksOpen] = useState(false);
    void breadcrumbs;

    useCommandPaletteShortcut(() => setPaletteOpen(true));

    useEffect(() => {
        const open = () => setTasksOpen(true);
        window.addEventListener('openEvoTasks', open);

        return () => window.removeEventListener('openEvoTasks', open);
    }, []);

    return (
        <>
            <header className="app-topbar sticky top-0 z-20 flex min-w-0 shrink-0 items-center gap-1.5 px-2 sm:gap-3 sm:px-4">
                <div data-chrome="menu">
                    <SidebarTrigger className="-ml-0.5 shrink-0 text-ink" />
                </div>
                {collapsed ? (
                    <Link
                        href="/dashboard"
                        title="EvoCrm"
                        className="hidden shrink-0 items-center gap-2 md:flex"
                    >
                        <AppLogoIcon className="size-7" />
                        <span className="sr-only">EvoCrm</span>
                    </Link>
                ) : null}
                <div className="relative mx-auto min-w-0 flex-1 sm:max-w-2xl" data-chrome="search">
                    <Input
                        readOnly
                        size="sm"
                        value=""
                        placeholder={t('Search EvoCRM…')}
                        aria-label={t('Search EvoCRM…')}
                        onClick={() => setPaletteOpen(true)}
                        onFocus={() => setPaletteOpen(true)}
                        startAdornment={
                            <MagnifyingGlass className="size-4" weight="regular" aria-hidden />
                        }
                        className="cursor-pointer rounded-full pr-3 sm:pr-16"
                    />
                    <span className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 font-sans text-[var(--text-section-label)] text-mute sm:inline">
                        ⌘K
                    </span>
                </div>
                <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title={t('Ask Evo')}
                        aria-label={t('Ask Evo')}
                        data-chrome="ai"
                        className="rounded-full"
                        onClick={() => setPaletteOpen(true)}
                    >
                        <Sparkle className="size-4" weight="regular" aria-hidden />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="default"
                                size="icon"
                                title={t('Create')}
                                aria-label={t('Create')}
                                className="rounded-full"
                            >
                                <Plus className="size-4" weight="bold" aria-hidden />
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
                            <DropdownMenuItem asChild>
                                <Link href="/crm/quotes?create=1">{t('Quote')}</Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="hidden min-[390px]:block" data-chrome="notify">
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
                    </div>
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="icon"
                                    className="rounded-full bg-ink text-[11px] font-medium text-canvas"
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
            <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
            <TasksOverlay open={tasksOpen} onOpenChange={setTasksOpen} />
        </>
    );
}
