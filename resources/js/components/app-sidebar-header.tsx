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
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs: _breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { auth } = usePage().props;
    const initials = useInitials();
    const user = auth.user;
    const [paletteOpen, setPaletteOpen] = useState(false);

    useCommandPaletteShortcut(() => setPaletteOpen(true));

    return (
        <>
            <header className="flex h-[52px] shrink-0 items-center gap-2 border-b border-hairline bg-canvas px-3 sm:gap-3 sm:px-4">
                <SidebarTrigger className="-ml-1 shrink-0 md:hidden" />
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPaletteOpen(true)}
                    className="relative mx-auto h-9 min-w-0 flex-1 justify-start gap-2 rounded-full border-hairline bg-canvas-soft pr-3 pl-9 text-left text-[13px] font-normal text-muted-foreground sm:max-w-2xl sm:pr-16"
                >
                    <Search
                        className="pointer-events-none absolute left-3 size-4 text-muted-foreground"
                        aria-hidden
                    />
                    <span className="truncate sm:hidden">Search</span>
                    <span className="hidden truncate sm:inline">Find or Ask</span>
                    <span className="pointer-events-none absolute right-3 hidden text-[11px] sm:inline">
                        ⌘K
                    </span>
                </Button>
                <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                title="Create"
                                className="rounded-full"
                            >
                                <Plus className="size-4" />
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
                        className="rounded-full"
                    >
                        <Bell className="size-4" />
                    </Button>
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="icon"
                                    className="rounded-full bg-ink text-[11px] font-medium text-canvas hover:bg-ink/90"
                                    title={user.name}
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
