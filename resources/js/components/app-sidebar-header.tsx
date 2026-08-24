import { Link, usePage } from '@inertiajs/react';
import { Bell, Plus, Search } from 'lucide-react';
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

    return (
        <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-hairline bg-canvas px-4">
            <SidebarTrigger className="-ml-1 md:hidden" />
            <form
                action="/crm/contacts"
                method="get"
                className="relative mx-auto flex h-9 w-full max-w-2xl items-center"
            >
                <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
                <input
                    name="q"
                    placeholder="Find or Ask"
                    className="h-9 w-full rounded-full border border-hairline bg-canvas-soft pr-16 pl-9 text-[13px] outline-none focus:border-brand"
                />
                <span className="pointer-events-none absolute right-3 text-[11px] text-muted-foreground">
                    ⌘K
                </span>
            </form>
            <div className="flex items-center gap-1.5">
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
    );
}
