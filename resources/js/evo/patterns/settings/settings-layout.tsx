/**
 * Settings workspace shell — section nav, search, and dialog chrome.
 * Canonical owner for settings-archetype pages. IA catalog stays in `@/lib/settings/ia`.
 */
import { Link, router, usePage } from '@inertiajs/react';
import * as Dialog from '@radix-ui/react-dialog';
import { useId, useMemo, useState } from 'react';
import type { KeyboardEvent, PropsWithChildren } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { MagnifyingGlass, X } from '@/evo/icons';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useSimpleMode } from '@/hooks/use-simple-mode';
import { t } from '@/lib/i18n';
import { MOTION_HOVER_CLASS, MOTION_MODAL_CLASS } from '@/lib/motion';
import { LONG_TEXT_CLASS, PAGE_OVERFLOW_CLASS } from '@/lib/responsive';
import {
    filterSettingsDestinations,
    groupSettingsDestinations,
    isSettingsNavActive,
    visibleSettingsDestinations,
    WIDE_SETTINGS_COMPONENTS,
} from '@/lib/settings/ia';
import type { SettingsDestination } from '@/lib/settings/ia';
import { settingsDestinationIcon } from '@/lib/settings/icons';
import { cn } from '@/lib/utils';
import type { Auth } from '@/types/auth';

const SETTINGS_CLOSE_HREF = '/dashboard';

function closeSettings(): void {
    router.visit(SETTINGS_CLOSE_HREF);
}

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
                const Icon = settingsDestinationIcon(item.href);

                return (
                    <li key={item.href}>
                        <Link
                            href={item.href}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                                'flex h-8 min-w-0 items-center gap-2 border-s-2 px-2 text-[13px] leading-[18px]',
                                MOTION_HOVER_CLASS,
                                active
                                    ? 'border-brand bg-[var(--color-accent-soft)] font-medium text-ink'
                                    : 'border-transparent text-mute hover:bg-white/70 hover:text-ink',
                            )}
                        >
                            <Icon
                                className={cn(
                                    'size-3.5 shrink-0',
                                    active ? 'text-brand' : 'text-mute',
                                )}
                                weight="regular"
                                aria-hidden
                            />
                            <span className={LONG_TEXT_CLASS}>{t(item.title)}</span>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}

function SettingsSearchResults({
    results,
    activeIndex,
    onHover,
    titleId,
}: {
    results: SettingsDestination[];
    activeIndex: number;
    onHover: (index: number) => void;
    titleId: string;
}) {
    if (results.length === 0) {
        return (
            <p
                role="status"
                id={titleId}
                className="px-2 py-3 text-[13px] leading-5 text-mute"
            >
                {t('No matching settings')}
            </p>
        );
    }

    return (
        <ul
            id={titleId}
            role="listbox"
            aria-label={t('Search results')}
            className="flex flex-col pb-2"
        >
            {results.map((item, index) => {
                const Icon = settingsDestinationIcon(item.href);
                const active = index === activeIndex;

                return (
                    <li key={item.href} role="presentation">
                        <Link
                            id={`settings-search-result-${index}`}
                            href={item.href}
                            role="option"
                            aria-selected={active}
                            onMouseEnter={() => onHover(index)}
                            className={cn(
                                'flex h-9 min-w-0 items-center gap-2 rounded-[4px] px-2 text-[13px] leading-[18px]',
                                MOTION_HOVER_CLASS,
                                active
                                    ? 'bg-[var(--color-accent-soft)] text-ink'
                                    : 'text-mute hover:bg-white/70 hover:text-ink',
                            )}
                        >
                            <Icon
                                className="size-3.5 shrink-0 text-mute"
                                weight="regular"
                                aria-hidden
                            />
                            <span className={LONG_TEXT_CLASS}>{t(item.title)}</span>
                            <span className="ms-auto shrink-0 text-[11px] text-mute">
                                {t(item.group)}
                            </span>
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
    const [activeIndex, setActiveIndex] = useState(0);
    const titleId = useId();
    const resultsId = useId();

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

    const searching = query.trim() !== '';
    const wide = WIDE_SETTINGS_COMPONENTS.has(page.component);
    const selectValue =
        authorized.find((item) => isSettingsNavActive(item.href, currentUrl))
            ?.href ??
        authorized.find((item) => item.href === currentUrl)?.href ??
        '';

    const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Escape' && query) {
            event.preventDefault();
            event.stopPropagation();
            setQuery('');
            setActiveIndex(0);

            return;
        }

        if (!searching || visible.length === 0) {
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((index) => (index + 1) % visible.length);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((index) => (index - 1 + visible.length) % visible.length);
        } else if (event.key === 'Enter') {
            event.preventDefault();
            const next = visible[activeIndex];

            if (next) {
                router.visit(next.href);
            }
        }
    };

    const searchField = (
        <label className="block">
            <span className="sr-only">{t('Search settings')}</span>
            <span className="relative block">
                <MagnifyingGlass
                    className="pointer-events-none absolute top-1/2 start-3 size-3.5 -translate-y-1/2 text-mute"
                    weight="regular"
                    aria-hidden
                />
                <input
                    type="search"
                    value={query}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setActiveIndex(0);
                    }}
                    onKeyDown={onSearchKeyDown}
                    placeholder={t('Filter settings')}
                    autoComplete="off"
                    data-settings="search"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-controls={resultsId}
                    aria-expanded={searching}
                    aria-activedescendant={
                        searching && visible.length > 0
                            ? `settings-search-result-${activeIndex}`
                            : undefined
                    }
                    className="h-8 w-full appearance-none rounded-[4px] border border-hairline bg-white pe-2 ps-10 text-[13px] leading-[18px] text-ink placeholder:text-mute focus-visible:border-brand focus-visible:outline-none"
                />
            </span>
        </label>
    );

    const groupedNav = (
        <>
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
        </>
    );

    const mobileSelect = (
        <label className="block sm:hidden">
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
    );

    const mobileTabs = (
        <nav
            data-settings="mobile-tabs"
            aria-label={t('Settings sections')}
            className="flex gap-1 overflow-x-auto px-3 py-2 sm:hidden"
        >
            {authorized.map((item) => {
                const active = isSettingsNavActive(item.href, currentUrl);
                const Icon = settingsDestinationIcon(item.href);

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                            'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[4px] border px-2 text-[12px] leading-4',
                            MOTION_HOVER_CLASS,
                            active
                                ? 'border-brand bg-[var(--color-accent-soft)] font-medium text-ink'
                                : 'border-hairline bg-white text-mute hover:text-ink',
                        )}
                    >
                        <Icon className="size-3.5" weight="regular" aria-hidden />
                        {t(item.title)}
                    </Link>
                );
            })}
        </nav>
    );

    return (
        <>
            <div
                aria-hidden
                className={cn('min-h-full bg-canvas', PAGE_OVERFLOW_CLASS)}
            />
            <Dialog.Root
                open
                onOpenChange={(next) => {
                    if (!next) {
                        closeSettings();
                    }
                }}
            >
                <Dialog.Portal>
                    <Dialog.Overlay
                        className={cn(
                            'fixed inset-0 z-50 bg-black/45',
                            MOTION_MODAL_CLASS,
                        )}
                    />
                    <Dialog.Content
                        aria-labelledby={titleId}
                        data-settings="dialog"
                        className={cn(
                            'fixed inset-0 z-50 flex flex-col bg-[var(--settings-surface,var(--evo-surface))] sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-[min(800px,calc(100dvh-2rem))] sm:w-[min(1120px,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[8px] sm:border sm:border-hairline sm:shadow-[var(--settings-shadow)]',
                            MOTION_MODAL_CLASS,
                            PAGE_OVERFLOW_CLASS,
                        )}
                    >
                        <div
                            data-settings="workspace"
                            className={cn(
                                'flex min-h-0 flex-1 flex-col bg-canvas sm:flex-row',
                                PAGE_OVERFLOW_CLASS,
                            )}
                        >
                            <aside
                                data-settings="nav"
                                className="shrink-0 border-b border-hairline bg-[var(--settings-canvas,var(--evo-canvas))] sm:flex sm:w-[16.25rem] sm:flex-col sm:border-e sm:border-b-0"
                            >
                                <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                                    <AppLogoIcon className="size-6" alt={t('EvoCrm')} />
                                    <Dialog.Title
                                        id={titleId}
                                        className="text-[15px] font-semibold tracking-tight text-ink"
                                    >
                                        {t('Settings')}
                                    </Dialog.Title>
                                    <Dialog.Description className="sr-only">
                                        {t('Search settings')}
                                    </Dialog.Description>
                                    <Dialog.Close
                                        className={cn(
                                            'ms-auto grid size-8 place-content-center rounded-[4px] text-mute hover:bg-white hover:text-ink sm:hidden',
                                            MOTION_HOVER_CLASS,
                                        )}
                                        aria-label={t('Close settings')}
                                    >
                                        <X className="size-4" weight="regular" aria-hidden />
                                    </Dialog.Close>
                                </div>
                                <div className="grid gap-2 px-3 pb-2">
                                    {searchField}
                                    {mobileSelect}
                                </div>
                                {searching ? null : mobileTabs}
                                <nav
                                    aria-label={t('Settings')}
                                    className="hidden min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-2 pb-4 sm:flex"
                                >
                                    {searching ? (
                                        <SettingsSearchResults
                                            results={visible}
                                            activeIndex={activeIndex}
                                            onHover={setActiveIndex}
                                            titleId={resultsId}
                                        />
                                    ) : (
                                        groupedNav
                                    )}
                                </nav>
                            </aside>

                            <div
                                data-settings="pane"
                                className={cn(
                                    'relative min-h-0 min-w-0 flex-1 overflow-y-auto bg-white px-4 py-4 sm:px-6 sm:py-5',
                                    PAGE_OVERFLOW_CLASS,
                                    wide ? '' : 'sm:max-w-none',
                                )}
                                style={{ containerType: 'inline-size', containerName: 'settings-panel' }}
                            >
                                <div className="sticky top-0 z-1 flex h-0 justify-end">
                                    <Dialog.Close
                                        className={cn(
                                            'mt-0 hidden size-8 place-content-center rounded-[4px] bg-white text-mute hover:bg-canvas hover:text-ink sm:grid',
                                            MOTION_HOVER_CLASS,
                                        )}
                                        aria-label={t('Close settings')}
                                    >
                                        <X className="size-4" weight="regular" aria-hidden />
                                    </Dialog.Close>
                                </div>
                                {searching ? (
                                    <div className="sm:hidden">
                                        <SettingsSearchResults
                                            results={visible}
                                            activeIndex={activeIndex}
                                            onHover={setActiveIndex}
                                            titleId={`${resultsId}-mobile`}
                                        />
                                    </div>
                                ) : (
                                    children
                                )}
                            </div>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </>
    );
}
