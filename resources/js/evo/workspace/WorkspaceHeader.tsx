import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { DotsThree } from '@/evo/icons';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/evo/ui/dropdown-menu';
import { isGreetingTitle } from '@/evo/workspace/routes';
import type { WorkspaceHeaderProps } from '@/evo/workspace/types';
import { t } from '@/lib/i18n';
import { LONG_TEXT_CLASS } from '@/lib/responsive';
import { cn } from '@/lib/utils';

function titleText(title: ReactNode): string {
    return typeof title === 'string' ? title : '';
}

export function WorkspaceHeader({
    leading,
    context,
    title,
    count,
    status,
    meta,
    secondaryActions,
    overflowActions = [],
    primaryAction,
    panels,
    views,
    viewItems,
    summary,
    search,
    filters,
    layoutToggle,
    chips,
    selection,
    archetype = 'workspace',
    sticky = false,
    className,
    density,
    dataCrm,
    dataDs,
    dataSettings,
}: WorkspaceHeaderProps) {
    const raw = titleText(title);
    const safeTitle = raw && isGreetingTitle(raw) ? t('Home') : title;
    const titleIsText = typeof safeTitle === 'string';
    const TitleTag = titleIsText ? 'h1' : 'div';
    const hasViews =
        Boolean(views) || (viewItems != null && viewItems.length > 0);
    const hasRow3 = Boolean(selection) || Boolean(chips);
    const overflowForced = overflowActions.length > 0;
    const showOverflow = overflowForced || Boolean(secondaryActions);
    const primaryCount = primaryAction ? 1 : 0;
    const conversationQuiet = archetype === 'conversation';
    const hasTitleAux = Boolean(
        leading ||
            context ||
            count ||
            status ||
            meta ||
            secondaryActions ||
            primaryAction ||
            panels ||
            overflowForced,
    );

    return (
        <header
            className={cn('workspace-header', className)}
            data-workspace="header"
            data-archetype={archetype}
            data-chrome={conversationQuiet ? 'quiet' : undefined}
            data-has-aux={hasTitleAux ? 'true' : 'false'}
            data-sticky={sticky ? 'true' : 'false'}
            data-density={density}
            data-has-primary={primaryAction ? 'true' : 'false'}
            data-primary-count={primaryCount}
            data-crm={dataCrm}
            data-ds={dataDs}
            data-settings={dataSettings}
        >
            <div
                className="workspace-header-title md:px-8"
                data-workspace-row="title"
            >
                {leading ? (
                    <div
                        className="workspace-header-leading"
                        data-workspace-slot="a"
                    >
                        {leading}
                    </div>
                ) : null}
                {context ? (
                    <div
                        className="min-w-0 text-[13px] text-[var(--evo-ink-secondary)]"
                        data-workspace-slot="b"
                    >
                        {context}
                    </div>
                ) : null}
                <div className="min-w-0">
                    <TitleTag
                        className={cn(
                            'workspace-header-title-text text-page-title',
                            LONG_TEXT_CLASS,
                            conversationQuiet && 'sr-only',
                        )}
                        data-workspace-slot="c"
                        title={raw || undefined}
                    >
                        {safeTitle}
                    </TitleTag>
                </div>
                {count ? (
                    <div data-workspace-slot="d">{count}</div>
                ) : null}
                {status ? (
                    <div data-workspace-slot="d-status">{status}</div>
                ) : null}
                {meta ? (
                    <div
                        className="workspace-header-meta max-[1023px]:hidden"
                        data-workspace-slot="e"
                    >
                        {meta}
                    </div>
                ) : null}
                <div className="workspace-header-actions">
                    {secondaryActions ? (
                        <div
                            className="workspace-header-secondary flex items-center gap-2"
                            data-workspace-slot="f"
                        >
                            {secondaryActions}
                        </div>
                    ) : null}
                    {showOverflow ? (
                        <div
                            className="workspace-header-overflow"
                            data-workspace-slot="g"
                            data-overflow-forced={overflowForced ? 'true' : 'false'}
                        >
                            <HeaderOverflow
                                actions={overflowActions}
                                extras={secondaryActions}
                            />
                        </div>
                    ) : null}
                    {primaryAction ? (
                        <div
                            className="workspace-header-primary"
                            data-workspace-slot="h"
                            data-workspace-primary="true"
                        >
                            {primaryAction}
                        </div>
                    ) : null}
                    {panels ? (
                        <div data-workspace-slot="i">{panels}</div>
                    ) : null}
                </div>
            </div>
            {hasViews || summary || search || filters || layoutToggle ? (
                <div
                    className="workspace-header-views"
                    data-workspace-row="views"
                >
                    {viewItems && viewItems.length > 0 ? (
                        <>
                            <nav
                                className="workspace-header-views-tabs flex min-w-0 gap-3 overflow-x-auto"
                                data-workspace-slot="j"
                                aria-label={t('Saved views')}
                            >
                                {viewItems.map((item) =>
                                    item.href ? (
                                        <Link
                                            key={item.id}
                                            href={item.href}
                                            className="workspace-header-view-item shrink-0 py-1 text-[13px]"
                                            data-active={item.active ? 'true' : 'false'}
                                        >
                                            {t(item.label)}
                                        </Link>
                                    ) : (
                                        <button
                                            key={item.id}
                                            type="button"
                                            className="workspace-header-view-item shrink-0 py-1 text-[13px]"
                                            data-active={item.active ? 'true' : 'false'}
                                            onClick={item.onSelect}
                                        >
                                            {t(item.label)}
                                        </button>
                                    ),
                                )}
                            </nav>
                            <label className="workspace-header-views-select sr-only min-[768px]:not-sr-only min-[768px]:hidden">
                                <span className="sr-only">{t('Saved views')}</span>
                                <select
                                    className="h-8 rounded-[6px] border border-[var(--evo-hairline)] bg-[var(--evo-surface)] px-2 text-[13px]"
                                    aria-label={t('Saved views')}
                                    value={
                                        viewItems.find((item) => item.active)?.id ??
                                        viewItems[0]?.id
                                    }
                                    onChange={(event) => {
                                        const next = viewItems.find(
                                            (item) => item.id === event.target.value,
                                        );
                                        next?.onSelect?.();
                                    }}
                                >
                                    {viewItems.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {t(item.label)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </>
                    ) : views ? (
                        <div
                            className="min-w-0 flex-1 overflow-x-auto"
                            data-workspace-slot="j"
                        >
                            {views}
                        </div>
                    ) : null}
                    {summary ? (
                        <div
                            className="workspace-header-summary max-[1023px]:hidden"
                            data-workspace-slot="l"
                        >
                            {summary}
                        </div>
                    ) : null}
                    {search ? (
                        <div data-workspace-slot="m">{search}</div>
                    ) : null}
                    {filters ? (
                        <div data-workspace-slot="n">{filters}</div>
                    ) : null}
                    {layoutToggle ? (
                        <div data-workspace-slot="q">{layoutToggle}</div>
                    ) : null}
                </div>
            ) : null}
            {hasRow3 ? (
                <div
                    className="workspace-header-chips"
                    data-workspace-row="chips"
                >
                    {selection ? (
                        <div data-workspace-slot="bulk">{selection}</div>
                    ) : (
                        <div data-workspace-slot="chips">{chips}</div>
                    )}
                </div>
            ) : null}
        </header>
    );
}

function HeaderOverflow({
    actions,
    extras,
}: {
    actions: NonNullable<WorkspaceHeaderProps['overflowActions']>;
    extras?: ReactNode;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="workspace-header-overflow-trigger"
                    aria-label={t('More actions')}
                >
                    <DotsThree className="size-4" weight="bold" aria-hidden />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {extras ? (
                    <div
                        className="flex flex-col gap-1 p-1 min-[1024px]:hidden"
                        data-workspace-overflow="secondary"
                    >
                        {extras}
                    </div>
                ) : null}
                {actions.map((action) =>
                    action.href ? (
                        <DropdownMenuItem key={action.id} asChild>
                            <Link
                                href={action.href}
                                className={
                                    action.destructive
                                        ? 'text-[var(--evo-danger)]'
                                        : undefined
                                }
                            >
                                {typeof action.label === 'string'
                                    ? t(action.label)
                                    : action.label}
                            </Link>
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem
                            key={action.id}
                            disabled={action.disabled}
                            className={
                                action.destructive
                                    ? 'text-[var(--evo-danger)]'
                                    : undefined
                            }
                            onSelect={action.onClick}
                        >
                            {typeof action.label === 'string'
                                ? t(action.label)
                                : action.label}
                        </DropdownMenuItem>
                    ),
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
