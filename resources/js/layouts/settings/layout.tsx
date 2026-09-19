import { Link, router, usePage } from '@inertiajs/react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useSimpleMode } from '@/hooks/use-simple-mode';
import { t } from '@/lib/i18n';
import { LONG_TEXT_CLASS, PAGE_OVERFLOW_CLASS } from '@/lib/responsive';
import {
    filterSettingsDestinations,
    groupSettingsDestinations,
    isSettingsNavActive,
    visibleSettingsDestinations,
    WIDE_SETTINGS_COMPONENTS,
} from '@/lib/settings/ia';
import type { SettingsDestination } from '@/lib/settings/ia';
import { cn } from '@/lib/utils';
import type { Auth } from '@/types/auth';

function SettingsNavLinks({
    items,
    currentUrl,
}: {
    items: SettingsDestination[];
    currentUrl: string;
}) {
    return (
        <ul className="flex flex-col">
            {items.map((item) => {
                const active = isSettingsNavActive(item.href, currentUrl);

                return (
                    <li key={item.href}>
                        <Link
                            href={item.href}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                                'flex h-8 min-w-0 items-center border-l-2 px-2 text-[13px] leading-[18px] transition-colors',
                                active
                                    ? 'border-brand bg-[var(--color-accent-soft)] font-medium text-ink'
                                    : 'border-transparent text-mute hover:bg-white/70 hover:text-ink',
                            )}
                        >
                            <span className={LONG_TEXT_CLASS}>{t(item.title)}</span>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { currentUrl } = useCurrentUrl();
    const page = usePage<{ auth: Auth }>();
    const { auth } = page.props;
    const { features } = useSimpleMode();
    const [query, setQuery] = useState('');

    const canManageSettings = ['owner', 'admin'].includes(auth.user.role);
    const isOwner = auth.user.role === 'owner';

    const authorized = useMemo(
        () =>
            visibleSettingsDestinations({
                capabilities: auth.capabilities,
                canManageSettings,
                isOwner,
                smsEnabled: features.sms,
            }),
        [auth.capabilities, canManageSettings, isOwner, features.sms],
    );

    const visible = useMemo(
        () => filterSettingsDestinations(authorized, query),
        [authorized, query],
    );

    const groups = useMemo(
        () => groupSettingsDestinations(visible),
        [visible],
    );

    const wide = WIDE_SETTINGS_COMPONENTS.has(page.component);
    const selectValue =
        authorized.find((item) => isSettingsNavActive(item.href, currentUrl))
            ?.href ??
        authorized.find((item) => item.href === currentUrl)?.href ??
        '';

    return (
        <div
            data-settings="workspace"
            className={cn('flex min-h-full flex-col bg-canvas lg:flex-row', PAGE_OVERFLOW_CLASS)}
        >
            <aside
                data-settings="nav"
                className="shrink-0 border-b border-hairline bg-canvas lg:w-[15.5rem] lg:border-r lg:border-b-0"
            >
                <div className="px-3 pt-3 pb-2">
                    <p className="text-[11px] font-semibold tracking-wide text-mute uppercase">
                        {t('Settings')}
                    </p>
                    <label className="mt-2 block">
                        <span className="sr-only">{t('Filter settings')}</span>
                        <span className="relative block">
                            <MagnifyingGlass
                                className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-mute"
                                weight="regular"
                                aria-hidden
                            />
                            <input
                                type="search"
                                value={query}
                                onChange={(event) =>
                                    setQuery(event.target.value)
                                }
                                placeholder={t('Filter settings')}
                                autoComplete="off"
                                data-settings="search"
                                className="h-8 w-full rounded-[4px] border border-hairline bg-white pr-2 pl-7 text-[13px] leading-[18px] text-ink placeholder:text-mute focus-visible:border-brand focus-visible:outline-none"
                            />
                        </span>
                    </label>
                    <label className="mt-2 block lg:hidden">
                        <span className="sr-only">{t('Open a setting')}</span>
                        <select
                            data-settings="mobile-select"
                            value={selectValue}
                            onChange={(event) => {
                                if (event.target.value !== '') {
                                    router.visit(event.target.value);
                                }
                            }}
                            className="h-8 w-full rounded-[4px] border border-hairline bg-white px-2 text-[13px] leading-[18px] text-ink focus-visible:border-brand focus-visible:outline-none"
                        >
                            {visible.length === 0 ? (
                                <option value="">{t('No matching settings')}</option>
                            ) : (
                                groups.map((group) => (
                                    <optgroup
                                        key={group.title}
                                        label={t(group.title)}
                                    >
                                        {group.items.map((item) => (
                                            <option
                                                key={item.href}
                                                value={item.href}
                                            >
                                                {t(item.title)}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))
                            )}
                        </select>
                    </label>
                </div>
                <nav
                    aria-label={t('Settings')}
                    className="hidden flex-col gap-3 px-2 pb-4 lg:flex"
                >
                    {groups.length === 0 ? (
                        <p
                            role="status"
                            className="px-2 py-3 text-[13px] leading-5 text-mute"
                        >
                            {t('No matching settings')}
                        </p>
                    ) : (
                        groups.map((group) => (
                            <div
                                key={group.title}
                                data-settings-scope={group.scope}
                            >
                                <p className="px-2 pt-1 pb-0.5 text-[11px] font-medium text-mute">
                                    {t(group.title)}
                                </p>
                                <SettingsNavLinks
                                    items={group.items}
                                    currentUrl={currentUrl}
                                />
                            </div>
                        ))
                    )}
                </nav>
            </aside>

            <div
                data-settings="pane"
                className={cn(
                    'min-w-0 flex-1 overflow-x-hidden px-4 py-4 lg:px-6 lg:py-5',
                    wide ? '' : 'lg:max-w-[900px]',
                )}
            >
                {children}
            </div>
        </div>
    );
}
