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
            <header
                className="flex h-[52px] shrink-0 items-center gap-2 border-b px-3 sm:gap-3 sm:px-4"
                style={{
                    borderColor: 'var(--aurora-border-default)',
                    background:
                        'linear-gradient(180deg, var(--aurora-panel-strong-top), var(--aurora-panel-strong))',
                    boxShadow: 'var(--aurora-highlight-medium)',
                }}
            >
                <SidebarTrigger
                    className="-ml-1 shrink-0 md:hidden"
                    style={{ color: 'var(--aurora-text-primary)' }}
                />
                <div className="relative mx-auto min-w-0 flex-1 sm:max-w-2xl">
                    <Input
                        readOnly
                        size="sm"
                        value=""
                        placeholder="Find or Ask"
                        aria-label="Open command palette"
                        onClick={() => setPaletteOpen(true)}
                        onFocus={() => setPaletteOpen(true)}
                        startAdornment={
                            <Search className="size-4" aria-hidden />
                        }
                        className="cursor-pointer rounded-full pr-12 sm:pr-16"
                    />
                    <span
                        className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 sm:inline"
                        style={{
                            color: 'var(--aurora-text-muted)',
                            fontFamily: 'var(--aurora-font-sans)',
                            fontSize: 'var(--aurora-type-caption)',
                        }}
                    >
                        ⌘K
                    </span>
                </div>
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
                                    className="rounded-full text-[11px] font-medium"
                                    style={{
                                        background: 'var(--aurora-text-primary)',
                                        color: 'var(--aurora-panel-strong)',
                                    }}
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
