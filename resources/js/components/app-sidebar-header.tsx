import { Link, usePage } from '@inertiajs/react';
import { Bell, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { CommandPalette, useCommandPaletteShortcut } from '@/components/crm/command-palette';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const { auth } = usePage().props;
    const initials = useInitials();
    const user = auth.user;
    const [paletteOpen, setPaletteOpen] = useState(false);
    void breadcrumbs;

    useCommandPaletteShortcut(() => setPaletteOpen(true));

    return (
        <>
            <header className="app-topbar sticky top-0 z-20 flex min-w-0 shrink-0 items-center gap-1.5 px-2 sm:gap-3 sm:px-4">
                <SidebarTrigger className="-ml-0.5 shrink-0 text-ink md:hidden" />
                <div className="relative mx-auto min-w-0 flex-1 sm:max-w-2xl">
                    <Input
                        readOnly
                        size="sm"
                        value=""
                        placeholder="Find a page"
                        aria-label="Find a page"
                        onClick={() => setPaletteOpen(true)}
                        onFocus={() => setPaletteOpen(true)}
                        startAdornment={
                            <Search className="size-4" aria-hidden />
                        }
                        className="cursor-pointer rounded-full pr-3 sm:pr-16"
                    />
                    <span className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 font-sans text-[var(--text-section-label)] text-mute sm:inline">
                        ⌘K
                    </span>
                </div>
                <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="default"
                                size="icon"
                                title="Create"
                                aria-label="Create"
                                className="rounded-full"
                            >
                                <Plus className="size-4" aria-hidden />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem asChild>
                                <Link href="/crm/contacts?create=1">Contact</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/crm/companies?create=1">Company</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/crm/deals?create=1">Deal</Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Notifications"
                        aria-label="Notifications"
                        className="hidden rounded-full min-[390px]:inline-flex"
                    >
                        <Bell className="size-4" aria-hidden />
                    </Button>
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="icon"
                                    className="rounded-full bg-ink text-[11px] font-medium text-canvas"
                                    title={user.name}
                                    aria-label={`${user.name} account menu`}
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
        </>
    );
}
