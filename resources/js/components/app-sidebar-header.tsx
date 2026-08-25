import { Link, usePage } from '@inertiajs/react';
import { Bell, Plus } from 'lucide-react';
import { useState } from 'react';
import { CommandPalette, useCommandPaletteShortcut } from '@/components/crm/command-palette';
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
                <button
                    type="button"
                    onClick={() => setPaletteOpen(true)}
                    className="relative mx-auto flex h-9 min-w-0 flex-1 items-center rounded-full border border-hairline bg-canvas-soft pr-9 pl-9 text-left text-[13px] text-muted-foreground outline-none hover:border-brand focus:border-brand sm:max-w-2xl sm:pr-16"
                >
                    <span className="pointer-events-none absolute left-3 text-muted-foreground">⌕</span>
                    <span className="truncate">Find or Ask</span>
                    <span className="pointer-events-none absolute right-3 hidden text-[11px] sm:inline">⌘K</span>
                </button>
                <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                title="Create"
                                className="grid size-8 place-content-center rounded-full border border-hairline text-ink hover:bg-canvas-soft"
                            >
                                <Plus className="size-4" />
                            </button>
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
                    <button
                        type="button"
                        title="Notifications"
                        className="grid size-8 place-content-center rounded-full text-ink hover:bg-canvas-soft"
                    >
                        <Bell className="size-4" />
                    </button>
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="grid size-8 place-content-center rounded-full bg-ink text-[11px] font-medium text-canvas"
                                    title={user.name}
                                >
                                    {initials(user.name)}
                                </button>
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
