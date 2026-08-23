import { usePage } from '@inertiajs/react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSidebar } from '@/components/ui/sidebar';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

/**
 * EvoDesk (Chatwoot) SidebarProfileMenu: square initial avatar with a green
 * online dot, name + email, opening the existing profile/logout menu.
 * The rail is always dark, so the Chatwoot dark avatar pairs are used.
 */
const DARK_AVATAR_COLORS: [string, string][] = [
    ['#4B143D', '#FF8DCC'],
    ['#3F220D', '#FFA366'],
    ['#2A2A2A', '#ADB1B8'],
    ['#023B37', '#0BD8B6'],
    ['#27264D', '#A19EFF'],
    ['#1D2E62', '#9EB1FF'],
];

function SidebarAvatar({
    name,
    src,
    size = 32,
}: {
    name: string;
    src?: string;
    size?: number;
}) {
    const getInitials = useInitials();
    const [bg, fg] =
        DARK_AVATAR_COLORS[name.length % DARK_AVATAR_COLORS.length];
    const badgeSize = Math.max(size * 0.35, 8);
    const badgeOffset = size - badgeSize / 1.1;

    return (
        <span
            className="relative z-0 inline-flex flex-shrink-0 align-middle"
            style={{ width: size, height: size }}
        >
            <div
                className="absolute z-20 rounded-full border border-sidebar-hover bg-sidebar-online"
                style={{
                    width: badgeSize,
                    height: badgeSize,
                    top: badgeOffset,
                    left: badgeOffset,
                }}
            />
            <span
                role="img"
                className="relative inline-flex items-center justify-center overflow-hidden rounded-lg object-cover font-medium outline outline-1 -outline-offset-1 outline-[rgb(255_255_255_/_0.04)]"
                style={{
                    width: size,
                    height: size,
                    backgroundColor: src ? undefined : bg,
                    color: src ? undefined : fg,
                }}
            >
                {src ? (
                    <img src={src} alt={name} />
                ) : (
                    <span
                        className="select-none"
                        style={{ fontSize: Math.min(size / 2.5, 24) }}
                    >
                        {getInitials(name)}
                    </span>
                )}
            </span>
        </span>
    );
}

export function NavUser() {
    const { auth } = usePage().props;
    const { state } = useSidebar();
    const isMobile = useIsMobile();
    const collapsed = state === 'collapsed' && !isMobile;

    if (!auth.user) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    title={collapsed ? auth.user.name : undefined}
                    className={cn(
                        'flex cursor-pointer items-center gap-2 rounded-lg p-1 text-left hover:bg-sidebar-overlay data-[state=open]:bg-sidebar-overlay',
                        collapsed ? 'justify-center' : 'w-full',
                    )}
                    data-test="sidebar-menu-button"
                >
                    <SidebarAvatar
                        name={auth.user.name}
                        src={auth.user.avatar}
                        size={32}
                    />
                    {!collapsed && (
                        <div className="min-w-0">
                            <div className="truncate text-sm leading-4 font-medium text-sidebar-ink">
                                {auth.user.name}
                            </div>
                            <div className="truncate text-xs text-sidebar-mute">
                                {auth.user.email}
                            </div>
                        </div>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-64 min-w-56 rounded-lg"
                align="start"
                side="top"
                sideOffset={8}
            >
                <UserMenuContent user={auth.user} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
