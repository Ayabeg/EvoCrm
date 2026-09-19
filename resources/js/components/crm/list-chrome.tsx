import { Link } from '@inertiajs/react';
import { CaretDown } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import type { EmptyKind } from '@/components/ui/empty-illustration';
import { EmptyState } from '@/components/ui/empty-state';
import { t } from '@/lib/i18n';

export type ListView = {
    key: string;
    label: string;
    href: string;
};

export function ColumnFilter({
    name,
    label,
    value,
    options,
}: {
    name: string;
    label: string;
    value?: string;
    options: { value: string; label: string }[];
}) {
    return (
        <label className="inline-flex h-7 items-center gap-1 rounded-sm border border-hairline px-2 text-[12px] text-ink">
            {label}
            <CaretDown className="size-3 text-muted-foreground" aria-hidden />
            <select
                name={name}
                defaultValue={value ?? ''}
                className="sr-only"
                onChange={(event) => event.currentTarget.form?.requestSubmit()}
            >
                <option value="">{label}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

export function CrmListFooter({
    count,
    noun,
    total,
    exportHref,
    page,
    lastPage,
    perPage = 25,
    prevHref,
    nextHref,
}: {
    count: number;
    noun: string;
    total?: number;
    exportHref?: string;
    page?: number;
    lastPage?: number;
    perPage?: number;
    prevHref?: string | null;
    nextHref?: string | null;
}) {
    const label =
        typeof total === 'number' && total > count
            ? t('Showing :count of :total :noun', {
                  count: count.toLocaleString(),
                  total: total.toLocaleString(),
                  noun: t(noun),
              })
            : t(':count :noun', { count: count.toLocaleString(), noun: t(noun) });

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline bg-canvas px-4 py-2 text-[12px] text-mute md:px-8">
            <span>{label}</span>
            <div className="flex items-center gap-3">
                {typeof page === 'number' && typeof lastPage === 'number' ? (
                    <nav
                        className="flex items-center gap-2"
                        aria-label={t('Pagination')}
                    >
                        {prevHref ? (
                            <Link href={prevHref} className="hover:text-ink">
                                {t('Prev')}
                            </Link>
                        ) : (
                            <span className="opacity-40">{t('Prev')}</span>
                        )}
                        <span>
                            {page} / {lastPage}
                        </span>
                        {nextHref ? (
                            <Link href={nextHref} className="hover:text-ink">
                                {t('Next')}
                            </Link>
                        ) : (
                            <span className="opacity-40">{t('Next')}</span>
                        )}
                        <span>{t(':per per page', { per: perPage })}</span>
                        <span className="sr-only">25 per page</span>
                    </nav>
                ) : null}
                {exportHref ? (
                    <a href={exportHref} className="hover:text-ink">
                        {t('Export')}
                    </a>
                ) : null}
            </div>
        </div>
    );
}

export function CrmEmptyState({
    title,
    line,
    actionLabel,
    onAction,
    kind,
    illustration,
}: {
    title: string;
    line: string;
    actionLabel?: string;
    onAction?: () => void;
    kind?: EmptyKind;
    illustration?: ReactNode;
}) {
    return (
        <div className="grid flex-1 place-items-center bg-canvas px-4 py-8 sm:px-6">
            <EmptyState
                density="page"
                kind={kind}
                illustration={illustration}
                title={t(title)}
                description={t(line)}
                as="h2"
                className="w-full max-w-md"
                action={
                    actionLabel && onAction ? (
                        <Button type="button" size="sm" onClick={onAction}>
                            {t(actionLabel)}
                        </Button>
                    ) : undefined
                }
            />
        </div>
    );
}
