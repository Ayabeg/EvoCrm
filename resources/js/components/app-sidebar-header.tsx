/**
 * Workspace utilities. Navigation and search live in the 288px shell.
 * Create stays this dropdown. One Tasks overlay. Ask Evo stays its own drawer.
 */
import { Link, usePage } from '@inertiajs/react';
import { Bell, Plus, Sparkle, Sun } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { TasksOverlay } from '@/components/crm/tasks-overlay';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAppearance } from '@/hooks/use-appearance';
import { useSimpleMode } from '@/hooks/use-simple-mode';
import { openAskEvo } from '@/lib/ask-evo';
import { canCreateQuote } from '@/lib/command-os';
import { t } from '@/lib/i18n';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const page = usePage();
    const { auth } = page.props;
    const { features } = useSimpleMode();
    const taskCount = Number(page.props.evoOpenTaskCount ?? 0);
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const capabilities = Array.isArray(auth.capabilities) ? auth.capabilities : [];
    const quoteWorkspace = page.url.split('?')[0]?.startsWith('/crm/quotes') ?? false;
    const [tasksOpen, setTasksOpen] = useState(false);
    void breadcrumbs;

    useEffect(() => {
        const openTasks = () => setTasksOpen(true);
        window.addEventListener('openEvoTasks', openTasks);

        return () => {
            window.removeEventListener('openEvoTasks', openTasks);
        };
    }, []);

    return (
        <>
            <header className="app-topbar sticky top-0 z-20 flex min-w-0 shrink-0 items-center gap-2">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 md:hidden"
                    title="EvoCRM"
                >
                    <AppLogoIcon className="size-6" />
                    <span className="text-[15px] font-semibold">EvoCRM</span>
                </Link>
                <div data-chrome="menu" className="md:hidden">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <SidebarTrigger className="-ml-0.5 h-9 w-9 shrink-0 text-ink" />
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Toggle sidebar</TooltipContent>
                    </Tooltip>
                </div>
                <div className="relative ml-auto flex shrink-0 items-center gap-1" data-chrome="utilities">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title={t('Appearance')}
                        aria-label={t('Appearance')}
                        onClick={() =>
                            updateAppearance(resolvedAppearance === 'dark' ? 'light' : 'dark')
                        }
                    >
                        <Sun className="size-4" weight="regular" aria-hidden />
                    </Button>
                    {features.ask_evo ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    title={t('Ask Evo')}
                                    aria-label={t('Ask Evo')}
                                    data-chrome="ai"
                                    className={quoteWorkspace ? 'hidden' : undefined}
                                    onClick={() => openAskEvo()}
                                >
                                    <Sparkle className="size-4" weight="regular" aria-hidden />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">{t('Ask Evo')}</TooltipContent>
                        </Tooltip>
                    ) : null}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="default"
                                title={t('Create')}
                                aria-label={t('Create')}
                                className="h-9 gap-2 px-3"
                                hidden={quoteWorkspace}
                            >
                                <Plus className="size-4" weight="bold" aria-hidden />
                                <span className="evo-create-label">{t('Create')}</span>
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
                                <Link href="/crm/leads?create=1">{t('Lead')}</Link>
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
                </div>
            </header>
            <TasksOverlay open={tasksOpen} onOpenChange={setTasksOpen} />
        </>
    );
}
