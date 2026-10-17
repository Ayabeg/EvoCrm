import { Link, router, usePage } from '@inertiajs/react';
import { GearSix, SignOut } from '@phosphor-icons/react';
import {
    LANGUAGE_OPTIONS,
    persistLocale,
} from '@/components/language-selector';
import { UserInfo } from '@/components/user-info';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from '@/evo/ui/dropdown-menu';
import { useAppearance } from '@/hooks/use-appearance';
import type { Appearance } from '@/hooks/use-appearance';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { isAppLocale, t } from '@/lib/i18n';
import { logout } from '@/routes';
import { edit } from '@/routes/profile';
import type { User } from '@/types/auth';

type Props = {
    user: User;
};

export function UserMenuContent({ user }: Props) {
    const cleanup = useMobileNavigation();
    const { appearance, updateAppearance } = useAppearance();
    const pageLocale = usePage().props.locale;
    const locale = isAppLocale(pageLocale) ? pageLocale : 'en';

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-2 text-start text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link
                        className="block w-full cursor-pointer"
                        href={edit()}
                        prefetch
                        onClick={cleanup}
                    >
                        <GearSix className="me-2 size-4" weight="regular" aria-hidden />
                        {t('Profile')}
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        {t('Appearance')}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        <DropdownMenuRadioGroup
                            value={appearance}
                            onValueChange={(value) =>
                                updateAppearance(value as Appearance)
                            }
                        >
                            <DropdownMenuRadioItem value="light">
                                {t('Light')}
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="dark">
                                {t('Dark')}
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="system">
                                {t('System')}
                            </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        {t('Language')}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        {LANGUAGE_OPTIONS.map((option) => (
                            <DropdownMenuItem
                                key={option.value}
                                onClick={() => persistLocale(option.value)}
                            >
                                {option.label}
                                {locale === option.value ? (
                                    <span className="ms-auto text-[11px]">✓</span>
                                ) : null}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem
                    onClick={() => {
                        window.dispatchEvent(new Event('openEvoShortcuts'));
                    }}
                >
                    {t('Shortcuts')}
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link
                    className="block w-full cursor-pointer"
                    href={logout()}
                    as="button"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <SignOut className="me-2 size-4" weight="regular" aria-hidden />
                    {t('Log out')}
                </Link>
            </DropdownMenuItem>
        </>
    );
}
