import { Tray } from '@/evo/icons';
import { cn } from '@/evo/lib/cn';
import { SearchInput } from '@/evo/ui/search-input';
import { Skeleton } from '@/evo/ui/skeleton';
import { t } from '@/lib/i18n';

export function InboxPersonMark({
    name,
    initials,
    size = 'sm',
}: {
    name: string;
    initials: string;
    size?: 'sm' | 'md';
}) {
    return (
        <span
            aria-hidden
            title={name}
            className={cn(
                'grid shrink-0 place-items-center rounded-[var(--evo-radius-compact)] bg-[var(--evo-surface-subtle)] font-medium text-[var(--evo-ink)]',
                size === 'md' ? 'size-8 text-[11px]' : 'size-7 text-[10px]',
            )}
        >
            {initials || '?'}
        </span>
    );
}

export function InboxCaughtUpMark() {
    return (
        <span
            aria-hidden
            className="mx-auto mb-3 grid size-10 place-items-center border border-dashed border-[var(--evo-hairline)] bg-[var(--evo-surface-subtle)] text-[var(--evo-ink-muted)]"
        >
            <Tray className="size-5" weight="regular" />
        </span>
    );
}

export function InboxStatusBanner({
    embedState,
    embedReason,
    configuredUrl,
}: {
    embedState: 'ok' | 'blocked' | 'unreachable' | 'no-url';
    embedReason: string | null;
    configuredUrl: string | null;
}) {
    if (embedState === 'ok' || embedState === 'no-url') {
        return null;
    }

    const host = configuredUrl ? safeHost(configuredUrl) : 'Desk';
    const title =
        embedState === 'blocked'
            ? t(':host is not framed here', { host })
            : t(':host could not be reached', { host });

    return (
        <div
            role="status"
            data-crm="inbox-embed-banner"
            className="border-b border-[var(--evo-hairline)] bg-[var(--evo-surface)] px-4 py-2 text-[12px] leading-5 text-[var(--evo-ink-muted)]"
        >
            <p>
                <span className="font-medium text-[var(--evo-ink)]">{title}.</span>{' '}
                {embedReason ? t(embedReason) : t('Showing the CRM inbox. Desk stays on this host.')}
            </p>
        </div>
    );
}

export function InboxEmbedSkeleton() {
    return (
        <div
            aria-busy="true"
            aria-label={t('Loading desk')}
            className="absolute inset-0 z-10 grid grid-cols-[13rem_minmax(18rem,22rem)_minmax(0,1fr)] gap-px bg-[var(--evo-hairline)]"
        >
            <div className="bg-[var(--evo-surface)] p-3">
                {Array.from({ length: 8 }).map((_, index) => (
                    <Skeleton key={`folder-${index}`} className="mb-2 h-3" />
                ))}
            </div>
            <div className="bg-[var(--evo-surface)]">
                {Array.from({ length: 9 }).map((_, index) => (
                    <div
                        key={`row-${index}`}
                        className="flex items-center gap-2 border-b border-[var(--evo-hairline)] px-3 py-2.5"
                    >
                        <Skeleton className="size-7 shrink-0" />
                        <div className="min-w-0 flex-1 space-y-1.5">
                            <Skeleton className="h-2.5 w-2/3" />
                            <Skeleton className="h-2 w-full" />
                        </div>
                    </div>
                ))}
            </div>
            <div className="bg-[var(--evo-surface)] p-4">
                <Skeleton className="mb-4 h-4 w-40" />
                <Skeleton className="h-16 w-3/5" />
                <Skeleton className="mt-3 ms-auto h-12 w-2/5" />
            </div>
        </div>
    );
}

export function InboxListHeader({
    query,
    count,
    onQueryChange,
}: {
    query: string;
    count: number;
    onQueryChange: (value: string) => void;
}) {
    return (
        <div
            data-inbox="conversation-list-header"
            className="border-b border-[var(--evo-hairline)] px-3 py-1.5"
        >
            <div className="flex items-center justify-between gap-2">
                <p className="text-[12px] font-medium text-[var(--evo-ink)]">{t('Inbox')}</p>
                <p
                    className="font-mono text-[11px] text-[var(--evo-ink-muted)] tabular-nums"
                    aria-label={t(':count conversations', { count })}
                >
                    {count}
                </p>
            </div>
            <label className="mt-1.5 block">
                <span className="sr-only">{t('Filter loaded conversations')}</span>
                <SearchInput
                    value={query}
                    onChange={(event) => onQueryChange(event.target.value)}
                    placeholder={t('Filter by name or subject')}
                    autoComplete="off"
                    size="sm"
                />
            </label>
        </div>
    );
}

function safeHost(url: string): string {
    try {
        return new URL(url).host;
    } catch {
        return url;
    }
}
